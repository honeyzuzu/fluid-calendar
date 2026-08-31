import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "friend-events-route";

function validDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const start = validDate(request.nextUrl.searchParams.get("start"));
  const end = validDate(request.nextUrl.searchParams.get("end"));
  if (!start || !end || end <= start) {
    return NextResponse.json({ error: "Valid start and end dates are required" }, { status: 400 });
  }

  const connections = await prisma.friendConnection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: auth.userId }, { addresseeId: auth.userId }],
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      addressee: { select: { id: true, name: true, email: true } },
    },
  });

  const sharedFriends = connections.flatMap((connection) => {
    const currentIsRequester = connection.requesterId === auth.userId;
    const friend = currentIsRequester ? connection.addressee : connection.requester;
    const visibility = currentIsRequester ? connection.addresseeVisibility : connection.requesterVisibility;
    return visibility === "NONE" ? [] : [{ friend, visibility }];
  });
  if (!sharedFriends.length) return NextResponse.json([]);

  const friendIds = sharedFriends.map(({ friend }) => friend.id);
  const [events, tasks] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        feed: { userId: { in: friendIds } },
        start: { lt: end },
        end: { gt: start },
      },
      include: { feed: { select: { userId: true, color: true } } },
    }),
    prisma.task.findMany({
      where: {
        userId: { in: friendIds },
        scheduledStart: { lt: end },
        scheduledEnd: { gt: start },
        status: { not: "completed" },
      },
      select: { id: true, userId: true, title: true, scheduledStart: true, scheduledEnd: true },
    }),
  ]);

  const friendMap = new Map(sharedFriends.map(({ friend, visibility }) => [friend.id, { friend, visibility }]));
  const blocks = [
    ...events.flatMap((event) => {
      const share = event.feed.userId ? friendMap.get(event.feed.userId) : undefined;
      if (!share) return [];
      return [{
        id: `event-${event.id}`,
        title: share.visibility === "DETAILS" ? event.title : "Busy",
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        owner: share.friend.name || share.friend.email || "Friend",
        color: event.feed.color || "#9e80d9",
        source: "calendar",
      }];
    }),
    ...tasks.flatMap((task) => {
      if (!task.userId || !task.scheduledStart || !task.scheduledEnd) return [];
      const share = friendMap.get(task.userId);
      if (!share) return [];
      return [{
        id: `task-${task.id}`,
        title: share.visibility === "DETAILS" ? task.title : "Busy",
        start: task.scheduledStart,
        end: task.scheduledEnd,
        allDay: false,
        owner: share.friend.name || share.friend.email || "Friend",
        color: "#9e80d9",
        source: "focus",
      }];
    }),
  ];

  return NextResponse.json(blocks.sort((a, b) => a.start.getTime() - b.start.getTime()));
}
