import type { Metadata } from "next";
import { pageTitle, type CirclePayload } from "@/lib/circle";
import { isToken, kvConfigured, kvGetJson } from "@/lib/server/kv";
import { CirclePublic } from "./CirclePublic";
import { todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

async function load(token: string): Promise<CirclePayload | null> {
  if (token === "local" || !isToken(token) || !kvConfigured()) return null;
  try {
    const rec = await kvGetJson<{ payload: CirclePayload }>(`circle:${token}`);
    return rec?.payload ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const payload = await load(token);
  return {
    title: payload ? { absolute: `${pageTitle(payload)} · Saheli` } : "Circle",
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await load(token);
  return <CirclePublic token={token} payload={payload} serverToday={todayISO()} />;
}
