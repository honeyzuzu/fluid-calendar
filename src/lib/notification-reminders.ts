/** Accept current arrays and older JSON values written twice by the settings client. */
export function normalizeNotificationReminderTiming(value: unknown): number[] {
  let parsed = value;
  for (let attempt = 0; attempt < 2 && typeof parsed === "string"; attempt++) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [30];
    }
  }
  if (typeof parsed === "number") parsed = [parsed];
  return Array.isArray(parsed) &&
    parsed.length > 0 &&
    parsed.every(
      (minute) =>
        typeof minute === "number" &&
        Number.isInteger(minute) &&
        minute >= 0 &&
        minute <= 10080
    )
    ? parsed
    : [30];
}
