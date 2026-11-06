"use client";

import { useEffect, useState } from "react";
import { Check, Eye, MessageSquare, Plus, ShieldCheck, UserPlus, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { PersonView } from "./PersonView";
import { circleConfigured, createLink, deleteLink, syncMember } from "./sync";
import {
  buildPayload,
  circleLink,
  defaultShares,
  inviteText,
  modeFor,
  RELATIONS,
  SHARE_OPTIONS,
  shareGroup,
  type CircleMode,
  type Relation,
} from "@/lib/circle";
import { todayISO } from "@/lib/dates";
import { cleanPhone, smsLink } from "@/lib/helplines";
import { activeProfileStore, newId, useAppStore, useProfileStore } from "@/lib/store";
import type { CircleMember } from "@/lib/types";

const STEPS = [
  { title: "Add someone you trust", line: "Choose what they can see. You can change it any time." },
  { title: "Send their private link", line: "By WhatsApp, text or copy link. No app or account needed." },
  { title: "They see how you may be feeling", line: "And small, kind ways to help you today." },
  { title: "It stays up to date", line: "Their page updates whenever you open Saheli. Pause or remove anyone, any time." },
];

function useMode(): CircleMode {
  const data = useProfileStore((s) => s);
  return modeFor(data, todayISO());
}

export function CirclePage() {
  const circle = useProfileStore((s) => s.circle);
  const her = useProfileStore((s) => s.profile?.name) ?? "";
  const mode = useMode();
  const [adding, setAdding] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    let live = true;
    void circleConfigured().then((c) => live && setConfigured(c));
    return () => {
      live = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Circle"
        title="Let your people in, gently"
        lead="Help the people who love you understand how you may be feeling, and how to help. They only ever see a kind summary, never your logs."
      />
      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="card">
          <h2 className="font-display text-[1.45rem] leading-tight text-ink">Your Circle</h2>
          {circle.length === 0 && !adding && (
            <p className="mt-2 text-[15px] text-ink-soft">No one yet. Add your partner, a parent, a sister or a friend.</p>
          )}
          <ul className="mt-3 divide-y divide-line">
            {circle.map((m) => (
              <MemberRow key={m.id} member={m} her={her} mode={mode} configured={configured} />
            ))}
          </ul>
          {adding ? (
            <AddForm mode={mode} configured={configured} onDone={() => setAdding(false)} />
          ) : (
            <button type="button" className="btn btn-primary mt-4" onClick={() => setAdding(true)}>
              <UserPlus size={17} aria-hidden /> Add someone
            </button>
          )}
          {!configured && circle.length > 0 && (
            <p className="mt-4 text-sm text-ink-soft">
              Links are self-contained for now: they show today&apos;s schedule and look ahead from it. Send a fresh link if anything changes a lot.
            </p>
          )}
        </section>

        <section className="card">
          <h2 className="font-display text-[1.45rem] leading-tight text-ink">How Circle works</h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-on-primary tabular">{i + 1}</span>
                <span>
                  <span className="block font-semibold leading-snug text-ink">{s.title}</span>
                  <span className="block text-sm text-ink-soft">{s.line}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 flex gap-2.5 rounded-2xl bg-surface-2 p-3.5 text-sm text-ink">
            <ShieldCheck size={17} className="mt-[2px] shrink-0 text-accent-ink" aria-hidden />
            Only a schedule of your phases, or your life stage, is shared. Never your logs, moods, food, journal, chats or intimate symptoms.
          </p>
        </section>
      </div>
    </>
  );
}

/* ---------------- One person ---------------- */

function statusLabel(m: CircleMember, configured: boolean): string {
  if (m.paused) return "Paused";
  if (m.token) return m.status === "synced" ? "Synced today" : "Waiting to sync";
  if (m.status === "not-shared") return "Link not sent yet";
  return configured || m.status === "waiting" ? "Waiting to sync" : "Link sent";
}

function MemberRow({ member: m, her, mode, configured }: { member: CircleMember; her: string; mode: CircleMode; configured: boolean }) {
  const [panel, setPanel] = useState<"none" | "see" | "change" | "remove">("none");
  const [copied, setCopied] = useState(false);
  const store = activeProfileStore();
  const today = todayISO();

  function payload() {
    return buildPayload(store.getState(), m, today);
  }
  function link() {
    return circleLink(window.location.origin, m, payload());
  }
  function sent() {
    if (m.status === "not-shared") store.getState().updateCircleMember(m.id, { status: m.token ? "synced" : "waiting" });
  }
  const herFirst = her.trim().split(/\s+/)[0] || "I";
  const message = () => inviteText(herFirst, m.name.split(/\s+/)[0], link());

  function whatsapp() {
    const phone = m.phone ? cleanPhone(m.phone).replace(/^\+/, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message())}`, "_blank", "noopener");
    sent();
  }
  function text() {
    window.location.href = m.phone ? smsLink(m.phone, message()) : `sms:?&body=${encodeURIComponent(message())}`;
    sent();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      sent();
    } catch {
      window.prompt("Copy this link", link());
    }
  }
  function pause() {
    const next = { ...m, paused: !m.paused };
    store.getState().updateCircleMember(m.id, { paused: next.paused });
    void syncMember(next);
  }
  async function remove() {
    await deleteLink(m);
    store.getState().removeCircleMember(m.id);
  }

  return (
    <li className="py-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-display text-lg text-on-primary" aria-hidden>
          {(m.name[0] ?? "?").toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{m.name}</p>
          <p className="text-sm text-ink-soft">
            {m.relation} · {statusLabel(m, configured)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 sm:pl-[52px]">
        <button type="button" onClick={whatsapp} className="btn btn-sm bg-whatsapp text-white hover:brightness-105">
          <WhatsAppIcon size={16} /> WhatsApp
        </button>
        <button type="button" onClick={text} className="btn btn-secondary btn-sm">
          <MessageSquare size={15} aria-hidden /> Text
        </button>
        <button type="button" onClick={() => setPanel(panel === "see" ? "none" : "see")} className="btn btn-secondary btn-sm" aria-expanded={panel === "see"}>
          <Eye size={15} aria-hidden /> What they see
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm sm:pl-[52px]">
        <button type="button" className="font-semibold text-primary-ink hover:underline" onClick={() => setPanel(panel === "change" ? "none" : "change")} aria-expanded={panel === "change"}>
          Change what they see
        </button>
        <button type="button" className="font-semibold text-primary-ink hover:underline" onClick={pause}>
          {m.paused ? "Resume" : "Pause"}
        </button>
        <button type="button" className="font-semibold text-primary-ink hover:underline" onClick={copy}>
          {copied ? "Copied" : "Copy link"}
        </button>
        <button type="button" className="font-semibold text-ink-soft hover:underline" onClick={() => setPanel(panel === "remove" ? "none" : "remove")}>
          Remove
        </button>
      </div>

      {panel === "see" && (
        <div className="theme-rose-light mt-4 rounded-[20px] border border-line bg-bg p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-ink-soft">Preview of {m.name.split(/\s+/)[0]}&apos;s page</p>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface-2" onClick={() => setPanel("none")} aria-label="Close preview">
              <X size={16} />
            </button>
          </div>
          <PersonView payload={payload()} today={today} preview />
        </div>
      )}

      {panel === "change" && (
        <div className="mt-4 rounded-2xl bg-surface-2 p-4">
          <ShareToggles
            mode={mode}
            value={m.shares}
            onChange={(shares) => {
              store.getState().updateCircleMember(m.id, { shares });
              void syncMember({ ...m, shares });
            }}
          />
          <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={() => setPanel("none")}>
            Done
          </button>
        </div>
      )}

      {panel === "remove" && (
        <div className="mt-4 rounded-2xl bg-surface-2 p-4">
          <p className="text-[15px] text-ink">Remove {m.name}? Their link will stop working.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={remove}>
              Remove
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPanel("none")}>
              Keep
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/* ---------------- Add someone ---------------- */

function ShareToggles({ mode, value, onChange }: { mode: CircleMode; value: string[]; onChange: (v: string[]) => void }) {
  const options = SHARE_OPTIONS[shareGroup(mode)];
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">What they can see</legend>
      <ul className="space-y-2">
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <li key={o.id}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => onChange(on ? value.filter((x) => x !== o.id) : [...value, o.id])}
                className="flex w-full items-start gap-3 rounded-xl p-2 text-left hover:bg-surface"
              >
                <span className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-line"}`} aria-hidden>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-ink">{o.label}</span>
                  <span className="block text-sm text-ink-soft">{o.line}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function AddForm({ mode, configured, onDone }: { mode: CircleMode; configured: boolean; onDone: () => void }) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<Relation>("partner");
  const [phone, setPhone] = useState("");
  const [shares, setShares] = useState<string[]>(defaultShares());
  const [busy, setBusy] = useState(false);
  const inSample = useAppStore((s) => !!s.sample);

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    const member: CircleMember = {
      id: newId(),
      name: name.trim(),
      relation: RELATIONS.find((r) => r.id === relation)?.label ?? "Friend",
      phone: phone.trim() || undefined,
      shares,
      status: "not-shared",
      addedAt: todayISO(),
    };
    activeProfileStore().getState().addCircleMember(member);
    if (configured && !inSample) await createLink(member);
    setBusy(false);
    onDone();
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-line p-4">
      <p className="font-semibold text-ink">Add someone</p>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Their name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul" autoComplete="off" />
      </label>
      <div>
        <span className="mb-1.5 block text-xs font-semibold text-ink-soft">They are your</span>
        <div className="flex flex-wrap gap-2">
          {RELATIONS.map((r) => (
            <button key={r.id} type="button" className="chip" aria-pressed={relation === r.id} onClick={() => setRelation(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Their phone, for WhatsApp or text (optional)</span>
        <input className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
      </label>
      <ShareToggles mode={mode} value={shares} onChange={setShares} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={save} disabled={!name.trim() || busy}>
          {busy ? "Saving" : (<><Plus size={16} aria-hidden /> Add to my Circle</>)}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
      <p className="flex items-center gap-1.5 text-sm text-ink-soft">
        <Check size={15} className="text-accent-ink" aria-hidden /> Next, send their private link by WhatsApp, text or copy link.
      </p>
    </div>
  );
}

