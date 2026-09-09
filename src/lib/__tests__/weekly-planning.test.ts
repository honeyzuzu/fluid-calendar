import {
  currentWeek,
  elapsedWeeks,
  parseWeek,
  weekBounds,
} from "@/lib/planning-week";
import { prisma } from "@/lib/prisma";
import { rollUnfinishedTasks } from "@/lib/weekly-planning";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    task: { findMany: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

describe("planning weeks", () => {
  it("rejects impossible dates and non-Mondays", () => {
    expect(parseWeek("2026-09-07")?.toISOString()).toBe(
      "2026-09-07T00:00:00.000Z"
    );
    expect(parseWeek("2026-09-07T00:00:00.000Z")).not.toBeNull();
    for (const invalid of [
      "2026-09-08",
      "2026-02-30",
      "not a date",
      "2026-09-07T04:00:00.000Z",
      null,
    ])
      expect(parseWeek(invalid)).toBeNull();
  });
  it("uses the account's local Monday and handles DST without a fixed 168-hour assumption", () => {
    expect(
      currentWeek("America/New_York", new Date("2026-09-07T02:00:00Z"))
    ).toBe("2026-08-31");
    const spring = weekBounds("2026-03-02", "America/New_York");
    expect(spring.start.toISOString()).toBe("2026-03-02T05:00:00.000Z");
    expect(spring.end.toISOString()).toBe("2026-03-09T04:00:00.000Z");
    expect(
      elapsedWeeks(parseWeek("2026-08-17")!, parseWeek("2026-09-07")!)
    ).toBe(3);
  });
  it("catches up once with a scoped compare-and-update, without moving calendar blocks or deadlines", async () => {
    const from = parseWeek("2026-08-17");
    (prisma.task.findMany as jest.Mock).mockResolvedValue([
      { id: "task", plannedWeekStart: from },
    ]);
    await rollUnfinishedTasks(
      "owner",
      "America/New_York",
      new Date("2026-09-09T12:00:00Z")
    );
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "owner",
          status: { not: "completed" },
          plannedWeekStart: { lt: parseWeek("2026-09-07") },
        },
      })
    );
    expect(prisma.task.updateMany).toHaveBeenCalledWith({
      where: {
        id: "task",
        userId: "owner",
        status: { not: "completed" },
        plannedWeekStart: from,
      },
      data: {
        plannedWeekStart: parseWeek("2026-09-07"),
        rolledFromWeek: from,
        rolloverCount: { increment: 3 },
      },
    });
  });
});
