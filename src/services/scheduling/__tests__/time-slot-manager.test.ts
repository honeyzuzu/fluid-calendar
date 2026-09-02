import type { CalendarService } from "@/services/scheduling/CalendarService";
import { TimeSlotManagerImpl } from "@/services/scheduling/TimeSlotManager";
import type { AutoScheduleSettings, Task } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { Conflict } from "@/types/scheduling";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
    },
  },
}));

const settings = {
  workDays: "[1,2,3,4,5]",
  workHourStart: 9,
  workHourEnd: 17,
  selectedCalendars: '["calendar"]',
  bufferMinutes: 15,
  highEnergyStart: null,
  highEnergyEnd: null,
  mediumEnergyStart: null,
  mediumEnergyEnd: null,
  lowEnergyStart: null,
  lowEnergyEnd: null,
  groupByProject: false,
} as AutoScheduleSettings;

describe("TimeSlotManager availability", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-06T12:00:00Z"));
    jest.mocked(prisma.task.findMany).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("enforces work hours and the configured buffer around conflicts", async () => {
    const eventStart = new Date("2026-09-07T10:00:00Z");
    const eventEnd = new Date("2026-09-07T11:00:00Z");
    const calendarService = {
      findConflicts: jest.fn().mockResolvedValue([]),
      getEvents: jest.fn().mockResolvedValue([]),
      findBatchConflicts: jest.fn(async (candidates) =>
        candidates.map(({ slot, taskId }) => {
          const overlaps = slot.start < eventEnd && slot.end > eventStart;
          const conflicts: Conflict[] = overlaps
            ? [
                {
                  type: "calendar_event",
                  start: eventStart,
                  end: eventEnd,
                  title: "Meeting",
                  source: { type: "calendar", id: "event" },
                },
              ]
            : [];
          return { slot, taskId, conflicts };
        })
      ),
    } as CalendarService;
    const manager = new TimeSlotManagerImpl(settings, calendarService, "UTC");
    const task = {
      id: "task",
      userId: "user",
      title: "Focused work",
      duration: 30,
      startDate: null,
      dueDate: null,
      energyLevel: null,
      preferredTime: null,
      priority: "none",
      projectId: null,
    } as Task;

    const slots = await manager.findAvailableSlots(
      task,
      new Date("2026-09-07T00:00:00Z"),
      new Date("2026-09-08T00:00:00Z"),
      "user"
    );
    const starts = new Set(slots.map((slot) => slot.start.toISOString()));

    expect(starts.has("2026-09-07T09:00:00.000Z")).toBe(true);
    expect(starts.has("2026-09-07T09:30:00.000Z")).toBe(false);
    expect(starts.has("2026-09-07T10:00:00.000Z")).toBe(false);
    expect(starts.has("2026-09-07T10:30:00.000Z")).toBe(false);
    expect(starts.has("2026-09-07T11:00:00.000Z")).toBe(false);
    expect(starts.has("2026-09-07T11:30:00.000Z")).toBe(true);
    expect(
      slots.every(
        (slot) =>
          slot.start >= new Date("2026-09-07T09:00:00Z") &&
          slot.end <= new Date("2026-09-07T17:00:00Z")
      )
    ).toBe(true);
  });
});
