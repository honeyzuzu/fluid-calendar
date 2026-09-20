import { parseWorkDays } from "@/lib/autoSchedule";

export type SchedulingAvailability = {
  workDays: string;
  workHourStart: number;
  workHourEnd: number;
};

export type SchedulingPreset = {
  id: "workweek" | "school-study" | "flexible-week";
  label: string;
  days: number[];
  startHour: number;
  endHour: number;
};

export const SCHEDULING_PRESETS: SchedulingPreset[] = [
  {
    id: "workweek",
    label: "Workweek",
    days: [1, 2, 3, 4, 5],
    startHour: 9,
    endHour: 17,
  },
  {
    id: "school-study",
    label: "School & study",
    days: [0, 1, 2, 3, 4, 5, 6],
    startHour: 8,
    endHour: 22,
  },
  {
    id: "flexible-week",
    label: "Flexible week",
    days: [0, 1, 2, 3, 4, 5, 6],
    startHour: 9,
    endHour: 20,
  },
];

export function matchesSchedulingPreset(
  availability: SchedulingAvailability,
  preset: SchedulingPreset
) {
  const selectedDays = parseWorkDays(availability.workDays).sort(
    (first, second) => first - second
  );
  const presetDays = [...preset.days].sort((first, second) => first - second);

  return (
    availability.workHourStart === preset.startHour &&
    availability.workHourEnd === preset.endHour &&
    selectedDays.length === presetDays.length &&
    selectedDays.every((day, index) => day === presetDays[index])
  );
}

export function schedulingDayName(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T12:00:00.000Z`));
}

export function isSchedulingDayEnabled(dateKey: string, workDays: string) {
  const day = new Date(`${dateKey}T12:00:00.000Z`).getUTCDay();
  return parseWorkDays(workDays).includes(day);
}
