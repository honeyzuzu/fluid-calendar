"use client";

import { useEffect, useMemo, useState } from "react";

import { ChevronLeft, ChevronRight, Flower2, Sprout } from "lucide-react";

import { SunniePanel, SunnieSkeleton } from "@/components/ui/sunnie";

import { MOOD_STATES } from "@/lib/moods";

import type { DailyMoodEntry, MoodValue } from "@/types/mood";

const pad = (value: number) => String(value).padStart(2, "0");
const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const entryDateKey = (entry: DailyMoodEntry) =>
  typeof entry.date === "string"
    ? entry.date.slice(0, 10)
    : entry.date.toISOString().slice(0, 10);

function moodLabel(value: MoodValue) {
  return MOOD_STATES.find((state) => state.value === value)?.label ?? "Logged";
}

export function MoodGarden({
  initialMonth,
  refreshKey,
}: {
  initialMonth: Date;
  refreshKey: string;
}) {
  const [month, setMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
  );
  const [entries, setEntries] = useState<DailyMoodEntry[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const monthKey = `${month.getFullYear()}-${pad(month.getMonth() + 1)}`;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/moods?month=${monthKey}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Mood Garden could not open");
        return (await response.json()) as DailyMoodEntry[];
      })
      .then(setEntries)
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError(
          caught instanceof Error
            ? caught.message
            : "Mood Garden could not open"
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [monthKey, refreshKey]);

  const entriesByDay = useMemo(() => {
    const grouped = new Map<string, DailyMoodEntry[]>();
    for (const entry of entries) {
      const key = entryDateKey(entry);
      grouped.set(key, [...(grouped.get(key) ?? []), entry]);
    }
    return grouped;
  }, [entries]);
  const dayCount = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();
  const leadingDays = month.getDay();
  const selectedEntries = selectedKey
    ? (entriesByDay.get(selectedKey) ?? [])
    : [];
  const riseCount = entries.filter((entry) => entry.phase === "rise").length;
  const unwindCount = entries.filter(
    (entry) => entry.phase === "unwind"
  ).length;

  const moveMonth = (offset: number) => {
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1)
    );
    setSelectedKey(null);
  };

  return (
    <SunniePanel className="mb-5 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-accent/20 px-4 py-3 sm:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Private reflection
          </p>
          <h2 className="text-lg font-semibold">Mood Garden</h2>
          <p className="text-xs text-muted-foreground">
            A small record of how your days felt—not a score.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label="Previous mood month"
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-32 text-center text-sm font-semibold">
            {month.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            aria-label="Next mood month"
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {loading ? (
          <div aria-label="Growing your Mood Garden">
            <SunnieSkeleton className="h-64 rounded-2xl" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day} className="py-1">
                  {day}
                </span>
              ))}
              {Array.from({ length: leadingDays }, (_, index) => (
                <span key={`blank-${index}`} />
              ))}
              {Array.from({ length: dayCount }, (_, index) => {
                const day = index + 1;
                const date = new Date(
                  month.getFullYear(),
                  month.getMonth(),
                  day
                );
                const key = localDateKey(date);
                const dayEntries = entriesByDay.get(key) ?? [];
                const rise = dayEntries.find((entry) => entry.phase === "rise");
                const unwind = dayEntries.find(
                  (entry) => entry.phase === "unwind"
                );
                const display = unwind ?? rise;
                const Plant = display && display.mood >= 4 ? Flower2 : Sprout;
                const detail = dayEntries.length
                  ? dayEntries
                      .map(
                        (entry) =>
                          `${entry.phase === "rise" ? "Morning" : "Evening"}: ${moodLabel(entry.mood)}${entry.note ? ` — ${entry.note}` : ""}`
                      )
                      .join("\n")
                  : `${date.toLocaleDateString()}: no check-in`;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    title={detail}
                    aria-label={detail.replaceAll("\n", ". ")}
                    className="relative grid min-h-14 place-items-center rounded-xl border border-border/70 bg-card p-1 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-paper)]"
                    style={
                      display
                        ? {
                            backgroundColor: `hsl(var(--mood-${display.mood}) / 0.16)`,
                          }
                        : undefined
                    }
                  >
                    <span className="absolute left-1.5 top-1 text-[9px] text-muted-foreground">
                      {day}
                    </span>
                    {display ? (
                      <Plant
                        aria-hidden="true"
                        className={display.mood <= 2 ? "h-5 w-5" : "h-7 w-7"}
                        style={{ color: `hsl(var(--mood-${display.mood}))` }}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 rounded-full bg-border"
                      />
                    )}
                    {rise && unwind && (
                      <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-muted/65 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                You logged {riseCount} morning{riseCount === 1 ? "" : "s"} and{" "}
                {unwindCount} evening{unwindCount === 1 ? "" : "s"} this month.
              </p>
              <p>No streaks. Just something gentle to notice.</p>
            </div>

            {selectedKey && (
              <div className="mt-3 rounded-2xl border border-border bg-card p-3">
                <p className="text-sm font-semibold">
                  {new Date(`${selectedKey}T12:00:00`).toLocaleDateString(
                    undefined,
                    { weekday: "long", month: "long", day: "numeric" }
                  )}
                </p>
                {selectedEntries.length ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {selectedEntries.map((entry) => (
                      <div key={entry.id} className="rounded-xl bg-muted p-3">
                        <p className="text-xs font-semibold">
                          {entry.phase === "rise" ? "Morning" : "Evening"} ·{" "}
                          {moodLabel(entry.mood)}
                        </p>
                        {entry.note && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    No mood check-in for this day.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </SunniePanel>
  );
}
