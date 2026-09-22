import { NextRequest, NextResponse } from "next/server";

import { fromZonedTime } from "date-fns-tz";

import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  type CommitmentEvent,
  type CommitmentHours,
  hoursFromAutoScheduleSettings,
} from "@/lib/daily-commitment";
import {
  findRecoveryBlock,
  nextWorkingStart,
  recoveryEventId,
  recoveryFeedId,
} from "@/lib/daily-energy";
import { dateKeyInTimeZone } from "@/lib/daily-intention";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "daily-energy-route";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function nextDay(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function parseHours(
  value: {
    workingHoursEnabled: boolean;
    workingHoursStart: string;
    workingHoursEnd: string;
    workingHoursDays: string;
  } | null
): CommitmentHours {
  let days: number[] = [1, 2, 3, 4, 5];
  try {
    const parsed: unknown = JSON.parse(
      value?.workingHoursDays ?? "[1,2,3,4,5]"
    );
    if (Array.isArray(parsed)) {
      days = parsed.filter(
        (day): day is number => Number.isInteger(day) && day >= 0 && day <= 6
      );
    }
  } catch {
    // Keep the safe weekday default for malformed legacy settings.
  }
  return {
    enabled: value?.workingHoursEnabled ?? true,
    start: value?.workingHoursStart ?? "09:00",
    end: value?.workingHoursEnd ?? "17:00",
    days,
  };
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const dateKey = input.date;
  const mode = input.energyMode;
  const ids = input.committedTaskIds;
  if (
    typeof dateKey !== "string" ||
    !DATE_PATTERN.test(dateKey) ||
    Number.isNaN(new Date(`${dateKey}T00:00:00Z`).getTime()) ||
    (mode !== "normal" && mode !== "low") ||
    !Array.isArray(ids) ||
    ids.length > 12 ||
    ids.some((id) => typeof id !== "string" || !id.trim()) ||
    new Set(ids).size !== ids.length
  ) {
    return NextResponse.json(
      { error: "Choose a valid day, energy setting, and up to 12 tasks" },
      { status: 400 }
    );
  }
  const committedTaskIds = ids as string[];
  const [settings, calendarSettings, autoScheduleSettings, ownedCount] =
    await Promise.all([
      prisma.userSettings.findUnique({
        where: { userId: auth.userId },
        select: { timeZone: true },
      }),
      prisma.calendarSettings.findUnique({
        where: { userId: auth.userId },
        select: {
          workingHoursEnabled: true,
          workingHoursStart: true,
          workingHoursEnd: true,
          workingHoursDays: true,
        },
      }),
      prisma.autoScheduleSettings.findUnique({
        where: { userId: auth.userId },
        select: {
          workDays: true,
          workHourStart: true,
          workHourEnd: true,
        },
      }),
      committedTaskIds.length
        ? prisma.task.count({
            where: { userId: auth.userId, id: { in: committedTaskIds } },
          })
        : Promise.resolve(0),
    ]);
  if (ownedCount !== committedTaskIds.length) {
    return NextResponse.json(
      { error: "One or more tasks are unavailable" },
      { status: 400 }
    );
  }
  const timeZone = settings?.timeZone || "UTC";
  const now = new Date();
  if (dateKeyInTimeZone(now, timeZone) !== dateKey) {
    return NextResponse.json(
      { error: "Energy changes are available for today only" },
      { status: 400 }
    );
  }
  const hours = autoScheduleSettings
    ? hoursFromAutoScheduleSettings(autoScheduleSettings)
    : parseHours(calendarSettings);
  const tomorrowKey = nextDay(dateKey);
  const start = fromZonedTime(`${dateKey}T00:00:00`, timeZone);
  const end = fromZonedTime(`${tomorrowKey}T00:00:00`, timeZone);
  const deferredUntil = nextWorkingStart(dateKey, timeZone, hours);
  const eventId = recoveryEventId(auth.userId, dateKey);
  const feedId = recoveryFeedId(auth.userId);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.dailyPlan.findUnique({
        where: {
          userId_date: {
            userId: auth.userId,
            date: new Date(`${dateKey}T00:00:00Z`),
          },
        },
      });
      const deferredTaskIds: string[] =
        mode === "low" && previous?.energyMode === "low"
          ? [...previous.deferredTaskIds]
          : [];
      const effectiveDeferredUntil =
        mode === "low" &&
        previous?.energyMode === "low" &&
        previous.deferredUntilAt
          ? previous.deferredUntilAt
          : deferredUntil;
      let restoredCount = 0;
      let movedCount = 0;
      let shallowScheduledCount = 0;
      let recoveryBlock: { start: Date; end: Date } | null = null;

      if (mode === "low") {
        const [scheduled, committed, events] = await Promise.all([
          tx.task.findMany({
            where: {
              userId: auth.userId,
              status: { not: "completed" },
              scheduledStart: { lt: end },
              scheduledEnd: { gt: now },
            },
          }),
          tx.task.findMany({
            where: { userId: auth.userId, id: { in: committedTaskIds } },
          }),
          tx.calendarEvent.findMany({
            where: {
              feed: { userId: auth.userId },
              start: { lt: end },
              end: { gt: start },
            },
            include: { feed: { select: { enabled: true } } },
          }),
        ]);
        if (effectiveDeferredUntil) {
          for (const task of scheduled) {
            if (
              committedTaskIds.includes(task.id) ||
              !task.isAutoScheduled ||
              task.scheduleLocked ||
              task.blockEventId ||
              task.blockFeedId ||
              task.priority === "high" ||
              (task.dueDate &&
                task.dueDate.toISOString().slice(0, 10) <= dateKey) ||
              (task.postponedUntil && task.postponedUntil > now) ||
              !task.scheduledStart ||
              task.scheduledStart < now ||
              dateKeyInTimeZone(task.scheduledStart, timeZone) !== dateKey
            ) {
              continue;
            }
            const changed = await tx.task.updateMany({
              where: {
                id: task.id,
                userId: auth.userId,
                scheduledStart: task.scheduledStart,
                scheduleLocked: false,
                blockEventId: null,
                blockFeedId: null,
              },
              data: {
                scheduledStart: null,
                scheduledEnd: null,
                scheduleScore: null,
                lastScheduled: null,
                postponedUntil: effectiveDeferredUntil,
              },
            });
            if (changed.count === 1) {
              movedCount++;
              if (!deferredTaskIds.includes(task.id))
                deferredTaskIds.push(task.id);
            }
          }
        }
        const essential =
          committed.find(
            (task) => task.status !== "completed" && task.energyLevel === "high"
          ) ?? committed.find((task) => task.status !== "completed");
        const busyEvents: CommitmentEvent[] = [
          ...events.map((event) => ({
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            allDay: event.allDay,
            status: event.status,
            isFree: event.isFree,
            externalEventId: event.externalEventId,
            feed: event.feed,
          })),
          ...scheduled
            .filter(
              (task) =>
                !deferredTaskIds.includes(task.id) &&
                task.scheduledStart &&
                task.scheduledEnd
            )
            .map((task) => ({
              start: task.scheduledStart!.toISOString(),
              end: task.scheduledEnd!.toISOString(),
              allDay: false,
              externalEventId: `sunnie-task:${task.id}`,
            })),
        ];
        recoveryBlock = findRecoveryBlock({
          dateKey,
          timeZone,
          hours,
          now,
          minutes: 30,
          protectedMinutes: essential?.scheduledEnd
            ? 0
            : essential
              ? Math.max(5, essential.duration ?? 30)
              : 0,
          protectedUntil: essential?.scheduledEnd,
          events: busyEvents,
        });
        if (!recoveryBlock && previous?.energyMode === "low") {
          const pastRecovery = events.find(
            (event) => event.id === eventId && event.end <= now
          );
          if (pastRecovery) {
            recoveryBlock = {
              start: pastRecovery.start,
              end: pastRecovery.end,
            };
          }
        }
        if (recoveryBlock) {
          const [existingFeed, existingEvent] = await Promise.all([
            tx.calendarFeed.findUnique({
              where: { id: feedId },
              select: { userId: true, type: true },
            }),
            tx.calendarEvent.findUnique({
              where: { id: eventId },
              select: { feed: { select: { userId: true } } },
            }),
          ]);
          if (
            (existingFeed &&
              (existingFeed.userId !== auth.userId ||
                existingFeed.type !== "LOCAL")) ||
            (existingEvent && existingEvent.feed.userId !== auth.userId)
          ) {
            throw new Error("Recovery calendar ownership mismatch");
          }
          await tx.calendarFeed.upsert({
            where: { id: feedId },
            create: {
              id: feedId,
              userId: auth.userId,
              name: "Sunnie recovery",
              type: "LOCAL",
              colorSlot: "event-5",
              enabled: true,
            },
            update: { enabled: true },
          });
          await tx.calendarEvent.upsert({
            where: { id: eventId },
            create: {
              id: eventId,
              feedId,
              externalEventId: eventId,
              title: "Recovery time",
              description: "Time to rest. This block stays in Sunnie.",
              start: recoveryBlock.start,
              end: recoveryBlock.end,
            },
            update: {
              start: recoveryBlock.start,
              end: recoveryBlock.end,
            },
          });
          for (const task of committed) {
            if (
              task.status === "completed" ||
              task.energyLevel !== "low" ||
              !task.isAutoScheduled ||
              task.scheduleLocked ||
              task.blockEventId ||
              task.blockFeedId ||
              (task.postponedUntil && task.postponedUntil > now) ||
              (task.scheduledStart && task.scheduledStart < now) ||
              (task.scheduledStart && task.scheduledStart >= recoveryBlock.end)
            ) {
              continue;
            }
            const taskSlot = findRecoveryBlock({
              dateKey,
              timeZone,
              hours,
              now,
              minutes: Math.max(5, task.duration ?? 30),
              protectedMinutes: 0,
              protectedUntil: recoveryBlock.end,
              events: busyEvents.filter(
                (event) => event.externalEventId !== `sunnie-task:${task.id}`
              ),
            });
            if (!taskSlot) continue;
            const changed = await tx.task.updateMany({
              where: {
                id: task.id,
                userId: auth.userId,
                scheduledStart: task.scheduledStart,
                scheduleLocked: false,
                blockEventId: null,
                blockFeedId: null,
              },
              data: {
                scheduledStart: taskSlot.start,
                scheduledEnd: taskSlot.end,
                lastScheduled: now,
              },
            });
            if (changed.count === 1) {
              shallowScheduledCount++;
              const oldIndex = busyEvents.findIndex(
                (event) => event.externalEventId === `sunnie-task:${task.id}`
              );
              if (oldIndex >= 0) busyEvents.splice(oldIndex, 1);
              busyEvents.push({
                start: taskSlot.start.toISOString(),
                end: taskSlot.end.toISOString(),
                allDay: false,
                externalEventId: `sunnie-task:${task.id}`,
              });
            }
          }
        } else {
          await tx.calendarEvent.deleteMany({
            where: { id: eventId, feed: { userId: auth.userId } },
          });
        }
      } else {
        await tx.calendarEvent.deleteMany({
          where: { id: eventId, feed: { userId: auth.userId } },
        });
        if (previous?.deferredUntilAt) {
          for (const id of previous.deferredTaskIds) {
            const changed = await tx.task.updateMany({
              where: {
                id,
                userId: auth.userId,
                scheduledStart: null,
                postponedUntil: previous.deferredUntilAt,
              },
              data: { postponedUntil: null },
            });
            restoredCount += changed.count;
          }
        }
      }

      const date = new Date(`${dateKey}T00:00:00Z`);
      const plan = await tx.dailyPlan.upsert({
        where: { userId_date: { userId: auth.userId, date } },
        create: {
          userId: auth.userId,
          date,
          committedTaskIds,
          commitmentSetAt: now,
          energyMode: mode,
          recoveryMinutes: recoveryBlock ? 30 : 0,
          deferredTaskIds,
          deferredUntilAt:
            mode === "low" && deferredTaskIds.length
              ? effectiveDeferredUntil
              : null,
        },
        update: {
          committedTaskIds,
          commitmentSetAt: now,
          energyMode: mode,
          recoveryMinutes: recoveryBlock ? 30 : 0,
          deferredTaskIds,
          deferredUntilAt:
            mode === "low" && deferredTaskIds.length
              ? effectiveDeferredUntil
              : null,
        },
      });
      return {
        plan,
        deferredCount: movedCount,
        restoredCount,
        shallowScheduledCount,
        recoveryBlock,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error(
      "Low-energy change failed",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Couldn't adjust today. Your plan was not changed." },
      { status: 500 }
    );
  }
}
