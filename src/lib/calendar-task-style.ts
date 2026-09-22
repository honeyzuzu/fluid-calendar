const THIRTY_MINUTES_MS = 30 * 60 * 1000;

interface CalendarTaskStyleInput {
  isTask: boolean;
  allDay?: boolean;
  isFree?: boolean;
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
  allDay,
  isFree,
  taskId,
  color,
  colorSlot,
  durationMs,
}: CalendarTaskStyleInput): string[] {
  if (!isTask)
    return [
      "calendar-event",
      ...(allDay ? ["calendar-event-all-day"] : []),
      ...(isFree ? ["calendar-event-free"] : []),
      ...(!allDay && durationMs > 0 && durationMs <= THIRTY_MINUTES_MS
        ? ["calendar-event-compact"]
        : []),
      ...(!allDay && durationMs >= 3 * 60 * 60 * 1000
        ? ["calendar-event-long"]
        : []),
    ];

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
