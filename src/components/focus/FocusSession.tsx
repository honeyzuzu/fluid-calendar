"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Image from "next/image";

import {
  Bell,
  BellOff,
  Check,
  ChevronDown,
  Coffee,
  ImagePlus,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Sun,
  Volume2,
} from "lucide-react";

import {
  FOCUS_PREFERENCES_KEY,
  FOCUS_REWARD_EVENT,
  FocusRewardDetail,
  FocusRewardResult,
  awardSunDrops,
  loadSunDrops,
} from "@/lib/focus-rewards";
import {
  BREAK_DURATIONS,
  FOCUS_DURATIONS,
  FOCUS_PETS,
  FocusPhase,
  SETUP_CHECKLIST,
  SETUP_DURATIONS,
  formatFocusTime,
  nextPhaseAfterTimer,
  petMessage,
  phaseAfterEndingEarly,
} from "@/lib/focus-session";
import { cn } from "@/lib/utils";

const SESSION_KEY = "sunnie-focus-session-v1";
const MAX_CUSTOM_IMAGE_BYTES = 750_000;

type FocusPreferences = {
  petId: string;
  customPetImage: string | null;
  customPetName: string;
  soundEnabled: boolean;
  chimeId: ChimeId;
  sunDrops: number;
};

type ChimeId = "sunrise" | "garden" | "cozy";

const CHIME_OPTIONS: Array<{
  id: ChimeId;
  name: string;
  description: string;
  wave: OscillatorType;
  notes: Array<{ frequency: number; offset: number; duration: number }>;
}> = [
  {
    id: "sunrise",
    name: "Soft sunrise",
    description: "A warm three-note lift",
    wave: "sine",
    notes: [
      { frequency: 523.25, offset: 0, duration: 0.72 },
      { frequency: 659.25, offset: 0.17, duration: 0.72 },
      { frequency: 783.99, offset: 0.34, duration: 0.82 },
    ],
  },
  {
    id: "garden",
    name: "Garden bells",
    description: "Two light, airy bells",
    wave: "sine",
    notes: [
      { frequency: 880, offset: 0, duration: 0.9 },
      { frequency: 1174.66, offset: 0.22, duration: 1.05 },
    ],
  },
  {
    id: "cozy",
    name: "Cozy wooden",
    description: "A lower, mellow finish",
    wave: "triangle",
    notes: [
      { frequency: 392, offset: 0, duration: 0.58 },
      { frequency: 493.88, offset: 0.2, duration: 0.62 },
      { frequency: 587.33, offset: 0.4, duration: 0.78 },
    ],
  },
];

type PersistedFocusState = {
  taskId: string;
  phase: FocusPhase;
  setupMinutes: number;
  focusMinutes: number;
  breakMinutes: number;
  remainingSeconds: number;
  endsAt: number | null;
  isRunning: boolean;
  checklist: Record<string, boolean>;
  subtaskPlan: string;
  roundReward: RoundReward;
};

type RoundReward =
  | { status: "idle" }
  | { status: "saving" }
  | {
      status: "awarded";
      balance: number;
      savedLocally: boolean;
    }
  | { status: "not-awarded"; reason: "ended-early" | "save-failed" };

interface FocusSessionProps {
  taskId: string;
  taskTitle: string;
  taskDescription?: string | null;
  taskEnergy?: string | null;
  taskPriority?: string | null;
  estimatedMinutes?: number | null;
  onCompleteTask: () => void;
  onEditTask: () => void;
}

