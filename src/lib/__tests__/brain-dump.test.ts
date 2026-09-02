import {
  MAX_BRAIN_DUMP_TASKS,
  needsTaskTuneUp,
  parseBrainDump,
} from "@/lib/brain-dump";

describe("parseBrainDump", () => {
  it("turns lines and common bullet styles into unique task titles", () => {
    expect(
      parseBrainDump(`
        - Book dentist
        * Call Maya
        1. Buy flowers
        [ ] Send RSVP
        book dentist
      `)
    ).toEqual(["Book dentist", "Call Maya", "Buy flowers", "Send RSVP"]);
  });

  it("limits a single dump to a safe batch size", () => {
    const text = Array.from(
      { length: MAX_BRAIN_DUMP_TASKS + 5 },
      (_, index) => `Task ${index}`
    ).join("\n");
    expect(parseBrainDump(text)).toHaveLength(MAX_BRAIN_DUMP_TASKS);
  });
});

describe("needsTaskTuneUp", () => {
  it("includes active tasks with missing planning details", () => {
    expect(
      needsTaskTuneUp({
        status: "todo",
        duration: null,
        priority: "none",
        energyLevel: null,
        dueDate: null,
      })
    ).toBe(true);
  });

  it("ignores ready and completed tasks", () => {
    expect(
      needsTaskTuneUp({
        status: "todo",
        duration: 30,
        priority: "medium",
        energyLevel: "low",
        dueDate: "2026-09-10",
      })
    ).toBe(false);
    expect(
      needsTaskTuneUp({
        status: "todo",
        duration: 30,
        priority: "medium",
        energyLevel: "low",
        dueDate: null,
      })
    ).toBe(true);
    expect(needsTaskTuneUp({ status: "completed" })).toBe(false);
  });
});
