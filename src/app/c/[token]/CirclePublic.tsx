"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { PersonPage } from "@/components/circle/PersonView";
import { decodePayload, pageTitle, type CirclePayload } from "@/lib/circle";
import { todayISO } from "@/lib/dates";

const noop = () => () => {};

/**
 * The person's page. Server links arrive already rendered (fast on phones, fine in WhatsApp's
 * in-app browser); self-contained links carry the schedule in the # part, read here only.
 * Doesn't touch the app's saved data at all.
 */
export function CirclePublic({ token, payload, serverToday }: { token: string; payload: CirclePayload | null; serverToday: string }) {
  // Her day on the viewer's own clock once we're in the browser.
  const today = useSyncExternalStore(noop, todayISO, () => serverToday);
  const isLocal = token === "local";
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [hashPayload, setHashPayload] = useState<CirclePayload | null>(null);

  useEffect(() => {
    if (!isLocal) return;
    const read = () => setHashPayload(decodePayload(window.location.hash.slice(1)));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [isLocal]);

  const p = isLocal ? hashPayload : payload;

  // Self-contained links can only be read here, so set the tab title on this side too.
  useEffect(() => {
    if (!p) return;
    const want = `${pageTitle(p)} · Saheli`;
    const apply = () => {
      if (document.title !== want) document.title = want;
    };
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => obs.disconnect();
  }, [p]);

  if (isLocal && !hydrated) return <div className="theme-rose-light min-h-dvh bg-bg" />;
  return <PersonPage payload={p} today={today} />;
}
