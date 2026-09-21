import {
  hoursFromAutoScheduleSettings,
  suggestDailyCommitment,
} from "../daily-commitment";

const hours = { enabled: true, start: "09:00", end: "17:00", days: [1] };
const dateKey = "2026-09-21";
const timeZone = "America/New_York";
const now = new Date("2026-09-21T13:00:00.000Z");

it("uses the same availability days and hours as task scheduling", () => {
  expect(
    hoursFromAutoScheduleSettings({
      workDays: "[0,6]",
      workHourStart: 11,
      workHourEnd: 19,
    })
  ).toEqual({ enabled: true, days: [0, 6], start: "11:00", end: "19:00" });
});

it("keeps the daily commitment finite and reserves breaks and meetings", () => {
  const result = suggestDailyCommitment({
    dateKey,
    timeZone,
    energyMode: "normal",
    hours,
    now,
    events: [
      {
        start: "2026-09-21T14:00:00.000Z",
        end: "2026-09-21T15:00:00.000Z",
        allDay: false,
      },
    ],
    tasks: [
      {
        id: "urgent",
        status: "todo",
        duration: 45,
        priority: "high",
        dueDate: "2026-09-21T00:00:00.000Z",
      },
      { id: "later-1", status: "todo", duration: 45, priority: "medium" },
      { id: "later-2", status: "todo", duration: 45, priority: "low" },
      { id: "later-3", status: "todo", duration: 45, priority: "low" },
    ],
  });

  expect(result.taskIds).toHaveLength(3);
  expect(result.taskIds[0]).toBe("urgent");
  expect(result.meetingMinutes).toBe(60);
  expect(result.bufferMinutes).toBe(96);
  expect(result.usableMinutes).toBe(324);
});

it("makes a low-energy plan smaller while keeping a due task visible", () => {
  const tasks = [
    {
      id: "urgent",
      status: "todo",
      duration: 45,
      priority: "high",
      energyLevel: "high",
      dueDate: "2026-09-21T00:00:00.000Z",
    },
    {
      id: "deep",
      status: "todo",
      duration: 60,
      priority: "medium",
      energyLevel: "high",
    },
    {
      id: "shallow",
      status: "todo",
      duration: 25,
      priority: "low",
      energyLevel: "low",
    },
  ];
  const result = suggestDailyCommitment({
    dateKey,
    timeZone,
    energyMode: "low",
    hours,
    now,
    events: [],
    tasks,
  });

  expect(result.recoveryMinutes).toBe(30);
  expect(result.taskIds).toEqual(["urgent", "shallow"]);
  expect(result.taskIds).not.toContain("deep");
});

it("flags urgent work that cannot fit in the commitment", () => {
  const result = suggestDailyCommitment({
    dateKey,
    timeZone,
    energyMode: "low",
    hours,
    now,
    events: [],
    tasks: ["a", "b", "c"].map((id) => ({
      id,
      status: "todo",
      duration: 30,
      dueDate: "2026-09-21T00:00:00.000Z",
    })),
  });
  expect(result.taskIds).toHaveLength(2);
  expect(result.urgentUncommittedIds).toHaveLength(1);
});

it("does not promise deadline work that exceeds the available window", () => {
  const result = suggestDailyCommitment({
    dateKey,
    timeZone,
    energyMode: "normal",
    hours,
    now: new Date("2026-09-21T20:00:00.000Z"),
    events: [],
    tasks: [
      {
        id: "too-long",
        status: "todo",
        duration: 60,
        dueDate: "2026-09-21T00:00:00.000Z",
      },
      {
        id: "fits",
        status: "todo",
        duration: 20,
        dueDate: "2026-09-21T00:00:00.000Z",
      },
    ],
  });

  expect(result.usableMinutes).toBe(45);
  expect(result.taskIds).toEqual(["fits"]);
  expect(result.urgentUncommittedIds).toEqual(["too-long"]);
});

it("does not suggest work after the configured stop time", () => {
  const result = suggestDailyCommitment({
    dateKey,
    timeZone,
    energyMode: "normal",
    hours,
    now: new Date("2026-09-21T22:00:00.000Z"),
    events: [],
    tasks: [{ id: "later", status: "todo", duration: 30, priority: "high" }],
  });
  expect(result.usableMinutes).toBe(0);
  expect(result.taskIds).toEqual([]);
});

it("does not count the booked recovery block twice", () => {
  const result = suggestDailyCommitment({
    dateKey,
    timeZone,
    energyMode: "low",
    hours,
    now,
    events: [
      {
        start: "2026-09-21T15:00:00Z",
        end: "2026-09-21T15:30:00Z",
        allDay: false,
        externalEventId: "sunnie-recovery-event:owner:2026-09-21",
      },
    ],
    tasks: [],
  });
  expect(result.meetingMinutes).toBe(0);
  expect(result.recoveryMinutes).toBe(30);
});
