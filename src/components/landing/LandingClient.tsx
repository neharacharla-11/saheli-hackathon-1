"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SamplePicker } from "@/components/SamplePicker";

export { LanguagePicker, LANGUAGES } from "@/components/LanguagePicker";

export function TrySampleButton({ className = "btn btn-secondary btn-lg" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Sparkles size={18} className="text-primary-ink" />
        Try with sample data
      </button>
      {open && <SamplePicker onClose={() => setOpen(false)} />}
    </>
  );
}
