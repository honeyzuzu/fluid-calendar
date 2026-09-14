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

  it("uses an explicitly selected task palette slot", () => {
    expect(
      getCalendarItemClassNames({
        isTask: true,
        taskId: "task-1",
        colorSlot: "task-5",
        color: "#C6DCEB",
        durationMs: 60 * 60 * 1000,
      })
    ).toEqual(["calendar-task", "calendar-task-color-5"]);
  });

  it("lets a fixed custom color remain inline instead of overriding it", () => {
    expect(
      getCalendarItemClassNames({
        isTask: true,
        taskId: "task-1",
        color: "#123456",
        durationMs: 60 * 60 * 1000,
      })
    ).toEqual(["calendar-task", "calendar-task-custom-color"]);
  });
});
