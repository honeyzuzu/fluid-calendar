"use client";

import { useCallback, useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ArrowRight } from "lucide-react";

import { useTheme } from "@/components/providers/ThemeProvider";
import { ThemeMotifIcon } from "@/components/theme/ThemeMotifIcon";

import {
  DAILY_INTENTION_UPDATED_EVENT,
  dateKeyInTimeZone,
  localDateKey,
} from "@/lib/daily-intention";
import { cn } from "@/lib/utils";

type DailyPlanResponse = { intention: string | null } | null;
type IntentionUpdate = { date: string; intention: string | null };
type UserSettingsResponse = { timeZone?: string | null };

export function DailyIntentionBanner() {
  const { colorTheme } = useTheme();
  const { status } = useSession();
  const pathname = usePathname();
  const [intention, setIntention] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(() => localDateKey());

  const load = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const settingsResponse = await fetch("/api/user-settings", {
        cache: "no-store",
      });
      const settings = settingsResponse.ok
        ? ((await settingsResponse.json()) as UserSettingsResponse)
        : null;
      const nextToday = dateKeyInTimeZone(
        new Date(),
        settings?.timeZone ?? null
      );
      const response = await fetch(`/api/daily-plan?date=${nextToday}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const plan = (await response.json()) as DailyPlanResponse;
      setToday(nextToday);
      setIntention(plan?.intention?.trim() || null);
      setLoaded(true);
    } catch {
      // Keep the reminder quiet if a background refresh briefly fails.
    }
  }, [status]);

  useEffect(() => {
    void load();
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<IntentionUpdate>).detail;
      if (detail?.date === today) {
        setIntention(detail.intention?.trim() || null);
        setLoaded(true);
      }
    };
    const handleFocus = () => void load();
    const interval = window.setInterval(() => void load(), 60_000);
    window.addEventListener(DAILY_INTENTION_UPDATED_EVENT, handleUpdate);
    window.addEventListener("sunnie:user-settings-updated", handleFocus);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(DAILY_INTENTION_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("sunnie:user-settings-updated", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, [load, today]);

  if (status !== "authenticated" || !loaded || pathname === "/plan")
    return null;

  return (
    <aside className="relative z-20 flex-none border-b border-border bg-accent/90 px-3 py-2 text-accent-foreground shadow-[var(--shadow-paper)] sm:px-4">
      <Link
        href="/plan"
        className="mx-auto flex max-w-[1480px] items-center gap-2.5 rounded-xl px-1 py-0.5 transition hover:text-foreground"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <ThemeMotifIcon
            motif={colorTheme.motif.intentionIcon}
            className={cn("h-4 w-4", !intention && "opacity-65")}
            aria-label={colorTheme.motif.intentionLabel}
          />
        </span>
        <div className="min-w-0 flex-1 text-xs sm:flex sm:items-baseline sm:gap-2 sm:text-sm">
          <span className="font-semibold">
            {intention ? "Today’s intention" : "Set your daily intention!"}
          </span>
          {intention && (
            <span className="block truncate opacity-70 sm:inline">
              {intention}
            </span>
          )}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 opacity-50" />
      </Link>
    </aside>
  );
}
