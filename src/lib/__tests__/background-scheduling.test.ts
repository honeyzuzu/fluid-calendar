import { needsBackgroundReschedule } from "@/lib/background-scheduling";

const now = new Date("2026-09-17T12:00:00.000Z");
const task = {
  scheduledStart: new Date("2026-09-17T14:00:00.000Z"),
  scheduledEnd: new Date("2026-09-17T15:00:00.000Z"),
  duration: 60,
};

function event(
  start: string,
  end: string,
  overrides: Partial<{
    allDay: boolean;
    status: string | null;
    externalEventId: string | null;
  }> = {}
) {
  return {
    start: new Date(start),
    end: new Date(end),
    allDay: false,
    status: "confirmed",
    externalEventId: null,
    ...overrides,
  };
}

describe("automatic scheduling", () => {
  it("keeps an existing future task in place when nothing conflicts", () => {
    expect(needsBackgroundReschedule(task, now, [], new Set(), 0)).toBe(false);
  });

  it("schedules new and expired tasks", () => {
    expect(
      needsBackgroundReschedule(
        { ...task, scheduledStart: null, scheduledEnd: null },
        now,
        [],
        new Set(),
        0
      )
    ).toBe(true);
    expect(
      needsBackgroundReschedule(
        {
          ...task,
          scheduledStart: new Date("2026-09-16T14:00:00.000Z"),
          scheduledEnd: new Date("2026-09-16T15:00:00.000Z"),
        },
        now,
        [],
        new Set(),
        0
      )
    ).toBe(true);
  });

  it("moves an unfinished task whose start time has already passed", () => {
    expect(
      needsBackgroundReschedule(
        {
          ...task,
          scheduledStart: new Date("2026-09-17T11:00:00.000Z"),
          scheduledEnd: new Date("2026-09-17T13:00:00.000Z"),
          duration: 120,
        },
        now,
        [],
        new Set(),
        0
      )
    ).toBe(true);
  });

  it("moves a task only when its duration or a real calendar conflict changes", () => {
    expect(
      needsBackgroundReschedule(
        { ...task, duration: 90 },
        now,
        [],
        new Set(),
        0
      )
    ).toBe(true);
    expect(
      needsBackgroundReschedule(
        task,
        now,
        [event("2026-09-17T14:30:00.000Z", "2026-09-17T15:30:00.000Z")],
        new Set(),
        0
      )
    ).toBe(true);
  });

  it("ignores all-day, cancelled, and mirrored task-block events", () => {
    const overlapping = event(
      "2026-09-17T14:30:00.000Z",
      "2026-09-17T15:30:00.000Z"
    );
    expect(
      needsBackgroundReschedule(
        task,
        now,
        [
          { ...overlapping, allDay: true },
          { ...overlapping, status: "cancelled" },
          { ...overlapping, externalEventId: "pushed-block" },
        ],
        new Set(["pushed-block"]),
        0
      )
    ).toBe(false);
  });
});
