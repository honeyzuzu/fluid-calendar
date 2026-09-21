"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import { MotionConfig, motion } from "framer-motion";
import { MoonStar, Sunrise, X } from "lucide-react";

import { CURRENT_ONBOARDING_VERSION } from "@/lib/onboarding";

type RitualKind = "rise" | "unwind";

type PromptSettings = {
  dailyRiseEnabled: boolean;
  dailyRiseTime: string;
  dailyUnwindEnabled: boolean;
  dailyUnwindTime: string;
  dailyRitualDays: "working" | "everyday";
  timeZone: string;
  onboardingVersion: number;
};

type PromptConfig = {
  settings: PromptSettings;
  workingDays: number[];
  loadedAt: number;
};

type PlanStatus = {
  completedAt: string | null;
  unwindCompletedAt: string | null;
} | null;

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function DailyRhythmPrompt() {
  const pathname = usePathname();
  const [kind, setKind] = useState<RitualKind | null>(null);
  const [dateKey, setDateKey] = useState("");
  const configRef = useRef<PromptConfig | null>(null);

  const check = useCallback(async () => {
    if (
      pathname.startsWith("/auth") ||
      pathname === "/setup" ||
      pathname === "/plan" ||
      pathname === "/today" ||
      pathname.startsWith("/preview")
    ) {
      setKind(null);
      return;
    }

    try {
      const now = new Date();
      let config = configRef.current;
      if (!config || now.getTime() - config.loadedAt > 15 * 60_000) {
        const [settingsResponse, calendarResponse] = await Promise.all([
          fetch("/api/user-settings", { cache: "no-store" }),
          fetch("/api/calendar-settings", { cache: "no-store" }),
        ]);
        if (!settingsResponse.ok || !calendarResponse.ok) return;
        const settings = (await settingsResponse.json()) as PromptSettings;
        const calendar = (await calendarResponse.json()) as {
          workingHoursDays: string;
        };
        config = {
          settings,
          workingDays: JSON.parse(calendar.workingHoursDays) as number[],
          loadedAt: now.getTime(),
        };
        configRef.current = config;
      }
      const { settings, workingDays } = config;
      if (settings.onboardingVersion < CURRENT_ONBOARDING_VERSION) {
        setKind(null);
        return;
      }
      const zonedParts = new Intl.DateTimeFormat("en-US", {
        timeZone: settings.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        weekday: "short",
      }).formatToParts(now);
      const part = (type: Intl.DateTimeFormatPartTypes) =>
        zonedParts.find((item) => item.type === type)?.value ?? "";
      const key = `${part("year")}-${part("month")}-${part("day")}`;
      const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
        part("weekday")
      );
      if (
        settings.dailyRitualDays === "working" &&
        !workingDays.includes(weekday)
      ) {
        setKind(null);
        return;
      }

      const nowMinutes = Number(part("hour")) * 60 + Number(part("minute"));
      const unwindDue =
        settings.dailyUnwindEnabled &&
        nowMinutes >= minutes(settings.dailyUnwindTime);
      const riseDue =
        settings.dailyRiseEnabled &&
        nowMinutes >= minutes(settings.dailyRiseTime);
      if (!unwindDue && !riseDue) {
        setKind(null);
        return;
      }
      const planResponse = await fetch(`/api/daily-plan?date=${key}`, {
        cache: "no-store",
      });
      if (!planResponse.ok) return;
      const plan = (await planResponse.json()) as PlanStatus;
      const nextKind =
        unwindDue && !plan?.unwindCompletedAt
          ? "unwind"
          : riseDue && !plan?.completedAt
            ? "rise"
            : null;
      if (
        nextKind &&
        window.sessionStorage.getItem(
          `sunnie-rhythm-dismissed-${key}-${nextKind}`
        )
      ) {
        setKind(null);
        return;
      }
      setDateKey(key);
      setKind(nextKind);
    } catch {
      // Keep scheduled invitations quiet during a brief network or settings failure.
    }
  }, [pathname]);

  useEffect(() => {
    void check();
    const interval = window.setInterval(() => void check(), 60_000);
    const refreshSettings = () => {
      configRef.current = null;
      void check();
    };
    window.addEventListener("sunnie:user-settings-updated", refreshSettings);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        "sunnie:user-settings-updated",
        refreshSettings
      );
    };
  }, [check]);

  if (!kind) return null;
  const isRise = kind === "rise";

  return (
    <MotionConfig reducedMotion="user">
      <motion.aside
        role="status"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-[55] overflow-hidden rounded-2xl border border-border p-4 text-foreground shadow-[var(--shadow-raised)] lg:bottom-5 lg:left-auto lg:right-5 lg:w-[360px] ${isRise ? "sunnie-rise-surface" : "sunnie-unwind-surface"}`}
      >
        <button
          aria-label="Not now"
          onClick={() => {
            window.sessionStorage.setItem(
              `sunnie-rhythm-dismissed-${dateKey}-${kind}`,
              "true"
            );
            setKind(null);
          }}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-card/50 text-foreground/60 hover:bg-card/75"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-8">
          <motion.span
            aria-hidden="true"
            animate={{ rotate: isRise ? [0, -8, 8, 0] : [0, 5, -5, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2 }}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-card/60 text-xl"
          >
            {isRise ? "🐣" : "🌙"}
          </motion.span>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              {isRise ? (
                <Sunrise className="h-4 w-4" />
              ) : (
                <MoonStar className="h-4 w-4" />
              )}
              {isRise
                ? "Ready for your Daily Rise?"
                : "Time for a gentle Unwind?"}
            </p>
            <p className="mt-1 text-xs leading-5 text-foreground/65">
              {isRise
                ? "Choose what matters and make a day that really fits."
                : "Celebrate what moved and leave unfinished work somewhere safe."}
            </p>
            <a
              href={`/plan?date=${dateKey}&ritual=${kind}`}
              className="mt-3 inline-flex rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
            >
              {isRise ? "Begin my Rise" : "Begin my Unwind"}
            </a>
          </div>
        </div>
      </motion.aside>
    </MotionConfig>
  );
}
