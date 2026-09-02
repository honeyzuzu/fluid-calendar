"use client";

import { useCallback, useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  Sun,
} from "lucide-react";

import { SunnieSun } from "@/components/brand/SunnieSun";
import { AccountManager } from "@/components/settings/AccountManager";

import { formatIntentionQuote } from "@/lib/daily-intention";
import {
  CURRENT_ONBOARDING_VERSION,
  ONBOARDING_SESSION_KEY,
  ONBOARDING_STEPS,
  type OnboardingStep,
  SLEEP_ONBOARDING_STEPS,
  clampOnboardingStep,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";

import { useFocusModeStore } from "@/store/focusMode";
import { useTaskStore } from "@/store/task";

type OnboardingCalendar = {
  id: string;
  name: string;
  color: string | null;
  enabled: boolean;
  type: string;
  account: { email: string; provider: string } | null;
};

type OnboardingStatus = {
  onboardingVersion: number;
  currentVersion: number;
  connectedAccountCount: number;
  calendars: OnboardingCalendar[];
  sleepHoursStart: string;
  sleepHoursEnd: string;
  sleepHoursConfigured: boolean;
};

function StepQuote({
  stepIndex,
  steps,
}: {
  stepIndex: number;
  steps: OnboardingStep[];
}) {
  return (
    <p className="mt-4 border-t border-[#e8dfbc] pt-3 text-[11px] italic leading-relaxed text-[#7a7356]">
      {formatIntentionQuote(steps[stepIndex].quote)}
    </p>
  );
}

function StepProgress({
  stepIndex,
  steps,
}: {
  stepIndex: number;
  steps: OnboardingStep[];
}) {
  return (
    <div aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
      <span className="text-[10px] font-bold text-[#9a7132] sm:hidden">
        {stepIndex + 1}/{steps.length}
      </span>
      <div className="hidden items-center gap-1.5 sm:flex">
        {steps.map((step, index) => (
          <span
            key={step.id}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === stepIndex
                ? "w-6 bg-[#d89c32]"
                : index < stepIndex
                  ? "w-2 bg-[#9fb878]"
                  : "w-2 bg-[#ded8bb]"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function OnboardingTour() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [stepIndex, setStepIndex] = useState(0);
  const [tourKind, setTourKind] = useState<"full" | "sleep">("full");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [calendarBusy, setCalendarBusy] = useState<string | null>(null);
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sleepHoursStart, setSleepHoursStart] = useState("23:00");
  const [sleepHoursEnd, setSleepHoursEnd] = useState("07:00");
  const [practiceTaskTitle, setPracticeTaskTitle] = useState(
    "Try a 25-minute focus session"
  );
  const [practiceTaskId, setPracticeTaskId] = useState<string | null>(null);
  const steps =
    tourKind === "sleep" ? SLEEP_ONBOARDING_STEPS : ONBOARDING_STEPS;

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/onboarding", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load your welcome tour");
    const nextStatus = (await response.json()) as OnboardingStatus;
    setOnboardingStatus(nextStatus);
    return nextStatus;
  }, []);

  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      if (sessionStatus === "unauthenticated") setIsLoading(false);
      return;
    }

    let active = true;
    void loadStatus()
      .then((nextStatus) => {
        if (!active) return;
        if (nextStatus.onboardingVersion < CURRENT_ONBOARDING_VERSION) {
          setSleepHoursStart(nextStatus.sleepHoursStart || "23:00");
          setSleepHoursEnd(nextStatus.sleepHoursEnd || "07:00");
          if (
            nextStatus.onboardingVersion > 0 &&
            nextStatus.sleepHoursConfigured
          ) {
            void fetch("/api/onboarding", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ completed: true }),
            });
            return;
          }
          const isSleepUpdate = nextStatus.onboardingVersion > 0;
          setTourKind(isSleepUpdate ? "sleep" : "full");
          const storedStep = Number(
            window.sessionStorage.getItem(ONBOARDING_SESSION_KEY) || 0
          );
          const storedPracticeTaskId = window.sessionStorage.getItem(
            "sunnie:onboarding-focus-task"
          );
          setPracticeTaskId(storedPracticeTaskId);
          if (storedPracticeTaskId) {
            useFocusModeStore.getState().switchToTask(storedPracticeTaskId);
          }
          setStepIndex(
            isSleepUpdate
              ? 0
              : clampOnboardingStep(storedStep, ONBOARDING_STEPS.length)
          );
          setIsOpen(true);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load your welcome tour"
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadStatus, sessionStatus]);

  useEffect(() => {
    if (!isOpen) return;
    window.sessionStorage.setItem(ONBOARDING_SESSION_KEY, String(stepIndex));
    const step = steps[stepIndex];
    if (step.layout === "tour" && step.href && pathname !== step.href) {
      router.push(step.href);
    }
  }, [isOpen, pathname, router, stepIndex, steps]);

  const moveTo = async (nextIndex: number) => {
    setError(null);
    if (steps[stepIndex].id === "connect") {
      try {
        await loadStatus();
      } catch {
        // Calendar status can be refreshed again on the next screen.
      }
    }
    setStepIndex(clampOnboardingStep(nextIndex, steps.length));
  };

  const saveSleepHours = async (completed = false) => {
    if (sleepHoursStart === sleepHoursEnd) {
      throw new Error("Choose different bedtime and wake-up times");
    }
    const response = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sleepHoursStart, sleepHoursEnd, completed }),
    });
    if (!response.ok) throw new Error("Unable to save your sleep hours");
  };

  const completeTour = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (tourKind === "sleep") await saveSleepHours(true);
      else {
        const response = await fetch("/api/onboarding", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        });
        if (!response.ok) throw new Error("Unable to finish the welcome tour");
      }
      window.sessionStorage.removeItem(ONBOARDING_SESSION_KEY);
      window.sessionStorage.removeItem("sunnie:onboarding-focus-task");
      setIsOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to finish the welcome tour"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const createPracticeTask = async () => {
    if (!practiceTaskTitle.trim() || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: practiceTaskTitle.trim(),
          status: "todo",
          duration: 25,
          priority: "medium",
          energyLevel: "medium",
          isAutoScheduled: true,
          scheduleLocked: false,
          isRecurring: false,
        }),
      });
      if (!response.ok) throw new Error("Unable to create the practice task");
      const task = (await response.json()) as { id: string };
      setPracticeTaskId(task.id);
      window.sessionStorage.setItem("sunnie:onboarding-focus-task", task.id);
      await useTaskStore.getState().fetchTasks();
      useFocusModeStore.getState().switchToTask(task.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create the task"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCalendar = async (calendar: OnboardingCalendar) => {
    const nextEnabled = !calendar.enabled;
    setCalendarBusy(calendar.id);
    setError(null);
    setOnboardingStatus((current) =>
      current
        ? {
            ...current,
            calendars: current.calendars.map((item) =>
              item.id === calendar.id ? { ...item, enabled: nextEnabled } : item
            ),
          }
        : current
    );

    try {
      const response = await fetch("/api/feeds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: calendar.id, enabled: nextEnabled }),
      });
      if (!response.ok) throw new Error("Unable to update that calendar");
    } catch (caught) {
      setOnboardingStatus((current) =>
        current
          ? {
              ...current,
              calendars: current.calendars.map((item) =>
                item.id === calendar.id
                  ? { ...item, enabled: calendar.enabled }
                  : item
              ),
            }
          : current
      );
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update that calendar"
      );
    } finally {
      setCalendarBusy(null);
    }
  };

  if (isLoading || !isOpen || sessionStatus !== "authenticated") return null;

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const firstName = session?.user?.name?.split(" ")[0];

  if (step.layout === "tour") {
    return (
      <section
        aria-label="Sunnie welcome tour"
        aria-live="polite"
        className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[100] ml-auto max-w-sm rounded-3xl border border-[#ded6ad] bg-[#fffaf0]/[0.98] p-4 text-[#514d38] shadow-[0_20px_70px_rgba(61,56,34,0.24)] backdrop-blur sm:bottom-5 sm:right-5 sm:left-auto sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <StepProgress stepIndex={stepIndex} steps={steps} />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a1742e]">
            Tiny tour
          </span>
        </div>
        <div className="mt-4 flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5cf66] text-[#684f1d] shadow-[0_3px_0_#deb44d]">
            <Sun className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold tracking-tight">{step.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#716b50]">
              {step.description}
            </p>
          </div>
        </div>
        {step.id === "practice-task" && (
          <div className="mt-4 rounded-2xl border border-[#e2d9b6] bg-white/65 p-3">
            <label
              htmlFor="onboarding-practice-task"
              className="text-xs font-bold text-[#62684b]"
            >
              Your practice task
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="onboarding-practice-task"
                value={practiceTaskTitle}
                onChange={(event) => setPracticeTaskTitle(event.target.value)}
                disabled={Boolean(practiceTaskId)}
                className="min-w-0 flex-1 rounded-xl border border-[#d8d4b9] bg-[#fffdf7] px-3 py-2 text-sm outline-none focus:border-[#91a96d]"
              />
              <button
                type="button"
                onClick={() => void createPracticeTask()}
                disabled={isSaving || Boolean(practiceTaskId)}
                className="rounded-xl bg-[#d89c32] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {practiceTaskId ? "Created!" : "Create"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[#7a7356]">
              {practiceTaskId
                ? "Perfect — Next will open this task in Focus."
                : "Make this one, or rename it to something you really want to do."}
            </p>
          </div>
        )}
        <StepQuote stepIndex={stepIndex} steps={steps} />
        {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => moveTo(stepIndex - 1)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#716b50] hover:bg-[#f2ecd7]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button
            type="button"
            onClick={() =>
              isLastStep ? void completeTour() : void moveTo(stepIndex + 1)
            }
            disabled={
              isSaving || (step.id === "practice-task" && !practiceTaskId)
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#607249] px-4 py-2 text-xs font-bold text-white shadow-[0_3px_0_#465536] hover:bg-[#53643e] disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isLastStep ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#596047]/35 p-3 backdrop-blur-sm sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className={cn(
          "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-[1.75rem] border border-[#e4dbb7] bg-[#fffaf0] text-[#514d38] shadow-[0_30px_100px_rgba(55,51,31,0.28)]",
          step.id === "welcome" ? "max-w-xl" : "max-w-4xl"
        )}
      >
        <header className="flex-none border-b border-[#e9e1c2] bg-[#fff3c8]/70 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SunnieSun className="h-10 w-10" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bf8128]">
                  A sunny start
                </p>
                <h1
                  id="onboarding-title"
                  className="text-lg font-bold tracking-tight sm:text-xl"
                >
                  {step.title}
                </h1>
              </div>
            </div>
            <StepProgress stepIndex={stepIndex} steps={steps} />
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#716b50]">
            {step.description}
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {step.id === "welcome" && (
            <div className="py-3 text-center sm:py-8">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#f8d76f]/35">
                <Sparkles className="h-9 w-9 text-[#d69a2f]" />
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-[#4f583d]">
                {firstName ? `Hi ${firstName}!` : "Hi there!"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#716b50]">
                We&apos;ll connect the calendars you want, choose what appears,
                and show you the essentials. It only takes a couple of minutes.
              </p>
              <div className="mx-auto mt-6 grid max-w-md gap-2 text-left sm:grid-cols-3">
                {["Connect", "Choose", "Take a tiny tour"].map(
                  (label, index) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-[#e8dfbc] bg-white/55 p-3 text-xs font-semibold text-[#62684b]"
                    >
                      <span className="mr-2 text-[#c58b2f]">{index + 1}.</span>
                      {label}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {step.id === "connect" && (
            <div className="rounded-2xl [&_.space-y-6>div]:border-[#e5dcba]">
              <AccountManager />
            </div>
          )}

          {step.id === "choose-calendars" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e7dfbf] bg-[#f4f6e9] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#dce8c3] text-[#607249]">
                    <CalendarCheck2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">
                      {onboardingStatus?.calendars.length || 0} calendars found
                    </p>
                    <p className="text-xs text-[#777158]">
                      Enabled calendars appear throughout Sunnie.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void loadStatus()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d4b9] bg-white/70 px-3 py-2 text-xs font-semibold hover:bg-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>

              {onboardingStatus?.calendars.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {onboardingStatus.calendars.map((calendar) => (
                    <button
                      key={calendar.id}
                      type="button"
                      onClick={() => void toggleCalendar(calendar)}
                      disabled={calendarBusy === calendar.id}
                      aria-pressed={calendar.enabled}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-60",
                        calendar.enabled
                          ? "border-[#b9c999] bg-[#eff4e2]"
                          : "border-[#e3ddc4] bg-white/55 opacity-75"
                      )}
                    >
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: calendar.color || "#f4c85b" }}
                      >
                        {calendar.enabled && (
                          <Check className="h-4 w-4 text-white drop-shadow" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">
                          {calendar.name}
                        </span>
                        <span className="block truncate text-[11px] text-[#7b755c]">
                          {calendar.account?.email || calendar.type}
                        </span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#788160]">
                        {calendar.enabled ? "Shown" : "Hidden"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#d9cfaa] bg-white/45 px-4 py-8 text-center">
                  <p className="text-sm font-bold">No calendars added yet</p>
                  <p className="mt-1 text-xs text-[#777158]">
                    Go back to connect one, or continue and add it later in
                    Settings.
                  </p>
                </div>
              )}
            </div>
          )}

          {step.id === "sleep-hours" && (
            <div className="mx-auto max-w-xl py-3 sm:py-7">
              <div className="rounded-3xl border border-[#d8dfbd] bg-[#f2f6e8] p-5 sm:p-7">
                <p className="text-sm font-bold text-[#566641]">
                  What does a usual night look like?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#777158]">
                  Overnight ranges are welcome—for example, 11:00 PM to 7:00 AM.
                  These times stay editable in Settings.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <label className="text-xs font-bold text-[#62684b]">
                    Bedtime
                    <input
                      type="time"
                      value={sleepHoursStart}
                      onChange={(event) =>
                        setSleepHoursStart(event.target.value)
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-[#cfd8b2] bg-[#fffdf7] px-3 text-sm outline-none focus:border-[#91a96d]"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#62684b]">
                    Wake-up
                    <input
                      type="time"
                      value={sleepHoursEnd}
                      onChange={(event) => setSleepHoursEnd(event.target.value)}
                      className="mt-2 h-12 w-full rounded-xl border border-[#cfd8b2] bg-[#fffdf7] px-3 text-sm outline-none focus:border-[#91a96d]"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          <StepQuote stepIndex={stepIndex} steps={steps} />
          {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
        </div>

        <footer className="flex flex-none items-center justify-between gap-3 border-t border-[#e9e1c2] bg-[#fffdf7] px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => void moveTo(stepIndex - 1)}
            disabled={stepIndex === 0 || tourKind === "sleep"}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#716b50] hover:bg-[#f2ecd7] disabled:invisible"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <span className="hidden text-[11px] text-[#847e63] sm:block">
            {step.id === "connect"
              ? "Connect everything you want, then continue."
              : step.id === "choose-calendars"
                ? "You can change these later."
                : step.id === "sleep-hours"
                  ? "You can change these in Settings anytime."
                  : "About two minutes"}
          </span>
          <button
            type="button"
            onClick={() => {
              if (isLastStep) {
                void completeTour();
              } else if (step.id === "sleep-hours") {
                setIsSaving(true);
                setError(null);
                void saveSleepHours()
                  .then(() => moveTo(stepIndex + 1))
                  .catch((caught) =>
                    setError(
                      caught instanceof Error
                        ? caught.message
                        : "Unable to save your sleep hours"
                    )
                  )
                  .finally(() => setIsSaving(false));
              } else {
                void moveTo(stepIndex + 1);
              }
            }}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#607249] px-4 py-2 text-xs font-bold text-white shadow-[0_3px_0_#465536] hover:bg-[#53643e]"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isLastStep ? (
              <Check className="h-3.5 w-3.5" />
            ) : null}
            {isLastStep
              ? "Save & finish"
              : step.id === "welcome"
                ? "Let's go"
                : "Next"}
            {!isLastStep && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </footer>
      </section>
    </div>
  );
}
