import { getCalendarItemClassNames } from "@/lib/calendar-task-style";

import { Priority } from "@/types/task";

describe("calendar task styling", () => {
  it("keeps ordinary calendar events separate from task styling", () => {
    expect(
      getCalendarItemClassNames({
        isTask: false,
        priority: Priority.HIGH,
        durationMs: 15 * 60 * 1000,
      })
    ).toEqual(["calendar-event"]);
  });

  it("marks short tasks as compact without changing their font size", () => {
    expect(
      getCalendarItemClassNames({
        isTask: true,
        priority: Priority.MEDIUM,
        durationMs: 15 * 60 * 1000,
      })
    ).toEqual([
      "calendar-task",
      "calendar-task-priority-medium",
      "calendar-task-compact",
    ]);
  });

  it("uses the gentle neutral tone when priority is missing", () => {
    expect(
      getCalendarItemClassNames({
        isTask: true,
        durationMs: 60 * 60 * 1000,
      })
    ).toEqual(["calendar-task", "calendar-task-priority-none"]);
  });
});
