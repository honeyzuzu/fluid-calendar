import { currentWeek, elapsedWeeks, parseWeek } from "@/lib/planning-week";
import { prisma } from "@/lib/prisma";

export async function planningTimeZone(userId: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { timeZone: true },
  });
  return settings?.timeZone || "UTC";
}

/** Catch up on use, including after weeks away. Compare-and-update makes concurrent tabs safe.
 * Only pool membership changes: deadlines, future dates, and locked blocks stay intact.
 */
export async function rollUnfinishedTasks(
  userId: string,
  timeZone: string,
  now = new Date()
) {
  const sunday = parseWeek(currentWeek(timeZone, now))!;
  const stale = await prisma.task.findMany({
    where: {
      userId,
      status: { not: "completed" },
      plannedWeekStart: { lt: sunday },
    },
    select: { id: true, plannedWeekStart: true },
  });
  if (!stale.length) return;
  await prisma.$transaction(
    stale.map((task) =>
      prisma.task.updateMany({
        where: {
          id: task.id,
          userId,
          status: { not: "completed" },
          plannedWeekStart: task.plannedWeekStart,
        },
        data: {
          plannedWeekStart: sunday,
          rolledFromWeek: task.plannedWeekStart,
          rolloverCount: {
            increment: elapsedWeeks(task.plannedWeekStart!, sunday),
          },
        },
      })
    )
  );
}
