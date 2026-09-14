const THIRTY_MINUTES_MS = 30 * 60 * 1000;

interface CalendarTaskStyleInput {
  isTask: boolean;
  taskId?: string;
  durationMs: number;
}

function getTaskColorSlot(taskId = "") {
  const hash = [...taskId].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    0
  );
  return (hash % 6) + 1;
}

export function getCalendarItemClassNames({
  isTask,
  taskId,
  durationMs,
}: CalendarTaskStyleInput): string[] {
  if (!isTask) return ["calendar-event"];

  return [
    "calendar-task",
    `calendar-task-color-${getTaskColorSlot(taskId)}`,
    ...(durationMs > 0 && durationMs <= THIRTY_MINUTES_MS
      ? ["calendar-task-compact"]
      : []),
  ];
}
