import { SlotScorer } from "@/services/scheduling/SlotScorer";
import type { AutoScheduleSettings, Task } from "@prisma/client";

import type { TimeSlot } from "@/types/scheduling";

const settings = {
  workDays: "[1,2,3,4,5]",
  workHourStart: 9,
  workHourEnd: 17,
  selectedCalendars: "[]",
  bufferMinutes: 15,
  highEnergyStart: 9,
  highEnergyEnd: 12,
  mediumEnergyStart: 12,
  mediumEnergyEnd: 15,
  lowEnergyStart: 15,
  lowEnergyEnd: 17,
  groupByProject: false,
} as AutoScheduleSettings;

describe("SlotScorer timezone handling", () => {
  it("scores energy and preferred time using the user's local hour", () => {
    const scorer = new SlotScorer(settings, new Map(), "America/New_York");
    const slot = {
      start: new Date("2026-09-07T15:00:00Z"), // 11 AM in New York
      end: new Date("2026-09-07T15:30:00Z"),
      score: 0,
      conflicts: [],
      energyLevel: null,
      isWithinWorkHours: true,
      hasBufferTime: true,
    } as TimeSlot;
    const task = {
      energyLevel: "high",
      preferredTime: "morning",
      priority: "none",
      dueDate: null,
      projectId: null,
    } as Task;

    const result = scorer.scoreSlot(slot, task);
    expect(result.factors.energyLevelMatch).toBe(1);
    expect(result.factors.timePreference).toBe(1);
  });
});
