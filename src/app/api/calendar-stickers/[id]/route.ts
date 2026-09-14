import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { parseCalendarStickerUpdate } from "@/lib/calendar-stickers";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "calendar-sticker-route";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;
    const updates = parseCalendarStickerUpdate(await request.json());
    if (!updates) {
      return NextResponse.json(
        { error: "Choose a valid sticker position" },
        { status: 400 }
      );
    }
    const { id } = await params;
    const result = await prisma.calendarSticker.updateMany({
      where: { id, userId: auth.userId },
      data: updates,
    });
    if (result.count !== 1) {
      return NextResponse.json({ error: "Sticker not found" }, { status: 404 });
    }
    const sticker = await prisma.calendarSticker.findFirst({
      where: { id, userId: auth.userId },
    });
    return NextResponse.json(sticker);
  } catch (error) {
    logger.error(
      "Failed to update calendar sticker",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to update calendar sticker" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;
    const { id } = await params;
    const result = await prisma.calendarSticker.deleteMany({
      where: { id, userId: auth.userId },
    });
    if (result.count !== 1) {
      return NextResponse.json({ error: "Sticker not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      "Failed to delete calendar sticker",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to delete calendar sticker" },
      { status: 500 }
    );
  }
}
