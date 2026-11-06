import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import {
  ColourTheme,
  FamilyProfiles,
  HomeScreenCard,
  LanguageCountry,
  LightOrDark,
  MoodAdaptive,
  SampleCards,
} from "@/components/settings/SettingsSections";
import { HealthSync } from "@/components/sync/HealthSync";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="SETTINGS" title="Settings" lead="Language, themes, family profiles and sample data." />
      <div className="space-y-5">
        <HomeScreenCard />
        <LanguageCountry />
        <FamilyProfiles />
        <HealthSync />
        <ColourTheme />
        <div className="grid items-start gap-5 md:grid-cols-2">
          <LightOrDark />
          <MoodAdaptive />
        </div>
        <SampleCards />
      </div>
    </>
  );
}
