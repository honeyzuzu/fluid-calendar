"use client";

import { useCallback, useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import Link from "next/link";

import { ArrowRight, Sparkles, Sun } from "lucide-react";

import {
  DAILY_INTENTION_UPDATED_EVENT,
  localDateKey,
} from "@/lib/daily-intention";

type DailyPlanResponse = { intention: string | null } | null;
type IntentionUpdate = { date: string; intention: string | null };

export function DailyIntentionBanner() {
  const { status } = useSession();
  const [intention, setIntention] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const today = localDateKey();

  const load = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const response = await fetch(`/api/daily-plan?date=${today}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const plan = (await response.json()) as DailyPlanResponse;
      setIntention(plan?.intention?.trim() || null);
      setLoaded(true);
    } catch {
      // Keep the reminder quiet if a background refresh briefly fails.
    }
  }, [status, today]);

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
    window.addEventListener(DAILY_INTENTION_UPDATED_EVENT, handleUpdate);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener(DAILY_INTENTION_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, [load, today]);

  if (status !== "authenticated" || !loaded) return null;

  return (
    <aside className="relative z-20 flex-none border-b border-[#e4dfbd] bg-[#fff4c9]/95 px-3 py-2 text-[#5c5537] shadow-[0_2px_12px_rgba(94,83,43,0.05)] sm:px-4">
      <Link
        href="/plan"
        className="mx-auto flex max-w-[1480px] items-center gap-2.5 rounded-xl px-1 py-0.5 transition hover:text-[#4d5c38]"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f4c85b] text-[#624b18] shadow-[0_2px_0_#d9a53c]">
          {intention ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1 text-xs sm:flex sm:items-baseline sm:gap-2 sm:text-sm">
          <span className="font-semibold">
            {intention ? "Today’s intention" : "Set your daily intention!"}
          </span>
          {intention && (
            <span className="block truncate text-black/55 sm:inline">
              {intention}
            </span>
          )}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-black/35" />
      </Link>
    </aside>
  );
}
