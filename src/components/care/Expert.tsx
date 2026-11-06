"use client";

import Link from "next/link";
import { useState } from "react";
import { Baby, ChevronDown, HeartHandshake, Mail, Stethoscope } from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { PageHeader } from "@/components/PageHeader";
import { bookingMessage, emailBooking, whatsappBooking } from "@/lib/care";
import { STAGE_LABEL, useProfileStore } from "@/lib/store";

const TOPICS = [
  "PCOS and food",
  "Weight and body composition",
  "Pregnancy or postpartum nutrition",
  "Menopause nutrition",
  "Thyroid or diabetes and food",
  "A fitness plan",
  "Something else",
];
const HOW = ["Video call", "Phone call", "WhatsApp chat"];
const AREAS = ["PCOS", "Weight", "Pregnancy and postpartum food", "Menopause", "Thyroid and diabetes-friendly eating", "Strength plans"];

export function ExpertPage() {
  const profile = useProfileStore((s) => s.profile);
  const [name, setName] = useState(profile?.name ?? "");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [time, setTime] = useState("");
  const [how, setHow] = useState(HOW[0]);
  const [note, setNote] = useState("");
  const [includeAbout, setIncludeAbout] = useState(true);
  const [preview, setPreview] = useState(false);

  const message = bookingMessage({
    name,
    topic,
    time,
    how,
    note,
    includeAbout,
    age: profile?.age,
    stage: profile ? STAGE_LABEL[profile.stage] : undefined,
  });

  return (
    <>
      <PageHeader eyebrow="TALK TO AN EXPERT" title="A real person, when you need one" lead="Book time with a women's health expert. You message them directly, from your own phone." />
      <div className="flex flex-col gap-5">
        <section className="card" aria-labelledby="neha">
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-primary font-display text-[2.2rem] text-on-primary" aria-hidden>
              N
            </span>
            <div className="min-w-0 flex-1">
              <p className="label mb-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent-ink" aria-hidden /> AVAILABLE NOW
              </p>
              <h2 id="neha" className="font-display text-[1.9rem] leading-tight text-ink">
                Neha Racharla
              </h2>
              <p className="text-[15px] text-ink">Certified Nutritionist and Fitness Coach, specialised in women&apos;s nutrition</p>
              <p className="text-sm text-ink-soft">Founder of Saheli · M.S. Artificial Intelligence, Santa Clara University</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {AREAS.map((a) => (
                  <span key={a} className="inline-flex h-8 items-center rounded-full bg-surface-2 px-3 text-sm text-ink">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <form className="mt-6 grid gap-4 border-t border-line pt-6 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
              Your name
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
              Topic
              <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {TOPICS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
              Best time for you
              <input className="input" placeholder="e.g. Weekday evenings after 7" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <fieldset>
              <legend className="mb-1 text-sm font-semibold text-ink">How</legend>
              <div className="flex flex-wrap gap-2">
                {HOW.map((h) => (
                  <button key={h} type="button" className="chip h-12" aria-pressed={how === h} onClick={() => setHow(h)}>
                    {h}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink md:col-span-2">
              A note for Neha
              <textarea className="input min-h-[96px] py-3" placeholder="What would you like help with?" value={note} onChange={(e) => setNote(e.target.value)} maxLength={800} />
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-[15px] text-ink md:col-span-2">
              <input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={includeAbout} onChange={(e) => setIncludeAbout(e.target.checked)} />
              Include my age and life stage
            </label>

            <div className="md:col-span-2">
              <button type="button" className="flex items-center gap-1 text-sm font-semibold text-primary-ink" onClick={() => setPreview((v) => !v)} aria-expanded={preview}>
                See exactly what will be sent
                <ChevronDown size={16} className={`transition-transform ${preview ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {preview && <pre className="mt-2 whitespace-pre-wrap rounded-2xl bg-surface-2 p-4 font-sans text-[15px] text-ink">{message}</pre>}
            </div>

            <div className="flex flex-wrap gap-2 md:col-span-2">
              <a href={whatsappBooking(message)} target="_blank" rel="noopener noreferrer" className="btn btn-lg text-white" style={{ background: "#25D366" }}>
                <WhatsAppIcon size={20} />
                Request on WhatsApp
              </a>
              <a href={emailBooking(message, topic)} className="btn btn-secondary btn-lg">
                <Mail size={18} aria-hidden />
                Request by email
              </a>
            </div>
            <p className="text-sm text-ink-soft md:col-span-2">
              This opens your own WhatsApp or email with the message ready. Nothing is sent until you press send. Neha will confirm the time and her fee with you. There&apos;s no payment in Saheli.
            </p>
          </form>
        </section>

        <section aria-labelledby="coming-soon">
          <h2 id="coming-soon" className="mb-3 font-display text-[1.45rem] text-ink">
            More experts, coming soon
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            <SoonCard icon={Stethoscope} title="Gynaecologist">
              For now, take your <Link href="/app/report" className="font-semibold text-primary-ink underline underline-offset-2">Doctor summary</Link> to your visit. In India, eSanjeevani offers free government video consultations with doctors.
            </SoonCard>
            <SoonCard icon={HeartHandshake} title="Therapist">
              If you&apos;re struggling, there are free helplines on <Link href="/app/mind" className="font-semibold text-primary-ink underline underline-offset-2">Mind</Link>. You don&apos;t have to wait.
            </SoonCard>
            <SoonCard icon={Baby} title="Lactation consultant">
              Help with latching, supply and feeding pain. Until then, your doctor or hospital can connect you to one.
            </SoonCard>
          </div>
        </section>
      </div>
    </>
  );
}

function SoonCard({ icon: Icon, title, children }: { icon: typeof Baby; title: string; children: React.ReactNode }) {
  return (
    <article className="card">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-[1.25rem] text-ink">
          <Icon size={18} className="text-primary-ink" aria-hidden />
          {title}
        </h3>
        <span className="inline-flex h-6 items-center rounded-full bg-surface-2 px-2.5 text-xs font-semibold text-ink-soft">Soon</span>
      </div>
      <p className="text-[15px] text-ink-soft">{children}</p>
    </article>
  );
}