export function FocusSession({
  taskId,
  taskTitle,
  taskDescription,
  taskEnergy,
  taskPriority,
  estimatedMinutes,
  onCompleteTask,
  onEditTask,
}: FocusSessionProps) {
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<FocusPhase>("setup-ready");
  const [setupMinutes, setSetupMinutes] = useState(5);
  const [focusMinutes, setFocusMinutes] = useState(() =>
    FOCUS_DURATIONS.some((minutes) => minutes === estimatedMinutes)
      ? estimatedMinutes!
      : 25
  );
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [remainingSeconds, setRemainingSeconds] = useState(5 * 60);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [subtaskPlan, setSubtaskPlan] = useState("");
  const [petId, setPetId] = useState(FOCUS_PETS[0].id);
  const [customPetImage, setCustomPetImage] = useState<string | null>(null);
  const [customPetName, setCustomPetName] = useState("My focus buddy");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [chimeId, setChimeId] = useState<ChimeId>("sunrise");
  const [sunDrops, setSunDrops] = useState(0);
  const [roundReward, setRoundReward] = useState<RoundReward>({
    status: "idle",
  });
  const [imageError, setImageError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const finishingRef = useRef(false);

  const selectedPet = useMemo(
    () => FOCUS_PETS.find((pet) => pet.id === petId) || FOCUS_PETS[0],
    [petId]
  );
  const usesCustomPet = petId === "custom" && customPetImage;

  const finishQualifiedFocusRound = useCallback(() => {
    setIsRunning(false);
    setEndsAt(null);
    setRemainingSeconds(0);
    setPhase("break-ready");
    setRoundReward({ status: "saving" });

    void awardSunDrops(1)
      .then((result: FocusRewardResult | null) => {
        if (!result) {
          setRoundReward({ status: "not-awarded", reason: "save-failed" });
          return;
        }
        setRoundReward({
          status: "awarded",
          balance: result.balance,
          savedLocally: result.reason === "saved-locally",
        });
      })
      .catch(() => {
        setRoundReward({ status: "not-awarded", reason: "save-failed" });
      });
  }, []);

  useEffect(() => {
    try {
      const storedPreferences = window.localStorage.getItem(
        FOCUS_PREFERENCES_KEY
      );
      const preferences = storedPreferences
        ? (JSON.parse(storedPreferences) as Partial<FocusPreferences>)
        : {};
      const savedSunDrops = preferences.sunDrops || 0;
      setPetId(preferences.petId || FOCUS_PETS[0].id);
      setCustomPetImage(preferences.customPetImage || null);
      setCustomPetName(preferences.customPetName || "My focus buddy");
      setSoundEnabled(preferences.soundEnabled ?? true);
      setChimeId(
        CHIME_OPTIONS.some((option) => option.id === preferences.chimeId)
          ? preferences.chimeId!
          : "sunrise"
      );
      setSunDrops(savedSunDrops);
      const accountSunDrops = loadSunDrops(savedSunDrops).then((total) => {
        if (total !== null) setSunDrops(total);
      });

      const storedSession = window.localStorage.getItem(SESSION_KEY);
      if (storedSession) {
        const saved = JSON.parse(storedSession) as Partial<PersistedFocusState>;
        if (saved.taskId === taskId && saved.phase) {
          setPhase(saved.phase);
          setSetupMinutes(saved.setupMinutes || 5);
          setFocusMinutes(saved.focusMinutes || 25);
          setBreakMinutes(saved.breakMinutes || 5);
          setChecklist(saved.checklist || {});
          setSubtaskPlan(saved.subtaskPlan || "");
          setRoundReward(saved.roundReward || { status: "idle" });
          if (saved.isRunning && saved.endsAt) {
            const restored = Math.max(
              0,
              Math.ceil((saved.endsAt - Date.now()) / 1000)
            );
            setRemainingSeconds(restored);
            setEndsAt(saved.endsAt);
            setIsRunning(restored > 0);
            if (restored === 0) {
              if (saved.phase === "setup") {
                const focusSeconds = (saved.focusMinutes || 25) * 60;
                setPhase("focus");
                setRemainingSeconds(focusSeconds);
                setEndsAt(Date.now() + focusSeconds * 1000);
                setIsRunning(true);
              } else if (saved.phase === "focus") {
                void accountSunDrops.then(finishQualifiedFocusRound);
              } else {
                setPhase(nextPhaseAfterTimer(saved.phase));
              }
            }
          } else {
            setRemainingSeconds(saved.remainingSeconds || 0);
            setEndsAt(null);
            setIsRunning(false);
          }
        }
      }
    } catch {
      // A damaged local preference should never block focus mode.
    } finally {
      setHydrated(true);
    }
  }, [finishQualifiedFocusRound, taskId]);

  useEffect(() => {
    const handleReward = (event: Event) => {
      const detail = (event as CustomEvent<FocusRewardDetail>).detail;
      if (detail && Number.isFinite(detail.sunDrops)) {
        setSunDrops(detail.sunDrops);
      }
    };

    window.addEventListener(FOCUS_REWARD_EVENT, handleReward);
    const refreshRewards = () => void loadSunDrops();
    window.addEventListener("focus", refreshRewards);
    return () => {
      window.removeEventListener(FOCUS_REWARD_EVENT, handleReward);
      window.removeEventListener("focus", refreshRewards);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const preferences: FocusPreferences = {
      petId,
      customPetImage,
      customPetName,
      soundEnabled,
      chimeId,
      sunDrops,
    };
    try {
      window.localStorage.setItem(
        FOCUS_PREFERENCES_KEY,
        JSON.stringify(preferences)
      );
    } catch {
      // Focus mode remains usable if local storage is full or unavailable.
    }
  }, [
    chimeId,
    customPetImage,
    customPetName,
    hydrated,
    petId,
    soundEnabled,
    sunDrops,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    const state: PersistedFocusState = {
      taskId,
      phase,
      setupMinutes,
      focusMinutes,
      breakMinutes,
      remainingSeconds,
      endsAt,
      isRunning,
      checklist,
      subtaskPlan,
      roundReward,
    };
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } catch {
      // A timer may continue in memory even if persistence is unavailable.
    }
  }, [
    breakMinutes,
    checklist,
    endsAt,
    focusMinutes,
    hydrated,
    isRunning,
    phase,
    remainingSeconds,
    roundReward,
    setupMinutes,
    subtaskPlan,
    taskId,
  ]);

  const prepareAudio = useCallback(
    (force = false) => {
      if (!soundEnabled && !force) return null;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      return audioContextRef.current;
    },
    [soundEnabled]
  );

  const playGentleChime = useCallback(
    async (previewId?: ChimeId) => {
      const isPreview = Boolean(previewId);
      if (!soundEnabled && !isPreview) return;
      const context = prepareAudio(isPreview);
      if (!context) return;

      if (context.state === "suspended") {
        await context.resume();
      }

      const selectedChime =
        CHIME_OPTIONS.find((option) => option.id === (previewId || chimeId)) ||
        CHIME_OPTIONS[0];
      const start = context.currentTime + 0.03;

      selectedChime.notes.forEach(({ frequency, offset, duration }) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = selectedChime.wave;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.16, start + offset + 0.035);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          start + offset + duration
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start + offset);
        oscillator.stop(start + offset + duration + 0.05);
      });
    },
    [chimeId, prepareAudio, soundEnabled]
  );

  useEffect(() => {
    if (!isRunning || !endsAt) return;

    const tick = () => {
      const nextRemaining = Math.max(
        0,
        Math.ceil((endsAt - Date.now()) / 1000)
      );
      setRemainingSeconds(nextRemaining);
      if (nextRemaining > 0 || finishingRef.current) return;

      finishingRef.current = true;
      setIsRunning(false);
      setEndsAt(null);
      void playGentleChime();
      if (phase === "setup") {
        const focusSeconds = focusMinutes * 60;
        setPhase("focus");
        setRemainingSeconds(focusSeconds);
        setEndsAt(Date.now() + focusSeconds * 1000);
        setIsRunning(true);
      } else {
        if (phase === "focus") {
          finishQualifiedFocusRound();
        } else {
          setPhase(nextPhaseAfterTimer(phase));
        }
      }
      window.setTimeout(() => {
        finishingRef.current = false;
      }, 250);
    };

    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [
    endsAt,
    finishQualifiedFocusRound,
    focusMinutes,
    isRunning,
    phase,
    playGentleChime,
  ]);

  useEffect(() => {
    if (!isRunning) return;
    const previousTitle = document.title;
    document.title = `${formatFocusTime(remainingSeconds)} · ${phase === "break" ? "Break" : "Focus"} · Sunnie`;
    return () => {
      document.title = previousTitle;
    };
  }, [isRunning, phase, remainingSeconds]);

  const startTimer = (timerPhase: "setup" | "focus" | "break") => {
    const context = prepareAudio();
    if (context?.state === "suspended") void context.resume();
    const minutes =
      timerPhase === "setup"
        ? setupMinutes
        : timerPhase === "focus"
          ? focusMinutes
          : breakMinutes;
    const seconds = minutes * 60;
    setPhase(timerPhase);
    setRemainingSeconds(seconds);
    setEndsAt(Date.now() + seconds * 1000);
    setIsRunning(true);
    if (timerPhase === "focus") setRoundReward({ status: "idle" });
  };

  const pauseTimer = () => {
    if (endsAt) {
      setRemainingSeconds(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }
    setEndsAt(null);
    setIsRunning(false);
  };

  const resumeTimer = () => {
    const context = prepareAudio();
    if (context?.state === "suspended") void context.resume();
    setEndsAt(Date.now() + remainingSeconds * 1000);
    setIsRunning(true);
  };

  const endCurrentPhase = () => {
    setIsRunning(false);
    setEndsAt(null);
    if (phase === "setup") {
      setPhase(phaseAfterEndingEarly(phase));
      setRemainingSeconds(setupMinutes * 60);
      return;
    }
    setRemainingSeconds(0);
    if (phase === "focus") {
      setRoundReward({ status: "not-awarded", reason: "ended-early" });
      setPhase(phaseAfterEndingEarly(phase));
    } else {
      setPhase(phaseAfterEndingEarly(phase));
    }
  };

  const startAnotherRound = () => {
    startTimer("focus");
  };

  const startFreshSetup = () => {
    setPhase("setup-ready");
    setChecklist({});
    setSubtaskPlan("");
    setRemainingSeconds(setupMinutes * 60);
  };

  const handleCustomImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Choose an image file for your focus buddy.");
      return;
    }
    if (file.size > MAX_CUSTOM_IMAGE_BYTES) {
      setImageError("Keep the image under 750 KB so it fits in this browser.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setCustomPetImage(reader.result);
      setPetId("custom");
      setImageError(null);
    };
    reader.readAsDataURL(file);
  };

  const timerMinutes =
    phase === "setup"
      ? setupMinutes
      : phase === "break"
        ? breakMinutes
        : focusMinutes;
  const timerProgress = Math.min(
    1,
    Math.max(0, 1 - remainingSeconds / Math.max(1, timerMinutes * 60))
  );
  const displayPetName = usesCustomPet ? customPetName : selectedPet.name;
  const displayMessage = usesCustomPet
    ? isRunning
      ? `${customPetName} is staying with you for this round.`
      : `${customPetName} is ready whenever you are.`
    : petMessage(
        phase,
        selectedPet,
        !isRunning &&
          endsAt === null &&
          remainingSeconds > 0 &&
          ["setup", "focus", "break"].includes(phase)
      );

  return (
    <section className="mb-5 overflow-hidden rounded-3xl border border-border bg-card shadow-[0_7px_0_var(--sunnie-border)]">
      <div className="sunnie-focus-hero grid gap-4 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5">
        <div
          className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-[1.7rem] border-4 border-white text-5xl shadow-md transition-transform duration-500 hover:rotate-2 hover:scale-105 motion-reduce:transform-none"
          style={{ backgroundColor: selectedPet.color }}
        >
          {usesCustomPet ? (
            <Image
              src={customPetImage}
              alt={customPetName}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <span aria-hidden="true">{selectedPet.emoji}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
              Focus companion
            </p>
            <span
              key={sunDrops}
              className="inline-flex animate-[sunnie-sun-pop_900ms_cubic-bezier(0.2,0.75,0.25,1)] items-center gap-1 rounded-full bg-card/70 px-2 py-1 text-[10px] font-bold text-primary motion-reduce:animate-none"
            >
              <Sun className="h-3 w-3 fill-[var(--sunnie-warm-glow)] text-primary" />
              {sunDrops} sun {sunDrops === 1 ? "drop" : "drops"}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-foreground">
            {displayPetName}
          </h3>
          <p className="mt-0.5 text-sm leading-relaxed text-secondary-foreground">
            {displayMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled((current) => !current)}
          className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-card/65 px-3 py-2 text-xs font-semibold text-secondary-foreground hover:bg-card"
          title={soundEnabled ? "Timer chimes are on" : "Timer chimes are off"}
        >
          {soundEnabled ? (
            <Bell className="h-3.5 w-3.5" />
          ) : (
            <BellOff className="h-3.5 w-3.5" />
          )}
          Chime {soundEnabled ? "on" : "off"}
        </button>
      </div>

      <div className="border-b border-border bg-card px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-secondary-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1">
            Energy: {friendlyValue(taskEnergy)}
          </span>
          <span className="rounded-full bg-accent px-2.5 py-1">
            Urgency: {friendlyValue(taskPriority)}
          </span>
          {estimatedMinutes && (
            <span className="rounded-full bg-secondary px-2.5 py-1">
              Estimate: {estimatedMinutes} min
            </span>
          )}
        </div>
        {taskDescription && (
          <div className="mt-3 rounded-2xl border border-border bg-background/70 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Task note
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-secondary-foreground">
              {taskDescription}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {(phase === "setup-ready" || phase === "focus-ready") && (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  Plan your whole round
                </p>
                <h3 className="mt-1 text-lg font-bold text-foreground">
                  Setup first, then Sunnie starts focus automatically
                </h3>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-accent bg-accent/55 px-3 py-2.5 text-center text-xs font-bold text-accent-foreground">
              {setupMinutes} min setup → {focusMinutes} min focus →{" "}
              {breakMinutes} min break
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <DurationPicker
                label="Setup"
                values={SETUP_DURATIONS}
                value={setupMinutes}
                onChange={setSetupMinutes}
              />
              <DurationPicker
                label="Focus"
                values={FOCUS_DURATIONS}
                value={focusMinutes}
                onChange={setFocusMinutes}
              />
              <DurationPicker
                label="Break after"
                values={BREAK_DURATIONS}
                value={breakMinutes}
                onChange={setBreakMinutes}
              />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {SETUP_CHECKLIST.map((item) => {
                const checked = Boolean(checklist[item.id]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setChecklist((current) => ({
                        ...current,
                        [item.id]: !current[item.id],
                      }))
                    }
                    className={cn(
                      "flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left text-xs font-semibold transition",
                      checked
                        ? "border-primary/45 bg-muted text-secondary-foreground"
                        : "border-border bg-card/70 text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-3 block text-xs font-bold text-secondary-foreground">
              Tiny subtask outline
              <textarea
                value={subtaskPlan}
                onChange={(event) => setSubtaskPlan(event.target.value)}
                placeholder="What are the next 2–3 concrete steps?"
                rows={2}
                className="mt-1.5 w-full resize-none rounded-2xl border border-border bg-card/75 px-3 py-2 text-sm font-normal outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/35"
              />
            </label>

            <button
              type="button"
              onClick={() => startTimer("setup")}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-pressed)] hover:brightness-95 sm:w-auto"
            >
              <Sparkles className="h-4 w-4" /> Start setup, then focus
            </button>
          </div>
        )}

        {phase === "setup" && (
          <TimerControls
            phaseLabel={`Setting up for ${focusMinutes} minutes of focus`}
            remainingSeconds={remainingSeconds}
            progress={timerProgress}
            isRunning={isRunning}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onEnd={endCurrentPhase}
            subtaskPlan={subtaskPlan}
            nextLabel={`Focus starts next · ${focusMinutes} minutes`}
          />
        )}

        {phase === "focus" && (
          <TimerControls
            phaseLabel={`Focusing on ${taskTitle}`}
            remainingSeconds={remainingSeconds}
            progress={timerProgress}
            isRunning={isRunning}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onEnd={endCurrentPhase}
            subtaskPlan={subtaskPlan}
            nextLabel={`Break next · ${breakMinutes} minutes`}
          />
        )}

        {phase === "break-ready" && (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent text-primary">
              <Sun className="h-7 w-7 fill-[var(--sunnie-warm-glow)]" />
            </span>
            <h3 className="mt-3 text-xl font-bold text-foreground">
              Focus round complete!
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {roundReward.status === "saving" && "Saving your sun drop…"}
              {roundReward.status === "awarded" &&
                `You earned a sun drop. Your balance is ${roundReward.balance}.${
                  roundReward.savedLocally
                    ? " It is safe on this device and will sync with your account."
                    : ""
                }`}
              {roundReward.status === "not-awarded" &&
                (roundReward.reason === "ended-early"
                  ? "This round ended early, so no sun drop was added. The time you protected still counts."
                  : "Sunnie couldn't confirm a sun drop for this round. Your focus session is still safe.")}
              {roundReward.status === "idle" &&
                "Your focus round is complete. Take a breath before deciding what comes next."}
            </p>
            <RoundTaskActions
              onCompleteTask={onCompleteTask}
              onEditTask={onEditTask}
            />
            <DurationPicker
              label="Break length"
              values={BREAK_DURATIONS}
              value={breakMinutes}
              onChange={setBreakMinutes}
              centered
            />
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => startTimer("break")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-pressed)]"
              >
                <Coffee className="h-4 w-4" /> Start {breakMinutes}-minute break
              </button>
              <button
                type="button"
                onClick={() => setPhase("complete")}
                className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-secondary-foreground"
              >
                Skip this break
              </button>
            </div>
          </div>
        )}

        {phase === "break" && (
          <TimerControls
            phaseLabel="A real break — step away if you can"
            remainingSeconds={remainingSeconds}
            progress={timerProgress}
            isRunning={isRunning}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onEnd={endCurrentPhase}
            isBreak
          />
        )}

        {phase === "complete" && (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted text-primary">
              <Check className="h-7 w-7" />
            </span>
            <h3 className="mt-3 text-xl font-bold text-foreground">
              Nice work protecting that time
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Finish the task, edit what changed, or continue with another
              round.
            </p>
            <RoundTaskActions
              onCompleteTask={onCompleteTask}
              onEditTask={onEditTask}
            />
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={startAnotherRound}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-pressed)]"
              >
                <Play className="h-4 w-4 fill-current" /> Another focus round
              </button>
              <button
                type="button"
                onClick={startFreshSetup}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-secondary-foreground"
              >
                <RotateCcw className="h-4 w-4" /> New setup
              </button>
            </div>
          </div>
        )}

        <details className="group mt-5 border-t border-border pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl text-xs font-bold text-secondary-foreground">
            Choose your focus companion
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-7">
            {FOCUS_PETS.map((pet) => (
              <button
                key={pet.id}
                type="button"
                onClick={() => setPetId(pet.id)}
                className={cn(
                  "rounded-2xl border p-2 text-center transition",
                  petId === pet.id
                    ? "border-primary bg-muted shadow-sm"
                    : "border-border bg-card/60 hover:bg-card"
                )}
              >
                <span className="block text-2xl" aria-hidden="true">
                  {pet.emoji}
                </span>
                <span className="mt-1 block truncate text-[10px] font-bold">
                  {pet.name}
                </span>
              </button>
            ))}
            <label
              className={cn(
                "cursor-pointer rounded-2xl border p-2 text-center transition",
                petId === "custom"
                  ? "border-primary bg-muted shadow-sm"
                  : "border-border bg-card/60 hover:bg-card"
              )}
            >
              <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
              <span className="mt-1 block text-[10px] font-bold">My photo</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleCustomImage}
              />
            </label>
          </div>
          {usesCustomPet && (
            <label className="mt-3 block text-xs font-semibold text-secondary-foreground">
              Buddy name
              <input
                value={customPetName}
                onChange={(event) => setCustomPetName(event.target.value)}
                maxLength={40}
                className="mt-1 w-full rounded-xl border border-border bg-card/80 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/35"
              />
            </label>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            Custom photos stay in this browser and are never uploaded to Sunnie.
            Maximum size: 750 KB.
          </p>
          {imageError && (
            <p className="mt-2 text-xs text-destructive">{imageError}</p>
          )}
        </details>

        <details className="group mt-4 border-t border-border pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl text-xs font-bold text-secondary-foreground">
            Choose your timer chime
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Sunnie plays your chime when setup, focus, and break timers finish.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {CHIME_OPTIONS.map((option) => {
              const selected = chimeId === option.id;
              return (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border p-2 transition",
                    selected
                      ? "border-primary bg-muted shadow-sm"
                      : "border-border bg-card/60"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setChimeId(option.id);
                      setSoundEnabled(true);
                    }}
                    className="min-w-0 flex-1 rounded-xl px-1 py-1.5 text-left"
                    aria-pressed={selected}
                  >
                    <span className="block text-xs font-bold text-foreground">
                      {option.name}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {option.description}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void playGentleChime(option.id)}
                    aria-label={`Preview ${option.name}`}
                    title={`Hear ${option.name}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-sm transition hover:scale-105 motion-reduce:transform-none"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </details>
      </div>
    </section>
  );
}

function friendlyValue(value?: string | null) {
  if (!value || value === "none") return "Not set";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function RoundTaskActions({
  onCompleteTask,
  onEditTask,
}: {
  onCompleteTask: () => void;
  onEditTask: () => void;
}) {
  return (
    <div className="mx-auto mt-4 grid max-w-md gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={onCompleteTask}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground shadow-[var(--shadow-pressed)]"
      >
        <Check className="h-4 w-4" /> Complete task
      </button>
      <button
        type="button"
        onClick={onEditTask}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm font-semibold text-secondary-foreground"
      >
        <Pencil className="h-4 w-4" /> Edit task
      </button>
    </div>
  );
}

function DurationPicker({
  label,
  values,
  value,
  onChange,
  centered = false,
}: {
  label: string;
  values: readonly number[];
  value: number;
  onChange: (value: number) => void;
  centered?: boolean;
}) {
  return (
    <div className={cn("mt-4", centered && "text-center")}>
      <p className="mb-2 text-xs font-bold text-secondary-foreground">
        {label}
      </p>
      <div className={cn("flex flex-wrap gap-2", centered && "justify-center")}>
        {values.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => onChange(minutes)}
            className={cn(
              "rounded-xl border px-3 py-2 text-xs font-bold transition",
              value === minutes
                ? "border-primary bg-muted text-secondary-foreground shadow-sm"
                : "border-border bg-card/70 text-muted-foreground"
            )}
          >
            {minutes} min
          </button>
        ))}
      </div>
    </div>
  );
}

function TimerControls({
  phaseLabel,
  remainingSeconds,
  progress,
  isRunning,
  onPause,
  onResume,
  onEnd,
  isBreak = false,
  subtaskPlan,
  nextLabel,
}: {
  phaseLabel: string;
  remainingSeconds: number;
  progress: number;
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  isBreak?: boolean;
  subtaskPlan?: string;
  nextLabel?: string;
}) {
  return (
    <div className="py-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
        {isBreak ? "Break timer" : "Gentle timer"}
      </p>
      <h3 className="mx-auto mt-1 max-w-lg text-base font-bold text-foreground">
        {phaseLabel}
      </h3>
      {nextLabel && (
        <p className="mt-1 text-xs font-semibold text-primary">{nextLabel}</p>
      )}
      {subtaskPlan?.trim() && (
        <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-border bg-card/70 px-4 py-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Your focus steps
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-secondary-foreground">
            {subtaskPlan}
          </p>
        </div>
      )}
      <div
        className="mx-auto mt-4 grid h-40 w-40 place-items-center rounded-full p-2 shadow-inner"
        style={{
          background: `conic-gradient(${isBreak ? "var(--sunnie-status-success)" : "var(--sunnie-primary)"} ${progress * 360}deg, var(--sunnie-surface-muted) 0deg)`,
        }}
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-card">
          <span className="font-mono text-4xl font-bold tracking-tight text-foreground">
            {formatFocusTime(remainingSeconds)}
          </span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={isRunning ? onPause : onResume}
          disabled={!isRunning && remainingSeconds === 0}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-pressed)] disabled:opacity-50"
        >
          {isRunning ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
          {isRunning ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          onClick={onEnd}
          className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold text-secondary-foreground"
        >
          <Square className="h-3.5 w-3.5 fill-current" /> End early
        </button>
      </div>
    </div>
  );
}
