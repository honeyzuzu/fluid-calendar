import { findRecoveryBlock, nextWorkingStart } from "../daily-energy";

const dateKey = "2026-09-21";
const timeZone = "America/New_York";
const hours = {
  enabled: true,
  start: "09:00",
  end: "17:00",
  days: [1, 2, 3, 4, 5],
};

it("places recovery after protected focus without overlapping a meeting", () => {
  const block = findRecoveryBlock({
    dateKey,
    timeZone,
    hours,
    now: new Date("2026-09-21T13:00:00Z"),
    minutes: 30,
    protectedMinutes: 60,
    events: [
      {
        start: "2026-09-21T14:00:00Z",
        end: "2026-09-21T15:00:00Z",
        allDay: false,
      },
    ],
  });
  expect(block?.start.toISOString()).toBe("2026-09-21T15:00:00.000Z");
  expect(block?.end.toISOString()).toBe("2026-09-21T15:30:00.000Z");
});

it("does not put recovery on top of protected focus or into the evening", () => {
  const block = findRecoveryBlock({
    dateKey,
    timeZone,
    hours,
    now: new Date("2026-09-21T20:00:00Z"),
    minutes: 30,
    protectedMinutes: 45,
    events: [],
  });
  expect(block).toBeNull();
});

it("ignores an existing Sunnie recovery event when recalculating", () => {
  const block = findRecoveryBlock({
    dateKey,
    timeZone,
    hours,
    now: new Date("2026-09-21T13:00:00Z"),
    minutes: 30,
    protectedMinutes: 0,
    events: [
      {
        start: "2026-09-21T13:00:00Z",
        end: "2026-09-21T13:30:00Z",
        allDay: false,
        externalEventId: "sunnie-recovery-event:owner:2026-09-21",
      },
    ],
  });
  expect(block?.start.toISOString()).toBe("2026-09-21T13:00:00.000Z");
});

it("defers work to the next configured workday", () => {
  expect(nextWorkingStart("2026-09-25", timeZone, hours)?.toISOString()).toBe(
    "2026-09-28T13:00:00.000Z"
  );
});
