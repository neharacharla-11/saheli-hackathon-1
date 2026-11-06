"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, BellOff, CalendarPlus, Droplets, Info, Pill, Plus, X } from "lucide-react";
import { todayISO } from "@/lib/dates";
import { buildIcs, validTime, type Reminder } from "@/lib/reminders";
import { activeProfileStore, useProfileStore } from "@/lib/store";
import type { ReminderSettings } from "@/lib/types";
import { useReminderList, useReminderSettings } from "./useReminders";

type Perm = NotificationPermission | "unsupported";

function readPerm(): Perm {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

function isIosBrowser() {
  if (typeof navigator === "undefined") return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
  return ios && !standalone;
}

function time12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-line"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

const ICON: Record<Reminder["kind"], typeof Pill> = { medicine: Pill, pill: Pill, water: Droplets, period: Bell };

export function Reminders() {
  const settings = useReminderSettings();
  const list = useReminderList();
  const periodStarts = useProfileStore((s) => s.periodStarts);
  const cycleLength = useProfileStore((s) => s.profile?.cycleLength ?? 28);
  const [perm, setPerm] = useState<Perm>("default");
  const [ios, setIos] = useState(false);
  const [newTime, setNewTime] = useState("");
  const set = (patch: Partial<ReminderSettings>) => activeProfileStore().getState().setReminders(patch);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPerm(readPerm());
    setIos(isIosBrowser());
  }, []);

  async function enable(on: boolean) {
    if (!on) return set({ notify: false });
    if (perm === "unsupported") return;
    let p = Notification.permission;
    if (p === "default") p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      set({ notify: true });
      const reg = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
      // Ask for background checks where the browser allows it (installed Chrome).
      const ps = (reg as unknown as { periodicSync?: { register: (t: string, o: { minInterval: number }) => Promise<void> } } | undefined)?.periodicSync;
      await ps?.register("saheli-reminders", { minInterval: 15 * 60_000 }).catch(() => {});
    }
  }

  function downloadIcs() {
    const ics = buildIcs(list, { today: todayISO(), periodStarts, cycleLength });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "saheli-reminders.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  const daily = list.filter((r) => r.repeat === "daily");
  const medsCount = list.filter((r) => r.kind === "medicine" || r.kind === "pill").length;

  return (
    <section className="space-y-4" aria-labelledby="reminders-title">
      <h2 id="reminders-title" className="font-display text-[1.6rem] leading-tight text-ink">
        Reminders
      </h2>
      <div className="grid gap-5 md:grid-cols-2">
        {/* Phone reminders */}
        <article className="card" aria-labelledby="phone-rem">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="phone-rem" className="flex items-center gap-2 font-semibold text-ink">
                <Bell size={18} className="text-primary-ink" aria-hidden="true" /> Phone reminders
              </h3>
              <p className="mt-1 text-sm text-ink-soft">Notifications for your medicines, water and your period.</p>
            </div>
            <Toggle on={settings.notify && perm === "granted"} onChange={enable} label="Phone reminders" />
          </div>

          {ios && (
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-surface-2 p-3 text-sm text-ink">
              <Info size={16} className="mt-[3px] shrink-0 text-primary-ink" aria-hidden="true" />
              On iPhone, add Saheli to your Home Screen first (tap Share, then Add to Home Screen), open it from there, then turn reminders on.
            </p>
          )}
          {perm === "denied" && (
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-[#FDE2E2] p-3 text-sm text-[#5c1020]">
              <BellOff size={16} className="mt-[3px] shrink-0" aria-hidden="true" />
              Notifications are blocked for Saheli. Turn them on in your browser or phone settings, then come back here. Calendar reminders below work either way.
            </p>
          )}
          {perm === "unsupported" && !ios && (
            <p className="mt-3 text-sm text-ink-soft">This browser can&apos;t show notifications. Calendar reminders below work instead.</p>
          )}

          <ul className="mt-4 divide-y divide-line">
            <li className="flex items-center justify-between gap-3 py-3">
              <span>
                <span className="block font-medium text-ink">Medicines</span>
                <span className="block text-sm text-ink-soft">
                  {medsCount ? `${medsCount} with a time, including your pill if you set one` : "Add a time to a medicine to be reminded"}
                </span>
              </span>
              <Toggle on={settings.medicines} onChange={(v) => set({ medicines: v })} label="Medicine reminders" />
            </li>
            <li className="py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="block font-medium text-ink">Water</span>
                <Toggle on={settings.water} onChange={(v) => set({ water: v })} label="Water reminders" />
              </div>
              {settings.water && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {settings.waterTimes.map((t) => (
                    <span key={t} className="chip chip-sm !pr-1.5">
                      {time12(t)}
                      <button
                        type="button"
                        className="grid h-6 w-6 place-items-center rounded-full hover:bg-line"
                        aria-label={`Remove ${time12(t)}`}
                        onClick={() => set({ waterTimes: settings.waterTimes.filter((x) => x !== t) })}
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                  <form
                    className="flex items-center gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (validTime(newTime) && !settings.waterTimes.includes(newTime)) set({ waterTimes: [...settings.waterTimes, newTime].sort() });
                      setNewTime("");
                    }}
                  >
                    <input type="time" className="input !h-8 !w-[7.5rem] !px-2 text-sm" value={newTime} onChange={(e) => setNewTime(e.target.value)} aria-label="Add a water time" />
                    <button type="submit" className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-primary-ink" aria-label="Add water time">
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </form>
                </div>
              )}
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <span>
                <span className="block font-medium text-ink">Period likely tomorrow</span>
                <span className="block text-sm text-ink-soft">A heads-up at 9 am the day before</span>
              </span>
              <Toggle on={settings.periodTomorrow} onChange={(v) => set({ periodTomorrow: v })} label="Period reminder" />
            </li>
          </ul>
          <p className="mt-2 text-xs text-ink-soft">
            Phone reminders arrive while Saheli is open or was used recently. For alarms that always ring, add them to your calendar.{" "}
            <Link href="/app/contraception" className="underline underline-offset-2">
              Set your pill time
            </Link>
          </p>
        </article>

        {/* Calendar */}
        <article className="card flex flex-col" aria-labelledby="cal-rem">
          <h3 id="cal-rem" className="flex items-center gap-2 font-semibold text-ink">
            <CalendarPlus size={18} className="text-primary-ink" aria-hidden="true" /> Add to your calendar
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            One file with an alarm for each reminder, repeating every day. They ring from your phone&apos;s calendar even when Saheli is closed.
          </p>
          {list.length ? (
            <ul className="mt-4 space-y-2">
              {list.map((r) => {
                const Icon = ICON[r.kind];
                return (
                  <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-surface-2 px-3 py-2">
                    <Icon size={16} className="shrink-0 text-primary-ink" aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-sm text-ink">{r.title}</span>
                    <span className="text-sm text-ink-soft tabular">
                      {r.repeat === "daily" ? `${time12(r.time)} daily` : `${time12(r.time)}, day before`}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink">Turn on a reminder, or add a time to a medicine, to build your calendar file.</p>
          )}
          <div className="mt-auto pt-4">
            <button type="button" className="btn btn-primary" onClick={downloadIcs} disabled={!list.length}>
              <CalendarPlus size={18} aria-hidden="true" /> Download for my calendar
            </button>
            <p className="mt-2 text-xs text-ink-soft">
              {daily.length} daily {daily.length === 1 ? "reminder" : "reminders"}
              {list.some((r) => r.kind === "period") ? " plus your next 6 periods" : ""}. Open the file to add it to Apple, Google or Outlook Calendar.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
