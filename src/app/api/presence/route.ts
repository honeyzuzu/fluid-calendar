import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { planningTimeZone, rollUnfinishedTasks } from "@/lib/weekly-planning";

const LOG_SOURCE = "presence-heartbeat";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  try {
    await rollUnfinishedTasks(auth.userId, await planningTimeZone(auth.userId));
    await prisma.user.updateMany({
      where: { id: auth.userId },
      data: { lastActiveAt: new Date() },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error(
      "Unable to record presence heartbeat",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Unable to record presence" },
      { status: 500 }
    );
  }
}
