import { Heart, LockKeyhole, Sun } from "lucide-react";

import { getAppVersion } from "@/lib/version";

import { SettingsSection } from "./SettingsSection";

export function AboutSettings() {
  return (
    <SettingsSection
      title="About Sunnie"
      description="A calm, private planner made for a small circle of people who care about one another."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <Sun className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm font-semibold">Gentle by design</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Plan, focus, and reflect without streak pressure.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <LockKeyhole className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm font-semibold">Private by default</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Reflections stay yours and friend sharing is always explicit.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <Heart className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm font-semibold">Made for your people</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Sunnie is a personal space for friends and family.
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Sunnie Planner version {getAppVersion()}
      </p>
    </SettingsSection>
  );
}
