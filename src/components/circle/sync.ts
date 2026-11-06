"use client";

import { buildPayload } from "@/lib/circle";
import { todayISO } from "@/lib/dates";
import { activeProfileStore, useAppStore } from "@/lib/store";
import type { CircleMember } from "@/lib/types";

let configuredCache: Promise<boolean> | null = null;

/** Is the small server store switched on? Samples never use it. */
export function circleConfigured(): Promise<boolean> {
  if (useAppStore.getState().sample) return Promise.resolve(false);
  configuredCache ??= fetch("/api/circle")
    .then((r) => r.json())
    .then((j: { configured?: boolean }) => !!j.configured)
    .catch(() => false);
  return configuredCache;
}

function payloadFor(member: CircleMember) {
  return buildPayload(activeProfileStore().getState(), member, todayISO());
}

/** Create a private server link for one person. Returns false if it couldn't (she still gets a self-contained link). */
export async function createLink(member: CircleMember): Promise<boolean> {
  if (!(await circleConfigured())) return false;
  try {
    const r = await fetch("/api/circle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: payloadFor(member) }),
    });
    const j = (await r.json()) as { ok?: boolean; token?: string; secret?: string };
    if (!j.ok || !j.token || !j.secret) return false;
    activeProfileStore().getState().updateCircleMember(member.id, { token: j.token, secret: j.secret, status: "synced" });
    return true;
  } catch {
    return false;
  }
}

/** Push the latest schedule for one person. */
export async function syncMember(member: CircleMember): Promise<void> {
  if (!member.token || !member.secret || !(await circleConfigured())) return;
  try {
    const r = await fetch("/api/circle", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: member.token, secret: member.secret, payload: payloadFor(member) }),
    });
    const j = (await r.json()) as { ok?: boolean };
    activeProfileStore().getState().updateCircleMember(member.id, { status: j.ok ? "synced" : "waiting" });
  } catch {
    activeProfileStore().getState().updateCircleMember(member.id, { status: "waiting" });
  }
}

export async function deleteLink(member: CircleMember): Promise<void> {
  if (!member.token || !member.secret || !(await circleConfigured())) return;
  try {
    await fetch("/api/circle", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: member.token, secret: member.secret }),
    });
  } catch {
    /* the link expires on its own */
  }
}

const synced = new Set<string>();

/** Runs once per profile each time she opens Saheli, so every link shows today's schedule. */
export function syncAllOnOpen(profileId: string) {
  if (synced.has(profileId)) return;
  synced.add(profileId);
  for (const m of activeProfileStore().getState().circle) void syncMember(m);
}
