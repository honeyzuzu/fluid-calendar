import type {
  DailyMoodInput,
  MoodEnergy,
  MoodPhase,
  MoodValue,
} from "@/types/mood";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY = /^\d{4}-\d{2}$/;
const DAY_MS = 86_400_000;

export const MOOD_STATES = [
  { value: 1 as const, label: "Drained", plant: "bud" as const },
  { value: 2 as const, label: "Low", plant: "bud" as const },
  { value: 3 as const, label: "Steady", plant: "sprout" as const },
  { value: 4 as const, label: "Bright", plant: "flower" as const },
  { value: 5 as const, label: "Energized", plant: "bloom" as const },
] as const;

export function isMoodDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_KEY.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function parseMoodMonth(value: string | null) {
  if (!value || !MONTH_KEY.test(value)) return null;
  const start = new Date(`${value}-01T00:00:00.000Z`);
  if (
    Number.isNaN(start.getTime()) ||
    start.toISOString().slice(0, 7) !== value
  ) {
    return null;
  }
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  if ((end.getTime() - start.getTime()) / DAY_MS > 31) return null;
  return { start, end };
}

export function parseMoodInput(value: unknown): DailyMoodInput | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (
    !isMoodDateKey(body.date) ||
    (body.phase !== "rise" && body.phase !== "unwind") ||
    !(
      body.mood === null ||
      (typeof body.mood === "number" &&
        Number.isInteger(body.mood) &&
        body.mood >= 1 &&
        body.mood <= 5)
    ) ||
    !(
      body.energy === undefined ||
      body.energy === null ||
      (typeof body.energy === "number" &&
        Number.isInteger(body.energy) &&
        body.energy >= 1 &&
        body.energy <= 3)
    ) ||
    !(body.note === undefined || typeof body.note === "string")
  ) {
    return null;
  }

  return {
    date: body.date,
    phase: body.phase as MoodPhase,
    mood: body.mood as MoodValue | null,
    energy: (body.energy as MoodEnergy | null | undefined) ?? null,
    note: typeof body.note === "string" ? body.note.trim().slice(0, 280) : "",
  };
}
