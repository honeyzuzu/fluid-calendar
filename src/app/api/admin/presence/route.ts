import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import {
  ONLINE_WINDOW_MS,
  isPresenceOnline,
  resolvePresenceActivityStart,
} from "@/lib/presence";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "admin-presence";

export async function GET(request: NextRequest) {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  try {
    const now = new Date();
    const activeSince = resolvePresenceActivityStart(
      request.nextUrl.searchParams.get("since"),
      now
    );

    const [totalUsers, activeUsers] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.findMany({
        where: { lastActiveAt: { gte: activeSince } },
        select: {
          id: true,
          name: true,
          email: true,
          lastActiveAt: true,
        },
        orderBy: { lastActiveAt: "desc" },
      }),
    ]);

    const users = activeUsers.map((user) => ({
      ...user,
      online: isPresenceOnline(user.lastActiveAt, now),
    }));

    return NextResponse.json({
      generatedAt: now.toISOString(),
      onlineWindowMinutes: ONLINE_WINDOW_MS / 60_000,
      activeSince: activeSince.toISOString(),
      totalUsers,
      onlineNow: users.filter((user) => user.online).length,
      activeToday: users.length,
      users,
    });
  } catch (error) {
    logger.error(
      "Unable to load presence summary",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Unable to load presence summary" },
      { status: 500 }
    );
  }
}
