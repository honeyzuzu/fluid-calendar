import {
  calculateDailyCapacity,
  formatCapacityTime,
} from "@/lib/daily-capacity";

const settings = {
  enabled: true,
  start: "09:00",
  end: "17:00",
  days: [1, 2, 3, 4, 5],
};

it("combines task estimates with non-overlapping meeting time", () => {
  const capacity = calculateDailyCapacity(
    new Date(2026, 8, 9),
    [{ duration: 120 }],
    [
      {
        start: new Date(2026, 8, 9, 10).toISOString(),
        end: new Date(2026, 8, 9, 11).toISOString(),
        allDay: false,
      },
      {
        start: new Date(2026, 8, 9, 10, 30).toISOString(),
        end: new Date(2026, 8, 9, 11, 30).toISOString(),
        allDay: false,
      },
    ],
    settings
  );

  expect(capacity).toMatchObject({
    capacityMinutes: 480,
    taskMinutes: 120,
    meetingMinutes: 90,
    usedMinutes: 210,
    remainingMinutes: 270,
    state: "comfortable",
  });
});

it("ignores all-day, cancelled, and mirrored task events", () => {
  const capacity = calculateDailyCapacity(
    new Date(2026, 8, 9),
    [{ duration: null, blockEventId: "task-event", blockFeedId: "mine" }],
    [
      {
        start: new Date(2026, 8, 9, 9).toISOString(),
        end: new Date(2026, 8, 9, 10).toISOString(),
        allDay: true,
      },
      {
        start: new Date(2026, 8, 9, 10).toISOString(),
        end: new Date(2026, 8, 9, 11).toISOString(),
        allDay: false,
        status: "cancelled",
      },
      {
        start: new Date(2026, 8, 9, 11).toISOString(),
        end: new Date(2026, 8, 9, 12).toISOString(),
        allDay: false,
        feedId: "mine",
        externalEventId: "task-event",
      },
    ],
    settings
  );

  expect(capacity.taskMinutes).toBe(30);
  expect(capacity.meetingMinutes).toBe(0);
});

it("marks an overloaded day and omits limits on non-working days", () => {
  expect(
    calculateDailyCapacity(
      new Date(2026, 8, 9),
      [{ duration: 500 }],
      [],
      settings
    ).state
  ).toBe("over");
  expect(
    calculateDailyCapacity(new Date(2026, 8, 13), [], [], settings)
  ).toMatchObject({ capacityMinutes: null, state: "unavailable" });
  expect(formatCapacityTime(135)).toBe("2h 15m");
});
