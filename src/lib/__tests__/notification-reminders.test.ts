import { normalizeNotificationReminderTiming } from "../notification-reminders";

describe("notification reminder timing compatibility", () => {
  it("keeps a valid array from the API", () => {
    expect(normalizeNotificationReminderTiming([5, 30])).toEqual([5, 30]);
  });

  it("recovers values stored with one or two JSON encodings", () => {
    expect(normalizeNotificationReminderTiming("[15,60]")).toEqual([15, 60]);
    expect(normalizeNotificationReminderTiming('"[15,60]"')).toEqual([15, 60]);
    expect(normalizeNotificationReminderTiming("30")).toEqual([30]);
  });

  it("uses a safe default for malformed values", () => {
    expect(normalizeNotificationReminderTiming("broken")).toEqual([30]);
    expect(normalizeNotificationReminderTiming([-1, 99999])).toEqual([30]);
  });
});
