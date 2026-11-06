"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { HandHeart, MapPin, MessageSquare, Phone, UserPlus, X } from "lucide-react";
import { WhatsAppIcon } from "./BrandIcons";
import { activeProfileStore, newId, useHydrated, useProfileStore } from "@/lib/store";
import {
  COUNTRIES,
  helpFor,
  mapsLink,
  smsLink,
  sosMessage,
  telLink,
  whatsappLink,
} from "@/lib/helplines";

export function GetHelpButton({ variant }: { variant: "sidebar" | "topbar" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={
          variant === "sidebar"
            ? "help-pill h-10 w-full text-[15px]"
            : "help-pill h-8 px-3 text-xs"
        }
      >
        <HandHeart size={variant === "sidebar" ? 18 : 15} strokeWidth={2} />
        Get help
      </button>
      {open && <GetHelpSheet onClose={() => setOpen(false)} />}
    </>
  );
}

type LocState = { status: "idle" | "loading" | "error"; url?: string; error?: string };

export function GetHelpSheet({ onClose }: { onClose: () => void }) {
  const hydrated = useHydrated();
  const profile = useProfileStore((s) => s.profile);
  const circle = useProfileStore((s) => s.circle);
  const [country, setCountry] = useState<string | null>(null);
  const [loc, setLoc] = useState<LocState>({ status: "idle" });
  const [showForm, setShowForm] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const help = helpFor(country ?? profile?.country ?? "IN");
  const withPhone = circle.filter((m) => m.phone);
  const message = sosMessage(profile?.name ?? "", loc.url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function addLocation() {
    if (!("geolocation" in navigator)) {
      setLoc({ status: "error", error: "This phone can't share location here." });
      return;
    }
    setLoc({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc({ status: "idle", url: mapsLink(pos.coords.latitude, pos.coords.longitude) }),
      () => setLoc({ status: "error", error: "Location is off. You can still send the message without it." }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  function changeCountry(code: string) {
    setCountry(code);
    if (profile) activeProfileStore().getState().updateProfile({ country: code });
  }

  if (!hydrated) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[32px] bg-surface px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5 shadow-2xl outline-none sm:px-6 md:max-w-[512px] md:rounded-[24px] md:pb-6"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line md:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-display flex items-center gap-2.5 text-[1.75rem] leading-tight text-ink">
            <HandHeart className="text-primary-ink" size={26} />
            Get help now
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <a
          href={telLink(help.emergency.number)}
          className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-danger text-xl font-bold text-white shadow-[0_8px_24px_-10px_rgb(198_40_40/0.6)] transition hover:brightness-105 active:scale-[0.98]"
        >
          <Phone size={22} strokeWidth={2.4} />
          Call {help.emergency.number}
        </a>
        <p className="mt-2 text-center text-[13px] text-ink-soft">
          Police, ambulance and fire. Your phone opens the dialler, you press call.
        </p>

        {help.others.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {help.others.map((h) => (
              <a
                key={h.number}
                href={telLink(h.number)}
                className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface p-3 hover:bg-surface-2"
              >
                <Phone size={16} className="mt-0.5 shrink-0 text-danger" />
                <span className="min-w-0">
                  <span className="block text-[13px] leading-snug text-ink-soft">{h.label}</span>
                  <span className="tabular block font-semibold text-ink">{h.display ?? h.number}</span>
                </span>
              </a>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-end gap-2 text-[13px] text-ink-soft">
          <label htmlFor="help-country">Numbers for</label>
          <select
            id="help-country"
            value={help.code}
            onChange={(e) => changeCountry(e.target.value)}
            className="h-8 rounded-full border border-line bg-surface px-2.5 text-[13px] text-ink"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
            <option value="OTHER">Somewhere else</option>
          </select>
        </div>

        <section className="mt-5 rounded-[20px] bg-surface-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">Tell your people</h3>
            <button
              type="button"
              onClick={addLocation}
              disabled={loc.status === "loading"}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[13px] font-semibold text-ink hover:bg-bg"
            >
              <MapPin size={15} className="text-primary-ink" />
              {loc.status === "loading" ? "Finding you…" : loc.url ? "Location added" : "Add my location"}
            </button>
          </div>
          {loc.error && <p className="mt-2 text-[13px] text-ink-soft">{loc.error}</p>}

          {withPhone.length > 0 ? (
            <>
              <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-[13px] leading-snug text-ink-soft">{message}</p>
              <ul className="mt-3 space-y-2">
                {withPhone.map((m) => (
                  <li key={m.id} className="rounded-2xl bg-surface p-3">
                    <p className="font-semibold leading-tight text-ink">{m.name}</p>
                    <p className="text-[13px] text-ink-soft">{m.relation}</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <a
                        href={whatsappLink(m.phone!, message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-whatsapp px-3 text-sm font-semibold text-white hover:brightness-105"
                      >
                        <WhatsAppIcon size={17} />
                        WhatsApp
                      </a>
                      <a
                        href={smsLink(m.phone!, message)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-2"
                      >
                        <MessageSquare size={16} />
                        SMS
                      </a>
                      <a
                        href={telLink(m.phone!)}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-on-primary hover:brightness-105"
                        aria-label={`Call ${m.name}`}
                      >
                        <Phone size={17} />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
              {showForm ? (
                <TrustedPersonForm dialCode={helpFor(profile?.country).dialCode} onDone={() => setShowForm(false)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-ink underline-offset-4 hover:underline"
                >
                  <UserPlus size={16} />
                  Add a trusted person
                </button>
              )}
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-ink">Add someone you trust, like your mother, partner or a friend.</p>
              {profile ? (
                <TrustedPersonForm dialCode={helpFor(profile.country).dialCode} />
              ) : (
                <p className="mt-2 text-[13px] text-ink-soft">Set up Saheli first, then you can add your people here.</p>
              )}
            </>
          )}
        </section>

        <p className="mt-4 text-center text-xs leading-relaxed text-ink-soft">
          Nothing is sent until you press send. Your location is never stored.
        </p>
      </div>
    </div>,
    document.body,
  );
}

function TrustedPersonForm({ dialCode, onDone }: { dialCode: string; onDone?: () => void }) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("Mother");
  const [phone, setPhone] = useState(dialCode === "+" ? "+" : `${dialCode} `);
  const [error, setError] = useState("");
  const ids = useId();

  function save(e: FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (!name.trim()) return setError("Add their name.");
    if (!phone.trim().startsWith("+") || digits.length < 8) {
      return setError("Add their mobile with the country code, like +91 98765 43210.");
    }
    activeProfileStore()
      .getState()
      .addCircleMember({
        id: newId(),
        name: name.trim(),
        relation,
        phone: phone.trim(),
        shares: [],
        status: "not-shared",
        addedAt: new Date().toISOString(),
      });
    setName("");
    setError("");
    onDone?.();
  }

  return (
    <form onSubmit={save} className="mt-3 space-y-2.5" noValidate>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div>
          <label htmlFor={`${ids}-name`} className="sr-only">
            Name
          </label>
          <input
            id={`${ids}-name`}
            className="input h-11"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor={`${ids}-rel`} className="sr-only">
            Relation
          </label>
          <select
            id={`${ids}-rel`}
            className="input h-11 w-auto pr-8"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
          >
            {["Mother", "Partner", "Sister", "Friend", "Father", "Brother", "Daughter", "Other"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={`${ids}-phone`} className="sr-only">
          Mobile with country code
        </label>
        <input
          id={`${ids}-phone`}
          className="input tabular h-11"
          type="tel"
          inputMode="tel"
          placeholder="Mobile with country code"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="off"
        />
      </div>
      {error && <p className="text-[13px] text-danger">{error}</p>}
      <button type="submit" className="btn btn-primary w-full">
        Save trusted person
      </button>
      <p className="text-xs text-ink-soft">
        They join your Circle. Nothing is shared with them until you send a Circle link.
      </p>
    </form>
  );
}
