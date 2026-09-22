export const REMINDER_CHOICES = [5, 15, 30, 60, 1440] as const;

export function validateReminderMinutes(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length > 5) return null;
  if (
    !value.every(
      (minute) => Number.isInteger(minute) && minute >= 0 && minute <= 40320
    )
  )
    return null;
  if (new Set(value).size !== value.length) return null;
  return [...value].sort((a, b) => a - b);
}

export function googleReminderState(
  reminders?: {
    useDefault?: boolean | null;
    overrides?: Array<{
      method?: string | null;
      minutes?: number | null;
    }> | null;
  } | null
) {
  if (!reminders || reminders.useDefault !== false) {
    return { useDefaultReminders: true, reminderMinutes: [] as number[] };
  }
  return {
    useDefaultReminders: false,
    reminderMinutes: (reminders.overrides ?? [])
      .filter(
        (item) => item.method === "popup" && Number.isInteger(item.minutes)
      )
      .map((item) => item.minutes as number),
  };
}

export function googleReminderPayload(useDefault: boolean, minutes: number[]) {
  return useDefault
    ? { useDefault: true }
    : {
        useDefault: false,
        overrides: minutes.map((value) => ({
          method: "popup",
          minutes: value,
        })),
      };
}
