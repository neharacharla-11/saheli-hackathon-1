"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NAV } from "@/lib/nav";
import { STAGE_MENU_LABEL, useProfileStore } from "@/lib/store";

const MORE_KEYS = ["move", "mind", "stage", "health", "care", "circle", "settings"];

export function MoreList() {
  const stage = useProfileStore((s) => s.profile?.stage);
  const items = NAV.filter((n) => MORE_KEYS.includes(n.key));
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
      {items.map((item, i) => {
        const Icon = item.icon;
        const label = item.key === "stage" && stage ? STAGE_MENU_LABEL[stage] : item.label;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex h-14 items-center gap-3.5 px-4 hover:bg-surface-2 ${i > 0 ? "border-t border-line" : ""}`}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-primary-ink">
              <Icon size={18} />
            </span>
            <span className="flex-1 font-medium text-ink">{label}</span>
            <ChevronRight size={18} className="text-ink-soft" />
          </Link>
        );
      })}
    </div>
  );
}
