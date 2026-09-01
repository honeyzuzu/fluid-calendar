export type FocusPhase =
  | "setup-ready"
  | "setup"
  | "focus-ready"
  | "focus"
  | "break-ready"
  | "break"
  | "complete";

export type FocusPet = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  encouragement: string;
};

export const FOCUS_PETS: FocusPet[] = [
  {
    id: "miso-cat",
    name: "Miso",
    emoji: "🐱",
    color: "#f7d39a",
    encouragement: "One cozy step at a time.",
  },
  {
    id: "pippin-dog",
    name: "Pippin",
    emoji: "🐶",
    color: "#efc19f",
    encouragement: "I saved your focus spot!",
  },
  {
    id: "clover-bunny",
    name: "Clover",
    emoji: "🐰",
    color: "#efd5df",
    encouragement: "Little hops still move us forward.",
  },
  {
    id: "sprout-frog",
    name: "Sprout",
    emoji: "🐸",
    color: "#c9dfa9",
    encouragement: "Let’s make a tiny bit of progress.",
  },
  {
    id: "peep-bird",
    name: "Peep",
    emoji: "🐥",
    color: "#f7e287",
    encouragement: "I’m cheering quietly beside you.",
  },
  {
    id: "maple-fox",
    name: "Maple",
    emoji: "🦊",
    color: "#efb382",
    encouragement: "We only need the next clear step.",
  },
];

export const SETUP_DURATIONS = [5, 10] as const;
export const FOCUS_DURATIONS = [15, 25, 45, 60] as const;
export const BREAK_DURATIONS = [5, 10, 15] as const;

export const SETUP_CHECKLIST = [
  { id: "drink", label: "Bring a drink or snack" },
  { id: "space", label: "Set up a comfortable space" },
  { id: "steps", label: "Outline the next few subtasks" },
  { id: "distractions", label: "Silence or move distractions" },
] as const;

export function formatFocusTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function nextPhaseAfterTimer(phase: FocusPhase): FocusPhase {
  if (phase === "setup") return "focus";
  if (phase === "focus") return "break-ready";
  if (phase === "break") return "complete";
  return phase;
}

export function petMessage(
  phase: FocusPhase,
  pet: FocusPet,
  isPaused: boolean
) {
  if (isPaused) return `${pet.name} is holding your spot until you’re ready.`;
  switch (phase) {
    case "setup-ready":
      return `${pet.name} will help you settle in before the timer begins.`;
    case "setup":
      return `${pet.name} is getting the focus nest ready with you.`;
    case "focus-ready":
      return `${pet.name} is ready when you are. Pick a comfortable focus length.`;
    case "focus":
      return pet.encouragement;
    case "break-ready":
      return `${pet.name} saved a sun drop for you. Time to breathe.`;
    case "break":
      return `${pet.name} says breaks are part of good work, too.`;
    case "complete":
      return `${pet.name} is proud of the time you protected.`;
  }
}
