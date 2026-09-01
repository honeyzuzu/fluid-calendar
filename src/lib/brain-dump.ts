import { TaskStatus } from "@/types/task";

export const MAX_BRAIN_DUMP_TASKS = 50;
export const MAX_BRAIN_DUMP_TITLE_LENGTH = 300;

const BULLET_PREFIX = /^\s*(?:[-*•]+|\d+[.)]|\[[ xX]?\])\s*/;

export function parseBrainDump(text: string) {
  const seen = new Set<string>();

  return text
    .split(/\r?\n/)
    .map((line) => line.replace(BULLET_PREFIX, "").trim())
    .filter(Boolean)
    .filter((title) => {
      const normalized = title.toLocaleLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, MAX_BRAIN_DUMP_TASKS);
}

export type TaskTuneUpSummary = {
  status?: string | null;
  duration?: number | null;
  priority?: string | null;
  energyLevel?: string | null;
};

export function needsTaskTuneUp(task: TaskTuneUpSummary) {
  if (task.status === TaskStatus.COMPLETED) return false;

  return (
    !task.status ||
    !task.duration ||
    task.duration <= 0 ||
    !task.priority ||
    task.priority === "none" ||
    !task.energyLevel
  );
}
