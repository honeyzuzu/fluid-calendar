import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  parseNewCalendarSticker,
  parseStickerDateRange,
} from "@/lib/calendar-stickers";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "calendar-stickers-route";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;

    const range = parseStickerDateRange(
      request.nextUrl.searchParams.get("start"),
      request.nextUrl.searchParams.get("end")
    );
    if (!range) {
      return NextResponse.json(
        { error: "Choose a valid visible date range" },
        { status: 400 }
      );
    }

    const stickers = await prisma.calendarSticker.findMany({
      where: {
        userId: auth.userId,
        view: "month",
        anchorDate: { gte: range.start, lt: range.end },
      },
      orderBy: [{ zIndex: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(stickers);
  } catch (error) {
    logger.error(
      "Failed to fetch calendar stickers",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to fetch calendar stickers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;

    const input = parseNewCalendarSticker(await request.json());
    if (!input) {
      return NextResponse.json(
        { error: "Choose a valid sticker and calendar position" },
        { status: 400 }
      );
    }

    const sticker = await prisma.calendarSticker.create({
      data: { ...input, userId: auth.userId },
    });
    return NextResponse.json(sticker, { status: 201 });
  } catch (error) {
    logger.error(
      "Failed to place calendar sticker",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to place calendar sticker" },
      { status: 500 }
    );
  }
}
