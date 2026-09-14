import { getCalendarItemClassNames } from "@/lib/calendar-task-style";

describe("calendar task styling", () => {
  it("keeps ordinary calendar events separate from task styling", () => {
    expect(
      getCalendarItemClassNames({
        isTask: false,
        taskId: "event-1",
        durationMs: 15 * 60 * 1000,
      })
    ).toEqual(["calendar-event"]);
  });

  it("marks short tasks as compact without changing their font size", () => {
    expect(
      getCalendarItemClassNames({
        isTask: true,
        taskId: "task-1",
        durationMs: 15 * 60 * 1000,
      })
    ).toEqual([
      "calendar-task",
      "calendar-task-color-2",
      "calendar-task-compact",
    ]);
  });

  it("uses a stable aesthetic color without depending on priority", () => {
    expect(
      getCalendarItemClassNames({
        isTask: true,
        taskId: "",
        durationMs: 60 * 60 * 1000,
      })
    ).toEqual(["calendar-task", "calendar-task-color-1"]);
  });
});
