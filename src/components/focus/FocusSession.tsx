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
  startingPhaseForSetup,
  suggestFocusRhythm,
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
  protectedSeconds?: number | null;
  endsAt: number | null;
  isRunning: boolean;
  checklist: Record<string, boolean>;
  subtaskPlan: string;
  focusPlan?: number[];
  currentRoundIndex?: number;
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
  onSessionActiveChange: (active: boolean) => void;
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
  onSessionActiveChange,
}: FocusSessionProps) {
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<FocusPhase>("setup-ready");
  const [setupMinutes, setSetupMinutes] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(() =>
    FOCUS_DURATIONS.some((minutes) => minutes === estimatedMinutes)
      ? estimatedMinutes!
      : 25
  );
  const [focusPlan, setFocusPlan] = useState<number[]>(() => [
    FOCUS_DURATIONS.some((minutes) => minutes === estimatedMinutes)
      ? estimatedMinutes!
      : 25,
  ]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [protectedSeconds, setProtectedSeconds] = useState<number | null>(null);
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

  useEffect(() => {
    if (!hydrated) return;
    onSessionActiveChange(["setup", "focus", "break"].includes(phase));
    return () => onSessionActiveChange(false);
  }, [hydrated, onSessionActiveChange, phase]);

  const selectedPet = useMemo(
    () => FOCUS_PETS.find((pet) => pet.id === petId) || FOCUS_PETS[0],
    [petId]
  );
  const usesCustomPet = petId === "custom" && customPetImage;
  const suggestedRhythm = useMemo(
    () => suggestFocusRhythm(estimatedMinutes),
    [estimatedMinutes]
  );
  const hasNextPlannedRound = currentRoundIndex < focusPlan.length - 1;
  const nextPlannedFocusMinutes = hasNextPlannedRound
    ? focusPlan[currentRoundIndex + 1]
    : null;
  const isSuggestedRhythmSelected = Boolean(
    suggestedRhythm &&
      setupMinutes === suggestedRhythm.setupMinutes &&
      breakMinutes === suggestedRhythm.breakMinutes &&
      focusPlan.length === suggestedRhythm.focusMinutes.length &&
      focusPlan.every(
        (minutes, index) => minutes === suggestedRhythm.focusMinutes[index]
      )
  );

  const finishQualifiedFocusRound = useCallback((finishedMinutes: number) => {
    setIsRunning(false);
    setEndsAt(null);
    setRemainingSeconds(0);
    setProtectedSeconds((current) => (current ?? 0) + finishedMinutes * 60);
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
          const savedFocusMinutes = saved.focusMinutes || 25;
          const savedFocusPlan = saved.focusPlan?.filter(
            (minutes) => Number.isFinite(minutes) && minutes > 0
          );
          const restoredFocusPlan = savedFocusPlan?.length
            ? savedFocusPlan
            : [savedFocusMinutes];
          const restoredRoundIndex = Math.min(
            Math.max(0, saved.currentRoundIndex ?? 0),
            restoredFocusPlan.length - 1
          );
          setPhase(saved.phase);
          setSetupMinutes(saved.setupMinutes ?? 0);
          setFocusMinutes(restoredFocusPlan[restoredRoundIndex]);
          setFocusPlan(restoredFocusPlan);
          setCurrentRoundIndex(restoredRoundIndex);
          setBreakMinutes(saved.breakMinutes || 5);
          setChecklist(saved.checklist || {});
          setSubtaskPlan(saved.subtaskPlan || "");
          setProtectedSeconds(saved.protectedSeconds ?? null);
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
                const focusSeconds = restoredFocusPlan[restoredRoundIndex] * 60;
                setProtectedSeconds(
                  (saved.protectedSeconds ?? 0) + (saved.setupMinutes ?? 0) * 60
                );
                setPhase("focus");
                setRemainingSeconds(focusSeconds);
                setEndsAt(Date.now() + focusSeconds * 1000);
                setIsRunning(true);
              } else if (saved.phase === "focus") {
                void accountSunDrops.then(() =>
                  finishQualifiedFocusRound(
                    restoredFocusPlan[restoredRoundIndex]
                  )
                );
              } else if (saved.phase === "break") {
                const hasRestoredNextRound =
                  restoredRoundIndex < restoredFocusPlan.length - 1;
                if (hasRestoredNextRound) {
                  const nextRoundIndex = restoredRoundIndex + 1;
                  setCurrentRoundIndex(nextRoundIndex);
                  setFocusMinutes(restoredFocusPlan[nextRoundIndex]);
                  setPhase("focus-ready");
                } else {
                  setPhase("complete");
                }
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
      protectedSeconds,
      endsAt,
      isRunning,
      checklist,
      subtaskPlan,
      focusPlan,
      currentRoundIndex,
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
    currentRoundIndex,
    focusMinutes,
    focusPlan,
    hydrated,
    isRunning,
    phase,
    remainingSeconds,
    protectedSeconds,
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

  const finishBreak = useCallback(() => {
    if (!hasNextPlannedRound || nextPlannedFocusMinutes === null) {
      setPhase("complete");
      setRemainingSeconds(0);
      return;
    }

    setCurrentRoundIndex((current) => current + 1);
    setFocusMinutes(nextPlannedFocusMinutes);
    setPhase("focus-ready");
    setRemainingSeconds(0);
    setRoundReward({ status: "idle" });
  }, [hasNextPlannedRound, nextPlannedFocusMinutes]);

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
        setProtectedSeconds((current) => (current ?? 0) + setupMinutes * 60);
        setPhase("focus");
        setRemainingSeconds(focusSeconds);
        setEndsAt(Date.now() + focusSeconds * 1000);
        setIsRunning(true);
      } else if (phase === "focus") {
        finishQualifiedFocusRound(focusMinutes);
      } else if (phase === "break") {
        finishBreak();
      } else {
        setPhase(nextPhaseAfterTimer(phase));
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
    finishBreak,
    finishQualifiedFocusRound,
    focusMinutes,
    isRunning,
    phase,
    playGentleChime,
    setupMinutes,
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
      setProtectedSeconds(
        (current) =>
          (current ?? 0) + Math.max(0, focusMinutes * 60 - remainingSeconds)
      );
      setRoundReward({ status: "not-awarded", reason: "ended-early" });
      setPhase(phaseAfterEndingEarly(phase));
    } else {
      finishBreak();
    }
  };

  const startPlannedRound = () => {
    if (phase === "setup-ready") {
      setProtectedSeconds(0);
      setCurrentRoundIndex(0);
      setFocusMinutes(focusPlan[0] ?? focusMinutes);
      startTimer(startingPhaseForSetup(setupMinutes));
      return;
    }
    startTimer("focus");
  };

  const finishSetupEarly = () => {
    setProtectedSeconds(
      (current) =>
        (current ?? 0) + Math.max(0, setupMinutes * 60 - remainingSeconds)
    );
    startTimer("focus");
  };

  const finishTaskEarly = () => {
    setProtectedSeconds(
      (current) =>
        (current ?? 0) + Math.max(0, focusMinutes * 60 - remainingSeconds)
    );
    setIsRunning(false);
    setEndsAt(null);
    setRemainingSeconds(0);
    setRoundReward({ status: "not-awarded", reason: "ended-early" });
    onCompleteTask();
  };

  const startAnotherRound = () => {
    setFocusPlan([focusMinutes]);
    setCurrentRoundIndex(0);
    setProtectedSeconds(0);
    startTimer("focus");
  };

  const startFreshSetup = () => {
    setPhase("setup-ready");
    setChecklist({});
    setSubtaskPlan("");
    setFocusPlan([focusMinutes]);
    setCurrentRoundIndex(0);
    setProtectedSeconds(null);
    setRemainingSeconds(setupMinutes * 60);
  };

  const applySuggestedRhythm = () => {
    if (!suggestedRhythm) return;
    setSetupMinutes(suggestedRhythm.setupMinutes);
    setBreakMinutes(suggestedRhythm.breakMinutes);
    setFocusPlan(suggestedRhythm.focusMinutes);
    setCurrentRoundIndex(0);
    setFocusMinutes(suggestedRhythm.focusMinutes[0]);
    setProtectedSeconds(null);
    setPhase("setup-ready");
    setRemainingSeconds(0);
    setRoundReward({ status: "idle" });
  };

  const chooseSingleFocusDuration = (minutes: number) => {
    setFocusMinutes(minutes);
    setFocusPlan([minutes]);
    setCurrentRoundIndex(0);
    setProtectedSeconds(null);
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
      <div className="sunnie-focus-hero flex items-center gap-3 p-3 sm:grid sm:grid-cols-[auto_1fr_auto] sm:gap-4 sm:p-5">
        <div
          className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white text-3xl shadow-md transition-transform duration-500 hover:rotate-2 hover:scale-105 motion-reduce:transform-none sm:h-20 sm:w-20 sm:rounded-[1.7rem] sm:border-4 sm:text-5xl"
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
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.15em] text-primary sm:block">
              Focus companion
            </p>
            <span
              key={sunDrops}
              className="hidden animate-[sunnie-sun-pop_900ms_cubic-bezier(0.2,0.75,0.25,1)] items-center gap-1 rounded-full bg-card/70 px-2 py-1 text-[10px] font-bold text-primary motion-reduce:animate-none sm:inline-flex"
            >
              <Sun className="h-3 w-3 fill-[var(--sunnie-warm-glow)] text-primary" />
              {sunDrops} sun {sunDrops === 1 ? "drop" : "drops"}
            </span>
          </div>
          <h3 className="text-base font-bold text-foreground sm:mt-1 sm:text-lg">
            {displayPetName}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-secondary-foreground sm:text-sm sm:leading-relaxed">
            {displayMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled((current) => !current)}
          aria-label={
            soundEnabled ? "Turn timer chimes off" : "Turn timer chimes on"
          }
          aria-pressed={soundEnabled}
          className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-xl bg-card/65 p-2 text-xs font-semibold text-secondary-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
          title={soundEnabled ? "Timer chimes are on" : "Timer chimes are off"}
        >
          {soundEnabled ? (
            <Bell className="h-3.5 w-3.5" />
          ) : (
            <BellOff className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">
            Chime {soundEnabled ? "on" : "off"}
          </span>
        </button>
      </div>

      {(taskEnergy ||
        (taskPriority && taskPriority !== "none") ||
        estimatedMinutes ||
        taskDescription) && (
        <div className="border-b border-border bg-card px-4 py-3 sm:px-5">
          {(taskEnergy ||
            (taskPriority && taskPriority !== "none") ||
            estimatedMinutes) && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-secondary-foreground">
              {taskEnergy && (
                <span className="rounded-full bg-muted px-2.5 py-1">
                  Energy: {friendlyValue(taskEnergy)}
                </span>
              )}
              {taskPriority && taskPriority !== "none" && (
                <span className="rounded-full bg-accent px-2.5 py-1">
                  Urgency: {friendlyValue(taskPriority)}
                </span>
              )}
              {estimatedMinutes && (
                <span className="rounded-full bg-secondary px-2.5 py-1">
                  Estimate: {estimatedMinutes} min
                </span>
              )}
            </div>
          )}
          {taskDescription && (
            <details className="mt-3 rounded-2xl border border-border bg-background/70 px-3 py-2.5">
              <summary className="cursor-pointer text-xs font-semibold text-secondary-foreground">
                Task note
              </summary>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-secondary-foreground">
                {taskDescription}
              </p>
            </details>
          )}
        </div>
      )}

      <div className="p-3 sm:p-5">
        {(phase === "setup-ready" || phase === "focus-ready") && (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  {phase === "focus-ready"
                    ? `Round ${currentRoundIndex + 1} of ${focusPlan.length}`
                    : "Ready when you are"}
                </p>
                <h3 className="mt-1 text-base font-bold text-foreground sm:text-lg">
                  {phase === "focus-ready"
                    ? "Ready for the next focus round?"
                    : setupMinutes === 0
                      ? "Start focusing whenever you're ready"
                      : "Setup first, then Sunnie starts focus automatically"}
                </h3>
              </div>
            </div>

            {phase === "setup-ready" &&
              suggestedRhythm &&
              suggestedRhythm.taskMinutes >= 30 && (
                <div className="mt-3 rounded-2xl border border-primary/30 bg-muted/65 p-3 text-left sm:mt-4 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                        Suggested rhythm
                      </p>
                      <p className="mt-1 text-sm font-bold text-foreground">
                        A gentle plan for this{" "}
                        {formatTaskEstimate(estimatedMinutes!)} task
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {formatMinutes(suggestedRhythm.taskMinutes)} of task
                        time · about{" "}
                        {formatMinutes(suggestedRhythm.elapsedMinutes)} on the
                        clock
                        {suggestedRhythm.focusMinutes.length > 1
                          ? " with breaks"
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={applySuggestedRhythm}
                      disabled={isSuggestedRhythmSelected}
                      className="shrink-0 rounded-xl border border-primary/35 bg-card px-3 py-2 text-xs font-bold text-primary shadow-sm disabled:cursor-default disabled:bg-primary disabled:text-primary-foreground"
                    >
                      {isSuggestedRhythmSelected
                        ? "Plan selected"
                        : "Use this plan"}
                    </button>
                  </div>
                  <RhythmSteps
                    setupMinutes={suggestedRhythm.setupMinutes}
                    focusMinutes={suggestedRhythm.focusMinutes}
                    breakMinutes={suggestedRhythm.breakMinutes}
                  />
                </div>
              )}

            <div className="mt-3 rounded-2xl border border-accent bg-accent/55 px-3 py-2.5 text-center text-xs font-bold text-accent-foreground sm:mt-4">
              <RhythmSteps
                setupMinutes={phase === "setup-ready" ? setupMinutes : 0}
                focusMinutes={focusPlan}
                breakMinutes={breakMinutes}
                currentRoundIndex={currentRoundIndex}
                showFinalBreak={focusPlan.length === 1}
                compact
              />
            </div>

            <button
              type="button"
              onClick={startPlannedRound}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-pressed)] hover:brightness-95 sm:mt-4 sm:w-auto"
            >
              {phase === "focus-ready" || setupMinutes === 0 ? (
                <Play className="h-4 w-4 fill-current" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {phase === "focus-ready"
                ? `Start round ${currentRoundIndex + 1}`
                : setupMinutes === 0
                  ? "Start focus"
                  : focusPlan.length > 1
                    ? "Start this rhythm"
                    : "Start setup, then focus"}
            </button>

            <label className="mt-4 block text-left text-xs font-bold text-secondary-foreground">
              Subtasks for this focus
              <textarea
                value={subtaskPlan}
                onChange={(event) => setSubtaskPlan(event.target.value)}
                placeholder="Write the next 2–3 concrete steps…"
                rows={3}
                className="mt-1.5 w-full resize-y rounded-2xl border border-border bg-card/75 px-3 py-2 text-sm font-normal outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/35"
              />
              <span className="mt-1.5 block font-normal text-muted-foreground">
                These steps stay with this focus session and appear beside the
                timer.
              </span>
            </label>

            <details className="mt-4 rounded-2xl border border-border bg-card/65 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-secondary-foreground">
                Adjust timer and setup
              </summary>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
                  onChange={chooseSingleFocusDuration}
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
                      aria-pressed={checked}
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
            </details>
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
            endLabel="Back to round plan"
            onPrimaryAction={finishSetupEarly}
            primaryActionLabel="Ready to start!"
            subtaskPlan={subtaskPlan}
            nextLabel={`${focusPlan.length > 1 ? `Round ${currentRoundIndex + 1} of ${focusPlan.length} · ` : "Focus starts next · "}${focusMinutes} minutes`}
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
            endLabel="End focus early"
            onPrimaryAction={finishTaskEarly}
            primaryActionLabel="I finished the task"
            subtaskPlan={subtaskPlan}
            nextLabel={
              hasNextPlannedRound
                ? `Round ${currentRoundIndex + 1} of ${focusPlan.length} · ${breakMinutes}-minute break next`
                : `Optional break after · ${breakMinutes} minutes`
            }
          />
        )}

        {phase === "break-ready" && (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent text-primary">
              <Sun className="h-7 w-7 fill-[var(--sunnie-warm-glow)]" />
            </span>
            <h3 className="mt-3 text-xl font-bold text-foreground">
              {roundReward.status === "not-awarded" &&
              roundReward.reason === "ended-early"
                ? "Focus round ended"
                : hasNextPlannedRound
                  ? `Round ${currentRoundIndex + 1} of ${focusPlan.length} complete`
                  : "Focus round complete!"}
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
                onClick={finishBreak}
                className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-secondary-foreground"
              >
                {hasNextPlannedRound ? "Skip break" : "Skip this break"}
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
            endLabel="End break"
            isBreak
            nextLabel={
              nextPlannedFocusMinutes !== null
                ? `Round ${currentRoundIndex + 2} next · ${nextPlannedFocusMinutes} minutes`
                : undefined
            }
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
              You protected {formatProtectedTime(protectedSeconds)} for{" "}
              {taskTitle}. Finish the task if it&apos;s ready, or choose what
              would help next.
            </p>
            <RoundTaskActions
              onCompleteTask={onCompleteTask}
              onEditTask={onEditTask}
              emphasizeCompletion
            />
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={startAnotherRound}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm font-semibold text-secondary-foreground"
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
                aria-pressed={petId === pet.id}
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

function RhythmSteps({
  setupMinutes,
  focusMinutes,
  breakMinutes,
  currentRoundIndex,
  showFinalBreak = false,
  compact = false,
}: {
  setupMinutes: number;
  focusMinutes: number[];
  breakMinutes: number;
  currentRoundIndex?: number;
  showFinalBreak?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        compact
          ? "w-full flex-nowrap justify-start overflow-x-auto pb-1 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden"
          : "mt-3 flex-wrap"
      )}
      aria-label="Focus rhythm"
    >
      {setupMinutes > 0 && (
        <>
          <span className="shrink-0 rounded-lg bg-card/80 px-2 py-1 text-[11px] font-semibold text-secondary-foreground">
            {setupMinutes} setup
          </span>
          <span aria-hidden="true" className="shrink-0 text-muted-foreground">
            →
          </span>
        </>
      )}
      {focusMinutes.map((minutes, index) => (
        <div key={`${index}-${minutes}`} className="contents">
          <span
            className={cn(
              "shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold",
              currentRoundIndex === index
                ? "bg-primary text-primary-foreground"
                : "bg-card/80 text-secondary-foreground"
            )}
          >
            {minutes} focus
          </span>
          {index < focusMinutes.length - 1 && (
            <>
              <span
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              >
                →
              </span>
              <span className="shrink-0 rounded-lg bg-secondary/80 px-2 py-1 text-[11px] font-semibold text-secondary-foreground">
                {breakMinutes} break
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              >
                →
              </span>
            </>
          )}
        </div>
      ))}
      {showFinalBreak && (
        <>
          <span aria-hidden="true" className="shrink-0 text-muted-foreground">
            →
          </span>
          <span className="shrink-0 rounded-lg bg-secondary/80 px-2 py-1 text-[11px] font-semibold text-secondary-foreground">
            {breakMinutes} optional break
          </span>
        </>
      )}
    </div>
  );
}

function friendlyValue(value?: string | null) {
  if (!value || value === "none") return "Not set";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const hourText = `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return remainder ? `${hourText} ${remainder} min` : hourText;
}

function formatTaskEstimate(minutes: number) {
  if (minutes < 60) return `${minutes}-minute`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}-hour ${remainder}-minute` : `${hours}-hour`;
}

function formatProtectedTime(seconds: number | null) {
  if (seconds === null) return "some time";
  if (seconds < 1) return "a brief moment";
  if (seconds < 60) return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  const minuteText = `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  return remainder
    ? `${minuteText} and ${remainder} ${remainder === 1 ? "second" : "seconds"}`
    : minuteText;
}

function RoundTaskActions({
  onCompleteTask,
  onEditTask,
  emphasizeCompletion = false,
}: {
  onCompleteTask: () => void;
  onEditTask: () => void;
  emphasizeCompletion?: boolean;
}) {
  return (
    <div className="mx-auto mt-4 grid max-w-md gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={onCompleteTask}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-[var(--shadow-pressed)]",
          emphasizeCompletion
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground"
        )}
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
            aria-pressed={value === minutes}
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
  endLabel,
  onPrimaryAction,
  primaryActionLabel,
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
  endLabel: string;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
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
        {onPrimaryAction && primaryActionLabel && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-pressed)]"
          >
            <Check className="h-4 w-4" /> {primaryActionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={isRunning ? onPause : onResume}
          disabled={!isRunning && remainingSeconds === 0}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold disabled:opacity-50",
            onPrimaryAction
              ? "border border-border bg-card text-secondary-foreground"
              : "bg-primary text-primary-foreground shadow-[var(--shadow-pressed)]"
          )}
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
          <Square className="h-3.5 w-3.5 fill-current" /> {endLabel}
        </button>
      </div>
    </div>
  );
}
