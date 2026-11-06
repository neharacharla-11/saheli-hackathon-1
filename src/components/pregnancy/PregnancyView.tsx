"use client";

import { useState } from "react";
import { Baby } from "lucide-react";
import { parseISODate, todayISO } from "@/lib/dates";
import { dueFromLmp, pregnancyWeek, TRIMESTER_LABEL } from "@/lib/pregnancy";
import { activeProfileStore, useProfileStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { setStage } from "./data";
import { BabyBookCard, HospitalBag, LinkCards } from "./Keepsakes";
import { ContractionTimer, KickCounter, PregSymptoms } from "./Baby";
import { BloodPressure, Reminders, Scans, WeightGain } from "./Checks";
import { BirthDone, LossSupport, MoodCheck, PregnancyEndedOption } from "./Feelings";
import { EatingWell, TrimesterGuide, WarningSigns } from "./Guide";
import { PregnancyCalendar, PregnancyDates, WeekCard } from "./Week";
import { CardHead, DISCLAIMER, Field } from "./ui";

/** True when My stage should show the pregnancy page (or the gentle support page after a loss). */
export function useShowsPregnancy(): boolean {
  const stage = useProfileStore((s) => s.profile?.stage);
  const ended = useProfileStore((s) => s.pregnancy?.ended);
  return stage === "pregnancy" || (ended?.kind === "loss" && !ended.dismissed);
}

export function PregnancyView() {
  const profile = useProfileStore((s) => s.profile);
  const ended = useProfileStore((s) => s.pregnancy?.ended);

  if (!profile) return null;
  if (ended?.kind === "loss" && !ended.dismissed && profile.stage !== "pregnancy") return <LossSupport />;
  if (ended?.kind === "birth" && profile.stage === "postpartum") {
    return (
      <>
        <PageHeader eyebrow="PREGNANCY" title="Your baby is here" />
        <BirthDone />
      </>
    );
  }
  if (profile.stage !== "pregnancy" || !profile.dueDate) return <Setup />;
  return <Pregnancy dueDate={profile.dueDate} />;
}

function longDate(iso: string) {
  return parseISODate(iso).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function Pregnancy({ dueDate }: { dueDate: string }) {
  const today = todayISO();
  const now = pregnancyWeek(dueDate, today);
  const [shown, setShown] = useState(Math.max(4, Math.min(40, now.week)));
  const toGo =
    now.daysToGo > 1 ? `${now.daysToGo} days to go` : now.daysToGo === 1 ? "1 day to go" : now.daysToGo === 0 ? "Due today" : "Past your due date";

  return (
    <>
      <PageHeader
        eyebrow={`Pregnancy · ${TRIMESTER_LABEL[now.trimester]}`}
        title={`Week ${now.week}, day ${now.day}`}
        lead={`${toGo}. Due ${longDate(dueDate)}. Saheli follows you and your baby week by week.`}
      />
      <div className="space-y-5">
        <WeekCard now={now} shown={shown} setShown={setShown} />
        <PregnancyCalendar dueDate={dueDate} now={now} shown={shown} setShown={setShown} />
        <PregnancyDates dueDate={dueDate} now={now} />
        <TrimesterGuide trimester={now.trimester} />
        <Scans dueDate={dueDate} />
        <Reminders />
        <WarningSigns />
        <BloodPressure />
        <EatingWell />
        <WeightGain dueDate={dueDate} />
        <div className="grid items-start gap-5 md:grid-cols-2">
          <KickCounter week={now.week} />
          <PregSymptoms />
        </div>
        <ContractionTimer week={now.week} />
        <MoodCheck />
        <BabyBookCard />
        <HospitalBag />
        <LinkCards />
        <PregnancyEndedOption dueDate={dueDate} />
        <p className="text-sm text-ink-soft">{DISCLAIMER}</p>
      </div>
    </>
  );
}

function Setup() {
  const [mode, setMode] = useState<"due" | "lmp">("due");
  const [value, setValue] = useState("");
  const today = todayISO();

  function start() {
    const profile = activeProfileStore().getState().profile;
    if (!value || !profile) return;
    const due = mode === "due" ? value : dueFromLmp(value);
    setStage({ stage: "pregnancy", dueDate: due, safety: { ...profile.safety, pregnant: true } });
  }

  return (
    <>
      <PageHeader eyebrow="PREGNANCY" title="Are you expecting?" lead="Add your due date and Saheli follows you and your baby week by week." />
      <section className="card max-w-[640px]">
        <CardHead icon={Baby} title="When is your baby due?" />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="chip" aria-pressed={mode === "due"} onClick={() => setMode("due")}>
            I know my due date
          </button>
          <button type="button" className="chip" aria-pressed={mode === "lmp"} onClick={() => setMode("lmp")}>
            I know my last period
          </button>
        </div>
        <Field label={mode === "due" ? "Due date" : "First day of your last period"} className="mt-4">
          <input
            className="input"
            type="date"
            value={value}
            min={mode === "lmp" ? undefined : today}
            max={mode === "lmp" ? today : undefined}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
        <button type="button" className="btn btn-primary mt-4" onClick={start} disabled={!value}>
          Start my pregnancy
        </button>
        <p className="mt-3 text-sm text-ink-soft">
          Your pregnancy plan for food and movement is set personally by your coach, never automatically.
        </p>
      </section>
    </>
  );
}
