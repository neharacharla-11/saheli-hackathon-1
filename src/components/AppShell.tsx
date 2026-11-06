"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Ellipsis, Plus, Settings, ShieldCheck, Sparkles, Check } from "lucide-react";
import { Logo } from "./Logo";
import { GetHelpButton } from "./GetHelp";
import { LanguagePicker } from "./LanguagePicker";
import { SamplePicker } from "./SamplePicker";
import { PrivacyGuard } from "./settings/PrivacyGuard";
import { CircleSync } from "./circle/CircleSync";
import { activeTab, BOTTOM_KEYS, NAV, navItemFor, type NavItem } from "@/lib/nav";
import { STAGE_MENU_LABEL, useActiveId, useAppStore, useHydrated, useProfileStore } from "@/lib/store";

function useNavLabels(): (item: NavItem) => string {
  const companion = useProfileStore((s) => s.profile?.companionName);
  const stage = useProfileStore((s) => s.profile?.stage);
  return (item) => {
    if (item.key === "companion") return companion || "Bestie";
    if (item.key === "stage") return stage ? STAGE_MENU_LABEL[stage] : "My stage";
    return item.label;
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const activeId = useActiveId();
  const router = useRouter();
  const pathname = usePathname() ?? "/app";

  useEffect(() => {
    if (hydrated && !activeId) router.replace("/welcome");
  }, [hydrated, activeId, router]);

  const ready = hydrated && !!activeId;

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <Sidebar pathname={pathname} />
      <div className="min-w-0">
        <TopBar />
        <main className="px-4 pb-28 pt-4 sm:px-6 sm:pt-6 md:px-6 md:pb-12 lg:px-10 lg:pt-10">
          <div className="mx-auto w-full max-w-[1024px]">
            {ready ? (
              <>
                <PrivacyGuard />
                <CircleSync />
                <SampleBanner />
                <GroupTabs pathname={pathname} />
                {children}
              </>
            ) : (
              <div className="h-64" aria-busy="true" />
            )}
          </div>
        </main>
        <BottomBar pathname={pathname} />
      </div>
    </div>
  );
}

/* ---------------- Desktop sidebar ---------------- */

