const THIRTY_MINUTES_MS = 30 * 60 * 1000;

interface CalendarTaskStyleInput {
  isTask: boolean;
  taskId?: string;
  color?: string | null;
  colorSlot?: string | null;
  durationMs: number;
}

function getTaskColorSlot(taskId = "", colorSlot?: string | null) {
  const explicitSlot = colorSlot?.match(/^task-([1-6])$/)?.[1];
  if (explicitSlot) return Number(explicitSlot);
  const hash = [...taskId].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    0
  );
  return (hash % 6) + 1;
}

export function getCalendarItemClassNames({
  isTask,
  taskId,
  color,
  colorSlot,
  durationMs,
}: CalendarTaskStyleInput): string[] {
  if (!isTask) return ["calendar-event"];

  return [
    "calendar-task",
    ...(!color || colorSlot
      ? [`calendar-task-color-${getTaskColorSlot(taskId, colorSlot)}`]
      : ["calendar-task-custom-color"]),
    ...(durationMs > 0 && durationMs <= THIRTY_MINUTES_MS
      ? ["calendar-task-compact"]
      : []),
  ];
}
