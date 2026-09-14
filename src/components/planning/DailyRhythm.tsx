"use client";

import { useEffect, useState } from "react";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  MoonStar,
  Sparkles,
  Sunrise,
} from "lucide-react";

import { useTheme } from "@/components/providers/ThemeProvider";
import { ThemeMotifIcon } from "@/components/theme/ThemeMotifIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

export type RhythmTask = {
  id: string;
  title: string;
  status: string;
  duration: number | null;
  completedAt?: string | null;
};

export type RhythmEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  calendarName: string;
};

export type UnwindTaskAction =
  | { kind: "done" }
  | { kind: "tomorrow" }
  | { kind: "week" }
  | { kind: "backlog" }
  | { kind: "date"; date: string };

const riseSteps = ["Welcome", "Intention", "Choose", "Make room"];
const unwindSteps = ["Sunny wins", "Clear the deck", "Let it go"];
const vibes = [
  { id: "stormy", emoji: "⛈️", label: "Stormy" },
  { id: "cloudy", emoji: "☁️", label: "Cloudy" },
  { id: "soft", emoji: "🌤️", label: "Soft" },
  { id: "sunny", emoji: "☀️", label: "Sunny" },
  { id: "glowing", emoji: "✨", label: "Glowing" },
] as const;

function StepDots({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div
      className="grid gap-1.5"
      style={{
        gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`,
      }}
    >
      {labels.map((label, index) => (
        <div key={label} className="min-w-0">
          <div
            className={cn(
              "h-1.5 rounded-full transition-colors",
              index <= step ? "bg-primary" : "bg-muted"
            )}
          />
          <span className="mt-1 hidden truncate text-[10px] text-black/40 sm:block">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function RhythmShell({
  open,
  onOpenChange,
  kind,
  step,
  labels,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "rise" | "unwind";
  step: number;
  labels: string[];
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const isRise = kind === "rise";
  return (
    <MotionConfig reducedMotion="user">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[calc(100dvh-1rem)] max-h-[760px] w-[calc(100vw-1rem)] max-w-[720px] flex-col gap-0 overflow-hidden border-0 p-0 text-foreground sm:h-auto sm:min-h-[620px]">
          <div
            className={cn(
              "relative flex-none overflow-hidden border-b border-black/[0.055] px-5 pb-4 pt-5 sm:px-7",
              isRise
                ? "bg-gradient-to-br from-[#fff8d6] via-[#ffe7aa] to-[#f8c968]"
                : "bg-gradient-to-br from-[#f7dfc5] via-[#d9cde8] to-[#aaa6d4]"
            )}
          >
            <motion.div
              aria-hidden="true"
              initial={{ y: isRise ? 30 : -12, opacity: 0 }}
              animate={{ y: 0, opacity: 0.7 }}
              className={cn(
                "absolute right-14 top-4 h-16 w-16 rounded-full",
                isRise
                  ? "bg-[#f5bd3e] shadow-[0_0_35px_#fff1a8]"
                  : "bg-[#fff7d2] shadow-[0_0_28px_#fff5cf]"
              )}
            />
            <p className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-black/50">
              {isRise ? (
                <Sunrise className="h-4 w-4" />
              ) : (
                <MoonStar className="h-4 w-4" />
              )}
              {isRise ? "Daily Rise" : "Daily Unwind"}
            </p>
            <DialogTitle className="relative mt-1 text-2xl font-semibold tracking-[-0.035em]">
              {isRise ? "Let’s welcome the day." : "Let the day settle."}
            </DialogTitle>
            <DialogDescription className="relative mt-1 text-sm text-black/55">
              {isRise
                ? "A small plan, with room to be human."
                : "Notice what moved, then put the rest somewhere safe."}
            </DialogDescription>
            <div className="relative mt-4">
              <StepDots step={step} labels={labels} />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-card p-5 sm:p-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${kind}-${step}`}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex-none border-t border-black/[0.055] bg-white px-5 py-4 sm:px-7">
            {footer}
          </div>
        </DialogContent>
      </Dialog>
    </MotionConfig>
  );
}

export function DailyRise({
  open,
  onOpenChange,
  dateLabel,
  initialIntention,
  todayTasks,
  carryoverTasks,
  availableTasks,
  capacityMessage,
  busy,
  onAddTask,
  onDurationChange,
  onSchedule,
  onFinish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel: string;
  initialIntention: string;
  todayTasks: RhythmTask[];
  carryoverTasks: RhythmTask[];
  availableTasks: RhythmTask[];
  capacityMessage: string;
  busy: boolean;
  onAddTask: (task: RhythmTask) => Promise<void>;
  onDurationChange: (task: RhythmTask, minutes: number) => Promise<void>;
  onSchedule: () => Promise<void>;
  onFinish: (intention: string) => Promise<void>;
}) {
  const { colorTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initialIntention);
  useEffect(() => {
    if (open) {
      setStep(0);
      setDraft(initialIntention);
    }
  }, [initialIntention, open]);

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={() =>
          step === 0 ? onOpenChange(false) : setStep((value) => value - 1)
        }
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-black/50 hover:bg-black/[0.04]"
      >
        {step > 0 && <ArrowLeft className="h-4 w-4" />}
        {step === 0 ? "Not now" : "Back"}
      </button>
      {step < riseSteps.length - 1 ? (
        <button
          onClick={() => setStep((value) => value + 1)}
          disabled={step === 1 && !draft.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          Next <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => void onFinish(draft)}
          disabled={busy || !draft.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sunrise className="h-4 w-4" />
          )}
          Start my day
        </button>
      )}
    </div>
  );

  return (
    <RhythmShell
      open={open}
      onOpenChange={onOpenChange}
      kind="rise"
      step={step}
      labels={riseSteps}
      footer={footer}
    >
      {step === 0 && (
        <div className="grid min-h-[300px] place-items-center text-center">
          <div>
            <motion.div
              animate={{ rotate: [0, -7, 7, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              className="text-6xl"
            >
              🐣
            </motion.div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#a16b2c]">
              {dateLabel}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Good morning, sunshine.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">
              You do not need to fit everything into today. Let’s choose what
              deserves your light.
            </p>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="mx-auto max-w-xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            <ThemeMotifIcon
              motif={colorTheme.motif.intentionIcon}
              className="h-4 w-4"
              aria-label={colorTheme.motif.intentionLabel}
            />{" "}
            Today’s direction
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            What would make today meaningful?
          </h2>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={6}
            autoFocus
            maxLength={500}
            placeholder="Move gently, finish the important thing, make space to breathe…"
            className="mt-5 w-full resize-none rounded-2xl border border-border bg-card p-4 text-base leading-7 outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}
      {step === 2 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c26343]">
            Choose what matters
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Keep today small enough to hold.
          </h2>
          <div className="mt-5 space-y-2">
            {carryoverTasks.length > 0 && (
              <div className="mb-4 rounded-2xl border border-[#efd9a8] bg-[#fff7df] p-3">
                <p className="text-xs font-semibold text-[#8b672c]">
                  Still here from yesterday
                </p>
                <p className="mt-0.5 text-[11px] text-black/45">
                  Your last Unwind was not finished. Bring forward only what
                  still matters.
                </p>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  {carryoverTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => void onAddTask(task)}
                      className="flex min-w-0 items-center gap-2 rounded-xl bg-white/75 px-3 py-2 text-left text-xs hover:bg-white"
                    >
                      <span className="text-[#d0902f]">＋</span>
                      <span className="truncate">{task.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-muted p-3"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {task.title}
                </span>
                <select
                  aria-label={`Estimate for ${task.title}`}
                  value={task.duration ?? 30}
                  onChange={(event) =>
                    void onDurationChange(task, Number(event.target.value))
                  }
                  className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs"
                >
                  {[15, 30, 45, 60, 90, 120].map((value) => (
                    <option key={value} value={value}>
                      {value < 60 ? `${value}m` : `${value / 60}h`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {todayTasks.length === 0 && (
              <p className="rounded-2xl border border-dashed border-black/10 p-5 text-center text-sm text-black/40">
                Your day is open. Choose a task below—or keep it open.
              </p>
            )}
          </div>
          {availableTasks.length > 0 && (
            <details className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-3">
              <summary className="cursor-pointer text-sm font-semibold">
                Choose from this week
              </summary>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {availableTasks.slice(0, 12).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => void onAddTask(task)}
                    className="flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-[#fff4d5]"
                  >
                    <span className="text-[#d0902f]">＋</span>
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="grid min-h-[300px] place-items-center">
          <div className="w-full max-w-xl rounded-3xl border border-[#d8dfc8] bg-gradient-to-br from-[#f5f8e9] to-white p-6 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-3 text-2xl font-semibold">
              Make room for the plan.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">
              {capacityMessage}
            </p>
            <p className="mt-4 text-sm font-semibold">
              {todayTasks.length} task{todayTasks.length === 1 ? "" : "s"} ·{" "}
              {todayTasks.reduce((sum, task) => sum + (task.duration ?? 30), 0)}{" "}
              minutes
            </p>
            {todayTasks.length > 0 && (
              <button
                onClick={() => void onSchedule()}
                disabled={busy}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#c8d8aa] bg-white px-4 py-2.5 text-sm font-semibold text-[#52683d] shadow-sm"
              >
                <Sparkles className="h-4 w-4" /> Schedule around my calendar
              </button>
            )}
            <p className="mt-3 text-xs text-black/35">
              Scheduling is optional. Leaving open space is a plan too.
            </p>
          </div>
        </div>
      )}
    </RhythmShell>
  );
}

export function DailyUnwind({
  open,
  onOpenChange,
  completedTasks,
  unfinishedTasks,
  endedEvents,
  timeZone,
  initialVibe,
  initialReflection,
  earliestTaskDate,
  busy,
  onTaskAction,
  onFinish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedTasks: RhythmTask[];
  unfinishedTasks: RhythmTask[];
  endedEvents: RhythmEvent[];
  timeZone: string | null;
  initialVibe: string | null;
  initialReflection: string;
  earliestTaskDate: string;
  busy: boolean;
  onTaskAction: (task: RhythmTask, action: UnwindTaskAction) => Promise<void>;
  onFinish: (vibe: string | null, reflection: string) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [vibe, setVibe] = useState<string | null>(initialVibe);
  const [reflection, setReflection] = useState(initialReflection);
  const [dates, setDates] = useState<Record<string, string>>({});
  useEffect(() => {
    if (open) {
      setStep(0);
      setVibe(initialVibe);
      setReflection(initialReflection);
    }
  }, [initialReflection, initialVibe, open]);
  const unresolved = unfinishedTasks.length;
  const footer = (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={() =>
          step === 0 ? onOpenChange(false) : setStep((value) => value - 1)
        }
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-black/50 hover:bg-black/[0.04]"
      >
        {step > 0 && <ArrowLeft className="h-4 w-4" />}
        {step === 0 ? "Not now" : "Back"}
      </button>
      {step < unwindSteps.length - 1 ? (
        <button
          onClick={() => setStep((value) => value + 1)}
          disabled={step === 1 && unresolved > 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === 1 && unresolved > 0
            ? `Place ${unresolved} task${unresolved === 1 ? "" : "s"}`
            : "Next"}
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => void onFinish(vibe, reflection)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-semibold text-success-foreground disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoonStar className="h-4 w-4" />
          )}
          Close the day
        </button>
      )}
    </div>
  );

  return (
    <RhythmShell
      open={open}
      onOpenChange={onOpenChange}
      kind="unwind"
      step={step}
      labels={unwindSteps}
      footer={footer}
    >
      {step === 0 && (
        <div className="grid min-h-[320px] place-items-center text-center">
          <div>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="text-6xl"
            >
              🐣
            </motion.div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
              Look what found the light.
            </h2>
            <p className="mt-2 text-sm text-black/50">
              {completedTasks.length} task
              {completedTasks.length === 1 ? "" : "s"} completed
              {endedEvents.length > 0
                ? ` · ${endedEvents.length} calendar moment${endedEvents.length === 1 ? "" : "s"} passed`
                : ""}
            </p>
            <div className="mx-auto mt-5 grid max-w-md gap-4 text-left sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#718e50]">
                  Tasks completed
                </p>
                {completedTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded-xl bg-[#eef3df] px-3 py-2 text-sm"
                  >
                    <Check className="h-4 w-4 text-[#718e50]" />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
                {completedTasks.length === 0 && (
                  <p className="rounded-2xl bg-[#f5f1e8] p-4 text-center text-sm text-black/45">
                    Some days are for tending, waiting, or simply getting
                    through. That counts too.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8069a8]">
                  Calendar moments
                </p>
                {endedEvents.slice(0, 6).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl bg-[#f1edf6] px-3 py-2"
                  >
                    <p className="truncate text-sm">{event.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-black/40">
                      {new Intl.DateTimeFormat(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                        ...(timeZone && { timeZone }),
                      }).format(new Date(event.start))}{" "}
                      · {event.calendarName}
                    </p>
                  </div>
                ))}
                {endedEvents.length === 0 && (
                  <p className="rounded-2xl bg-[#f5f1e8] p-4 text-center text-sm text-black/45">
                    No ended calendar moments to carry into your reflection.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {step === 1 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8069a8]">
            Clear the deck
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Where should the unfinished things rest?
          </h2>
          <p className="mt-2 text-sm text-black/45">
            Nothing rolls forward silently. Give each task a safe place.
          </p>
          <div className="mt-5 space-y-3">
            {unfinishedTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-[#ddd5e8] bg-white p-3"
              >
                <p className="text-sm font-medium">{task.title}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(
                    [
                      ["done", "Done"],
                      ["tomorrow", "Tomorrow"],
                      ["week", "This week"],
                      ["backlog", "Backlog"],
                    ] as const
                  ).map(([kind, label]) => (
                    <button
                      key={kind}
                      disabled={busy}
                      onClick={() => void onTaskAction(task, { kind })}
                      className="rounded-lg border border-black/10 bg-[#faf8f2] px-2.5 py-1.5 text-xs font-semibold hover:bg-[#eef3df]"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="flex min-w-[190px] flex-1 items-center justify-end gap-1.5">
                    <input
                      aria-label={`Choose another day for ${task.title}`}
                      type="date"
                      min={earliestTaskDate}
                      value={dates[task.id] ?? ""}
                      onChange={(event) =>
                        setDates((current) => ({
                          ...current,
                          [task.id]: event.target.value,
                        }))
                      }
                      className="min-w-0 rounded-lg border border-black/10 px-2 py-1 text-xs"
                    />
                    <button
                      disabled={!dates[task.id] || busy}
                      onClick={() =>
                        void onTaskAction(task, {
                          kind: "date",
                          date: dates[task.id],
                        })
                      }
                      className="rounded-lg bg-[#69658e] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-35"
                    >
                      Move
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {unfinishedTasks.length === 0 && (
              <div className="rounded-2xl border border-[#c8d8aa] bg-[#eef3df] p-6 text-center">
                <CheckCircle2 className="mx-auto h-7 w-7 text-success" />
                <p className="mt-2 text-sm font-semibold">
                  Everything has a home.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8069a8]">
            One last breath
          </p>
          <h2 className="mt-2 text-2xl font-semibold">How did today feel?</h2>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {vibes.map((option) => (
              <button
                key={option.id}
                onClick={() => setVibe(option.id)}
                aria-pressed={vibe === option.id}
                className={cn(
                  "rounded-2xl border p-2 text-center transition",
                  vibe === option.id
                    ? "border-[#8d82ad] bg-[#eee9f5] shadow-sm"
                    : "border-black/[0.07] bg-white hover:bg-[#faf7fc]"
                )}
              >
                <span className="block text-2xl" aria-hidden="true">
                  {option.emoji}
                </span>
                <span className="mt-1 block truncate text-[10px] text-black/50">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
          <label
            className="mt-6 block text-sm font-semibold"
            htmlFor="unwind-reflection"
          >
            What would you like to leave here tonight?{" "}
            <span className="font-normal text-black/35">Optional</span>
          </label>
          <textarea
            id="unwind-reflection"
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="A thought, a worry, or something you learned…"
            className="mt-2 w-full resize-none rounded-2xl border border-[#ddd5e8] bg-white p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-[#c9bfdb]"
          />
          <p className="mt-5 text-center text-sm text-black/45">
            <Clock3 className="mr-1 inline h-4 w-4" />
            Tomorrow can wait until tomorrow.
          </p>
        </div>
      )}
    </RhythmShell>
  );
}