function Sidebar({ pathname }: { pathname: string }) {
  const label = useNavLabels();
  const current = navItemFor(pathname)?.key;
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r border-line bg-surface px-4 pb-4 pt-6 md:flex">
      <Link href="/" className="px-1" aria-label="Saheli home">
        <Logo size="md" tagline outline="var(--surface)" />
      </Link>
      <LanguagePicker className="ml-1 mt-4 self-start" />
      <nav className="mt-7 flex flex-col gap-0.5" aria-label="Main">
        {NAV.map((item) => {
          const active = item.key === current;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors ${
                active ? "bg-surface-2 font-semibold text-primary-ink" : "text-ink hover:bg-surface-2/60"
              }`}
            >
              <Icon size={18} strokeWidth={2} className={active ? "text-primary-ink" : "text-ink-soft"} />
              <span className="truncate">{label(item)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 pt-6">
        <GetHelpButton variant="sidebar" />
        <ProfileSwitcher variant="card" />
        <div className="flex gap-2.5 rounded-2xl bg-surface-2 p-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent-ink" />
          <p className="text-[13px] leading-snug text-ink-soft">
            <span className="block font-semibold text-ink">Private by design</span>
            Your health data stays on this device.
          </p>
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Phone top bar ---------------- */

function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-line bg-bg/90 px-4 backdrop-blur-md md:hidden">
      <Link href="/" aria-label="Saheli home" className="shrink-0">
        <Logo size="sm" />
      </Link>
      <div className="flex items-center gap-2">
        <GetHelpButton variant="topbar" />
        <ProfileSwitcher variant="avatar" />
        <Link
          href="/app/settings"
          aria-label="Settings"
          className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
        >
          <Settings size={18} />
        </Link>
      </div>
    </header>
  );
}

/* ---------------- Phone bottom bar ---------------- */

function BottomBar({ pathname }: { pathname: string }) {
  const label = useNavLabels();
  const current = navItemFor(pathname)?.key;
  const items = BOTTOM_KEYS.map((k) => NAV.find((n) => n.key === k)!);
  const moreActive = !current || !(BOTTOM_KEYS as readonly string[]).includes(current);
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      {items.map((item) => {
        const active = item.key === current;
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              active ? "text-primary-ink" : "text-ink-soft"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.3 : 2} />
            <span className="max-w-full truncate px-1">{label(item)}</span>
          </Link>
        );
      })}
      <Link
        href="/app/more"
        aria-current={moreActive ? "page" : undefined}
        className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
          moreActive ? "text-primary-ink" : "text-ink-soft"
        }`}
      >
        <Ellipsis size={20} />
        More
      </Link>
    </nav>
  );
}

/* ---------------- Grouped tabs ---------------- */

function GroupTabs({ pathname }: { pathname: string }) {
  const group = activeTab(pathname);
  const rowRef = useRef<HTMLDivElement>(null);
  const currentHref = group?.current.href;

  useEffect(() => {
    const row = rowRef.current;
    const el = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !el) return;
    row.scrollTo({ left: el.offsetLeft - row.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [currentHref]);

  if (!group) return null;
  return (
    <div ref={rowRef} className="fade-x -mx-4 mb-6 px-4 sm:mx-0 sm:px-0 md:[mask-image:none]">
      <div className="flex w-max gap-2 pr-8 md:pr-0" role="tablist" aria-label="Sections">
        {group.tabs.map((t) => {
          const on = t.href === group.current.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              role="tab"
              aria-selected={on}
              aria-current={on ? "page" : undefined}
              className={`inline-flex h-9 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
                on ? "bg-ink text-bg" : "bg-surface-2 text-ink hover:bg-line"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Sample banner ---------------- */

function SampleBanner() {
  const sample = useAppStore((s) => s.sample);
  const setSample = useAppStore((s) => s.setSample);
  const activeId = useAppStore((s) => s.activeId);
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  if (!sample) return null;

  function exit() {
    setSample(null);
    if (!activeId) router.push("/");
  }

  return (
    <>
      <div className="mb-5 flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl bg-[#3A1E2A] px-4 py-2.5 text-white">
        <p className="flex min-w-0 items-center gap-2 text-sm">
          <Sparkles size={16} className="shrink-0 text-[#F4B6CF]" />
          <span className="min-w-0">
            <span className="font-semibold">Sample data:</span> {sample.name}, {sample.label}
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="h-9 rounded-full bg-white/12 px-3.5 text-[13px] font-semibold text-white hover:bg-white/20"
          >
            Switch sample
          </button>
          <button
            type="button"
            onClick={exit}
            className="h-9 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#3A1E2A] hover:bg-white/90"
          >
            Exit sample
          </button>
        </div>
      </div>
      {picking && <SamplePicker onClose={() => setPicking(false)} />}
    </>
  );
}

/* ---------------- Profile switcher ---------------- */

function ProfileSwitcher({ variant }: { variant: "card" | "avatar" }) {
  const profiles = useAppStore((s) => s.profiles);
  const activeId = useAppStore((s) => s.activeId);
  const sample = useAppStore((s) => s.sample);
  const setActive = useAppStore((s) => s.setActive);
  const name = useProfileStore((s) => s.profile?.name) ?? "";
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = (name || "?")[0].toUpperCase();

  const menu = open && (
    <div
      className={`absolute z-50 w-64 rounded-2xl border border-line bg-surface p-2 shadow-xl ${
        variant === "card" ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2"
      }`}
      role="menu"
    >
      <p className="label px-2.5 pb-1 pt-1.5">Who&apos;s using Saheli?</p>
      {profiles.map((p) => {
        const on = !sample && p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            role="menuitem"
            onClick={() => {
              setActive(p.id);
              setOpen(false);
              router.push("/app");
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-surface-2"
          >
            <span className="font-display grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
              {p.name[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
              {p.relation && <span className="block truncate text-xs text-ink-soft">{p.relation}</span>}
            </span>
            {on && <Check size={16} className="text-primary-ink" />}
          </button>
        );
      })}
      <Link
        href="/welcome?add=1"
        role="menuitem"
        onClick={() => setOpen(false)}
        className="mt-1 flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-primary-ink hover:bg-surface-2"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-primary/50">
          <Plus size={16} />
        </span>
        Add a family member
      </Link>
    </div>
  );

  if (variant === "avatar") {
    return (
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Profile: ${name}. Switch profile`}
          className="font-display grid h-8 w-8 place-items-center rounded-full bg-primary text-[15px] text-on-primary"
        >
          {initial}
        </button>
        {menu}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 text-left hover:bg-surface-2"
      >
        <span className="font-display grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-base text-on-primary">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{name || "Your profile"}</span>
          <span className="block text-xs text-ink-soft">Switch profile</span>
        </span>
        <ChevronDown size={16} className={`text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {menu}
    </div>
  );
}
