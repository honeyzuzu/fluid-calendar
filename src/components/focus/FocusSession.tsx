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
} from "lucide-react";

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
} from "@/lib/focus-session";
import { cn } from "@/lib/utils";

const PREFERENCES_KEY = "sunnie-focus-companion-v1";
const SESSION_KEY = "sunnie-focus-session-v1";
const MAX_CUSTOM_IMAGE_BYTES = 750_000;

type FocusPreferences = {
  petId: string;
  customPetImage: string | null;
  customPetName: string;
  soundEnabled: boolean;
  sunDrops: number;
};

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
};

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
  const [sunDrops, setSunDrops] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const finishingRef = useRef(false);

  const selectedPet = useMemo(
    () => FOCUS_PETS.find((pet) => pet.id === petId) || FOCUS_PETS[0],
    [petId]
  );
  const usesCustomPet = petId === "custom" && customPetImage;

  useEffect(() => {
    try {
      const storedPreferences = window.localStorage.getItem(PREFERENCES_KEY);
      const preferences = storedPreferences
        ? (JSON.parse(storedPreferences) as Partial<FocusPreferences>)
        : {};
      const savedSunDrops = preferences.sunDrops || 0;
      setPetId(preferences.petId || FOCUS_PETS[0].id);
      setCustomPetImage(preferences.customPetImage || null);
      setCustomPetName(preferences.customPetName || "My focus buddy");
      setSoundEnabled(preferences.soundEnabled ?? true);
      setSunDrops(savedSunDrops);

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
                setSunDrops(savedSunDrops + 1);
                setPhase(nextPhaseAfterTimer(saved.phase));
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
  }, [taskId]);

  useEffect(() => {
    if (!hydrated) return;
    const preferences: FocusPreferences = {
      petId,
      customPetImage,
      customPetName,
      soundEnabled,
      sunDrops,
    };
    try {
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      // Focus mode remains usable if local storage is full or unavailable.
    }
  }, [customPetImage, customPetName, hydrated, petId, soundEnabled, sunDrops]);

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
    setupMinutes,
    subtaskPlan,
    taskId,
  ]);

  const prepareAudio = useCallback(() => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume();
    }
  }, [soundEnabled]);

  const playGentleChime = useCallback(() => {
    if (!soundEnabled) return;
    prepareAudio();
    const context = audioContextRef.current;
    if (!context) return;

    const start = context.currentTime + 0.03;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start + index * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.12, start + index * 0.16 + 0.04);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + index * 0.16 + 0.65
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start + index * 0.16);
      oscillator.stop(start + index * 0.16 + 0.7);
    });
  }, [prepareAudio, soundEnabled]);

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
      playGentleChime();
      if (phase === "setup") {
        const focusSeconds = focusMinutes * 60;
        setPhase("focus");
        setRemainingSeconds(focusSeconds);
        setEndsAt(Date.now() + focusSeconds * 1000);
        setIsRunning(true);
      } else {
        if (phase === "focus") setSunDrops((current) => current + 1);
        setPhase(nextPhaseAfterTimer(phase));
      }
      window.setTimeout(() => {
        finishingRef.current = false;
      }, 250);
    };

    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [endsAt, focusMinutes, isRunning, phase, playGentleChime]);

  useEffect(() => {
    if (!isRunning) return;
    const previousTitle = document.title;
    document.title = `${formatFocusTime(remainingSeconds)} · ${phase === "break" ? "Break" : "Focus"} · Sunnie`;
    return () => {
      document.title = previousTitle;
    };
  }, [isRunning, phase, remainingSeconds]);

  const startTimer = (timerPhase: "setup" | "focus" | "break") => {
    prepareAudio();
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
  };

  const pauseTimer = () => {
    if (endsAt) {
      setRemainingSeconds(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }
    setEndsAt(null);
    setIsRunning(false);
  };

  const resumeTimer = () => {
    prepareAudio();
    setEndsAt(Date.now() + remainingSeconds * 1000);
    setIsRunning(true);
  };

  const endCurrentPhase = () => {
    setIsRunning(false);
    setEndsAt(null);
    if (phase === "setup") {
      startTimer("focus");
      return;
    }
    setRemainingSeconds(0);
    setPhase(phase === "focus" ? "break-ready" : nextPhaseAfterTimer(phase));
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
    <section className="mb-5 overflow-hidden rounded-3xl border border-[#dfdab8] bg-[#fffaf0] shadow-[0_7px_0_#e7dfbf]">
      <div className="grid gap-4 bg-[linear-gradient(135deg,#fff1bd_0%,#eff4df_100%)] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5">
        <div
          className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-[1.7rem] border-4 border-white text-5xl shadow-md"
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
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a6762a]">
              Focus companion
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold text-[#8c6a27]">
              <Sun className="h-3 w-3 fill-[#f4c85b] text-[#d29a30]" />
              {sunDrops} sun {sunDrops === 1 ? "drop" : "drops"}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-[#4f583d]">
            {displayPetName}
          </h3>
          <p className="mt-0.5 text-sm leading-relaxed text-[#6e7058]">
            {displayMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled((current) => !current)}
          className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-white/65 px-3 py-2 text-xs font-semibold text-[#68684f] hover:bg-white"
          title={
            soundEnabled ? "Completion chime is on" : "Completion chime is off"
          }
        >
          {soundEnabled ? (
            <Bell className="h-3.5 w-3.5" />
          ) : (
            <BellOff className="h-3.5 w-3.5" />
          )}
          Chime {soundEnabled ? "on" : "off"}
        </button>
      </div>

      <div className="border-b border-[#e7e0c5] bg-[#fffdf7] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#68634d]">
          <span className="rounded-full bg-[#eef3df] px-2.5 py-1">
            Energy: {friendlyValue(taskEnergy)}
          </span>
          <span className="rounded-full bg-[#fff0c8] px-2.5 py-1">
            Urgency: {friendlyValue(taskPriority)}
          </span>
          {estimatedMinutes && (
            <span className="rounded-full bg-[#eee8f6] px-2.5 py-1">
              Estimate: {estimatedMinutes} min
            </span>
          )}
        </div>
        {taskDescription && (
          <div className="mt-3 rounded-2xl border border-[#e5dfc7] bg-white/70 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9a8b66]">
              Task note
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#66634f]">
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
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b17b2b]">
                  Plan your whole round
                </p>
                <h3 className="mt-1 text-lg font-bold text-[#4e533e]">
                  Setup first, then Sunnie starts focus automatically
                </h3>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#ead9a9] bg-[#fff4cf] px-3 py-2.5 text-center text-xs font-bold text-[#755c2c]">
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
                        ? "border-[#bacc99] bg-[#eff4e2] text-[#586447]"
                        : "border-[#e4dec5] bg-white/70 text-[#777158]"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                        checked
                          ? "border-[#8ea76b] bg-[#9fb878] text-white"
                          : "border-[#cfc8aa]"
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-3 block text-xs font-bold text-[#66634d]">
              Tiny subtask outline
              <textarea
                value={subtaskPlan}
                onChange={(event) => setSubtaskPlan(event.target.value)}
                placeholder="What are the next 2–3 concrete steps?"
                rows={2}
                className="mt-1.5 w-full resize-none rounded-2xl border border-[#ded8bd] bg-white/75 px-3 py-2 text-sm font-normal outline-none placeholder:text-[#aaa58d] focus:border-[#a9bb82]"
              />
            </label>

            <button
              type="button"
              onClick={() => startTimer("setup")}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#607249] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_#465536] hover:bg-[#53643e] sm:w-auto"
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
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fff0b8] text-[#c88a25]">
              <Sun className="h-7 w-7 fill-[#f4c85b]" />
            </span>
            <h3 className="mt-3 text-xl font-bold text-[#4e533e]">
              Focus round complete!
            </h3>
            <p className="mt-1 text-sm text-[#747057]">
              You earned a sun drop. If the task is done, finish it here; if
              your plan changed, update it before the next round.
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
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#708654] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_#51663b]"
              >
                <Coffee className="h-4 w-4" /> Start {breakMinutes}-minute break
              </button>
              <button
                type="button"
                onClick={() => setPhase("complete")}
                className="rounded-2xl border border-[#dad3b7] px-4 py-3 text-sm font-semibold text-[#716b50]"
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
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e8f0d6] text-[#607249]">
              <Check className="h-7 w-7" />
            </span>
            <h3 className="mt-3 text-xl font-bold text-[#4e533e]">
              Nice work protecting that time
            </h3>
            <p className="mt-1 text-sm text-[#747057]">
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
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#607249] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_#465536]"
              >
                <Play className="h-4 w-4 fill-current" /> Another focus round
              </button>
              <button
                type="button"
                onClick={startFreshSetup}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dad3b7] px-4 py-3 text-sm font-semibold text-[#716b50]"
              >
                <RotateCcw className="h-4 w-4" /> New setup
              </button>
            </div>
          </div>
        )}

        <details className="group mt-5 border-t border-[#e7e0c5] pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl text-xs font-bold text-[#716b50]">
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
                    ? "border-[#9fb878] bg-[#eff4e2] shadow-sm"
                    : "border-[#e3ddc4] bg-white/60 hover:bg-white"
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
                  ? "border-[#9fb878] bg-[#eff4e2] shadow-sm"
                  : "border-[#e3ddc4] bg-white/60 hover:bg-white"
              )}
            >
              <ImagePlus className="mx-auto h-6 w-6 text-[#8b8364]" />
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
            <label className="mt-3 block text-xs font-semibold text-[#6f6a52]">
              Buddy name
              <input
                value={customPetName}
                onChange={(event) => setCustomPetName(event.target.value)}
                maxLength={40}
                className="mt-1 w-full rounded-xl border border-[#ddd6ba] bg-white/80 px-3 py-2 text-sm outline-none focus:border-[#a9bb82]"
              />
            </label>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-[#8a846b]">
            Custom photos stay in this browser and are never uploaded to Sunnie.
            Maximum size: 750 KB.
          </p>
          {imageError && (
            <p className="mt-2 text-xs text-red-700">{imageError}</p>
          )}
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
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f4c85b] px-4 py-3 text-sm font-bold text-[#56431b] shadow-[0_3px_0_#d6a43e]"
      >
        <Check className="h-4 w-4" /> Complete task
      </button>
      <button
        type="button"
        onClick={onEditTask}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dad3b7] bg-white/70 px-4 py-3 text-sm font-semibold text-[#716b50]"
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
      <p className="mb-2 text-xs font-bold text-[#716b50]">{label}</p>
      <div className={cn("flex flex-wrap gap-2", centered && "justify-center")}>
        {values.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => onChange(minutes)}
            className={cn(
              "rounded-xl border px-3 py-2 text-xs font-bold transition",
              value === minutes
                ? "border-[#9fb878] bg-[#eff4e2] text-[#566344] shadow-sm"
                : "border-[#ded8bd] bg-white/70 text-[#777158]"
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
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b17b2b]">
        {isBreak ? "Break timer" : "Gentle timer"}
      </p>
      <h3 className="mx-auto mt-1 max-w-lg text-base font-bold text-[#4e533e]">
        {phaseLabel}
      </h3>
      {nextLabel && (
        <p className="mt-1 text-xs font-semibold text-[#9a762f]">{nextLabel}</p>
      )}
      {subtaskPlan?.trim() && (
        <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-[#e2dbc0] bg-white/70 px-4 py-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#998b68]">
            Your focus steps
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#605f4d]">
            {subtaskPlan}
          </p>
        </div>
      )}
      <div
        className="mx-auto mt-4 grid h-40 w-40 place-items-center rounded-full p-2 shadow-inner"
        style={{
          background: `conic-gradient(${isBreak ? "#9fbc80" : "#e0ad43"} ${progress * 360}deg, #ece7d1 0deg)`,
        }}
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-[#fffdf7]">
          <span className="font-mono text-4xl font-bold tracking-tight text-[#4e533e]">
            {formatFocusTime(remainingSeconds)}
          </span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={isRunning ? onPause : onResume}
          disabled={!isRunning && remainingSeconds === 0}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#607249] px-4 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_#465536] disabled:opacity-50"
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
          className="inline-flex items-center gap-2 rounded-2xl border border-[#dad3b7] px-4 py-2.5 text-sm font-semibold text-[#716b50]"
        >
          <Square className="h-3.5 w-3.5 fill-current" /> End early
        </button>
      </div>
    </div>
  );
}
