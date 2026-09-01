import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "presence-heartbeat";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  try {
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
