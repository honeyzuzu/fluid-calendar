import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { currentWeek, parseWeek, weekBounds } from "@/lib/planning-week";
import { prisma } from "@/lib/prisma";
import { planningTimeZone, rollUnfinishedTasks } from "@/lib/weekly-planning";

const SOURCE = "weekly-review";
const taskSelect = {
  id: true,
  title: true,
  completedAt: true,
  duration: true,
  plannedWeekStart: true,
  rolloverCount: true,
  scheduleLocked: true,
} as const;

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, SOURCE);
  if ("response" in auth) return auth.response;
  const week = parseWeek(request.nextUrl.searchParams.get("week"));
  if (!week)
    return NextResponse.json({ error: "Choose a valid week" }, { status: 400 });
  const userId = auth.userId;
  const timeZone = await planningTimeZone(userId);
  await rollUnfinishedTasks(userId, timeZone);
  const key = week.toISOString().slice(0, 10);
  const { start, end } = weekBounds(key, timeZone);
  const cursor = request.nextUrl.searchParams.get("cursor");
  const [review, completed, calendars, events, blocks, unfinished] =
    await Promise.all([
      prisma.weeklyReview.findUnique({
        where: { userId_weekStart: { userId, weekStart: week } },
      }),
      prisma.task.findMany({
        where: {
          userId,
          status: "completed",
          completedAt: { gte: start, lt: end },
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        select: taskSelect,
        orderBy: { id: "asc" },
        take: 101,
      }),
      prisma.calendarFeed.findMany({
        where: { userId },
        select: { id: true, name: true, enabled: true, color: true },
      }),
      prisma.calendarEvent.findMany({
        where: {
          feed: { userId },
          isMaster: false,
          start: { lt: end },
          end: { gt: start, lte: new Date() },
          OR: [
            { status: null },
            {
              status: {
                notIn: ["cancelled", "canceled", "CANCELLED", "CANCELED"],
              },
            },
          ],
        },
        select: {
          id: true,
          externalEventId: true,
          feedId: true,
          title: true,
          start: true,
          end: true,
          allDay: true,
        },
        orderBy: { start: "asc" },
      }),
      prisma.task.findMany({
        where: { userId, blockEventId: { not: null } },
        select: { blockEventId: true, blockFeedId: true },
      }),
      prisma.task.findMany({
        where: {
          userId,
          status: { not: "completed" },
          OR: [
            { plannedWeekStart: week },
            { rolledFromWeek: { lte: week }, plannedWeekStart: { gt: week } },
            { scheduledStart: { gte: start, lt: end } },
            { startDate: { gte: start, lt: end } },
          ],
        },
        select: taskSelect,
        orderBy: [{ rolloverCount: "desc" }, { createdAt: "asc" }],
      }),
    ]);
  const taskBlocks = new Set(
    blocks.map((block) => `${block.blockFeedId}:${block.blockEventId}`)
  );
  return NextResponse.json({
    week: key,
    currentWeek: currentWeek(timeZone),
    timeZone,
    review,
    calendars,
    completed: completed.slice(0, 100),
    nextCursor: completed.length > 100 ? completed[99].id : null,
    events: events.filter(
      (event) => !taskBlocks.has(`${event.feedId}:${event.externalEventId}`)
    ),
    unfinished,
  });
}

const reviewInput = z.object({
  week: z.string(),
  goodThings: z.string().max(5000),
  makeEasier: z.string().max(5000),
  nextPriorities: z.string().max(5000),
  calendarIds: z.array(z.string().max(200)).max(500),
  completed: z.boolean(),
});

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request, SOURCE);
  if ("response" in auth) return auth.response;
  const parsed = reviewInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Check your review fields (up to 5,000 characters each)." },
      { status: 400 }
    );
  const { week: rawWeek, completed, ...fields } = parsed.data;
  const weekStart = parseWeek(rawWeek);
  if (!weekStart)
    return NextResponse.json({ error: "Choose a valid week" }, { status: 400 });
  const calendars = await prisma.calendarFeed.findMany({
    where: { userId: auth.userId, id: { in: fields.calendarIds } },
    select: { id: true },
  });
  if (calendars.length !== new Set(fields.calendarIds).size)
    return NextResponse.json(
      { error: "A selected calendar is no longer available." },
      { status: 400 }
    );
  const data = {
    ...fields,
    calendarIds: calendars.map((calendar) => calendar.id),
    completedAt: completed ? new Date() : null,
  };
  const review = await prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId: auth.userId, weekStart } },
    create: { userId: auth.userId, weekStart, ...data },
    update: data,
  });
  return NextResponse.json(review);
}
