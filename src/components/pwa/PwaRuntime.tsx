"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { autoBackup } from "@/lib/backupClient";
import { NAV } from "@/lib/nav";
import { dueReminders } from "@/lib/reminders";
import { todayISO } from "@/lib/dates";
import { forNotification, useReminderList, useReminderSettings } from "@/components/reminders/useReminders";

const DAY = 24 * 3600_000;
const PRECACHE_KEY = "saheli:precacheAt";
const CHECK_KEY = "saheli:pref:reminderCheck";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** Every page in the menu, so Saheli opens offline. */
function menuUrls(): string[] {
  const urls = new Set<string>(["/", "/app", "/app/more", "/welcome"]);
  for (const n of NAV) {
    urls.add(n.href);
    n.tabs?.forEach((t) => urls.add(t.href));
  }
  return [...urls];
}

async function precacheIfDue(reg: ServiceWorkerRegistration) {
  const last = Number(localStorage.getItem(PRECACHE_KEY) ?? 0);
  if (Date.now() - last < DAY || !navigator.onLine) return;
  const worker = reg.active ?? (await navigator.serviceWorker.ready).active;
  worker?.postMessage({ type: "precache", urls: menuUrls() });
  localStorage.setItem(PRECACHE_KEY, String(Date.now()));
}

/**
 * Runs on every page: registers the service worker (production only), saves menu
 * pages for offline use once a day, shows reminders, runs the daily cloud backup,
 * and shows a small note while she's offline.
 */
export function PwaRuntime() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const list = useReminderList();
  const settings = useReminderSettings();
  const listRef = useRef(list);
  useEffect(() => {
    listRef.current = list;
  }, [list]);

  // Service worker + offline pages
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let timer: number | undefined;
    const start = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await precacheIfDue(reg);
        timer = window.setInterval(() => precacheIfDue(reg), 3600_000);
      } catch {
        // Offline mode is a bonus; the app works without it.
      }
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.clearInterval(timer);
  }, []);

  // Daily encrypted backup, if she turned it on
  useEffect(() => {
    const t = window.setTimeout(() => void autoBackup(), 8000);
    const i = window.setInterval(() => void autoBackup(), 3600_000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(i);
    };
  }, []);

  // Keep the service worker's copy of her reminders up to date (for background checks).
  useEffect(() => {
    navigator.serviceWorker?.ready
      .then((reg) => reg.active?.postMessage({ type: "reminders", enabled: settings.notify, items: list.map(forNotification) }))
      .catch(() => {});
  }, [list, settings.notify]);

  // While Saheli is open, check every minute and show due reminders through the service worker.
  useEffect(() => {
    if (!settings.notify || typeof Notification === "undefined") return;
    const check = async () => {
      if (Notification.permission !== "granted") return;
      const now = Date.now();
      const since = Number(localStorage.getItem(CHECK_KEY) ?? now - 60_000);
      localStorage.setItem(CHECK_KEY, String(now));
      const due = dueReminders(listRef.current, since, now).map(forNotification);
      if (!due.length) return;
      const reg = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
      const today = todayISO();
      for (const r of due) {
        const opts: NotificationOptions = { body: r.body, tag: `${r.id}-${r.date ?? today}`, icon: "/icons/icon-192.png", data: { url: r.kind === "period" ? "/app/cycle" : "/app/checklist" } };
        if (reg) await reg.showNotification(r.title, opts);
        else new Notification(r.title, opts);
      }
    };
    void check();
    const i = window.setInterval(check, 60_000);
    const onVis = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(i);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [settings.notify]);

  if (online) return null;
  return (
    <div role="status" className="no-print flex items-center justify-center gap-2 bg-[#3A1E2A] px-4 py-2 text-center text-[13px] text-white">
      <WifiOff size={14} className="shrink-0" aria-hidden="true" />
      <span>You&apos;re offline. Logging and everything on this phone still work. Bestie, report reading and backups come back when you&apos;re online.</span>
    </div>
  );
}
