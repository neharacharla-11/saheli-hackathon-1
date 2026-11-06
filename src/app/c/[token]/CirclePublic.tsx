"use client";

import { useEffect, useState } from "react";
import { PersonPage } from "@/components/circle/PersonView";
import { decodePayload, pageTitle, type CirclePayload } from "@/lib/circle";
import { todayISO } from "@/lib/dates";
import { useHydrated } from "@/lib/store";

/** The person's page. A self-contained link carries the schedule in the # part, which never reaches the server. */
export function CirclePublic({ token, payload }: { token: string; payload: CirclePayload | null }) {
  const hydrated = useHydrated();
  const [hashPayload, setHashPayload] = useState<CirclePayload | null>(null);

  useEffect(() => {
    if (token !== "local") return;
    const read = () => setHashPayload(decodePayload(window.location.hash.slice(1)));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [token]);

  const p = token === "local" ? hashPayload : payload;

  // Self-contained links can only be read here, so set the tab title on this side (and keep it if Next resets it).
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

  if (!hydrated) return <div className="theme-rose-light min-h-dvh bg-bg" />;
  return (
    <>
      <PersonPage payload={p} today={todayISO()} />
    </>
  );
}
