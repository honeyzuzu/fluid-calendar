import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { getEvent } from "@/lib/calendar-db";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "event-route";

// Get a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    const { id } = await params;
    const event = await getEvent(id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if the event belongs to a feed owned by the current user
    if (event.feed.userId !== userId) {
      logger.warn(
        "Unauthorized access attempt to event",
        { eventId: id, userId: userId || "unknown" },
        LOG_SOURCE
      );
      return NextResponse.json(
        { error: "Event not found or you don't have permission to access it" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    logger.error(
      "Failed to fetch event:",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// Update a specific event
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    const { id } = await params;

    // Check if the event belongs to a feed owned by the current user
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        feed: true,
      },
    });

    if (!existingEvent || existingEvent.feed.userId !== userId) {
      logger.warn(
        "Unauthorized access attempt to update event",
        { eventId: id, userId: userId || "unknown" },
        LOG_SOURCE
      );
      return NextResponse.json(
        { error: "Event not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      color?: unknown;
      colorSlot?: unknown;
      mode?: unknown;
    };
    if (
      !("color" in body) ||
      (body.color !== null &&
        (typeof body.color !== "string" ||
          !/^#[0-9A-Fa-f]{6}$/.test(body.color)))
    ) {
      return NextResponse.json(
        { error: "Choose a valid event color" },
        { status: 400 }
      );
    }
    if (
      body.colorSlot !== undefined &&
      body.colorSlot !== null &&
      (typeof body.colorSlot !== "string" ||
        !/^event-[1-8]$/.test(body.colorSlot))
    ) {
      return NextResponse.json(
        { error: "Choose a valid event palette color" },
        { status: 400 }
      );
    }
    if (
      body.mode !== undefined &&
      body.mode !== "single" &&
      body.mode !== "series"
    ) {
      return NextResponse.json(
        { error: "Choose whether to update one event or the series" },
        { status: 400 }
      );
    }

    const colorUpdate = {
      color: body.color as string | null,
      colorSlot:
        body.colorSlot === undefined
          ? undefined
          : (body.colorSlot as string | null),
    };

    if (body.mode === "series" && existingEvent.isRecurring) {
      const masterDatabaseId = existingEvent.isMaster
        ? existingEvent.id
        : existingEvent.masterEventId;
      const providerSeriesId = existingEvent.isMaster
        ? existingEvent.externalEventId
        : existingEvent.recurringEventId;
      const relatedRows = [
        { id: existingEvent.id },
        ...(masterDatabaseId
          ? [{ id: masterDatabaseId }, { masterEventId: masterDatabaseId }]
          : []),
        ...(providerSeriesId
          ? [
              { externalEventId: providerSeriesId },
              { recurringEventId: providerSeriesId },
            ]
          : []),
      ];

      await prisma.calendarEvent.updateMany({
        where: {
          feedId: existingEvent.feedId,
          OR: relatedRows,
        },
        data: colorUpdate,
      });
    } else {
      await prisma.calendarEvent.update({
        where: { id },
        data: colorUpdate,
      });
    }

    const updated = await prisma.calendarEvent.findUnique({ where: { id } });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error(
      "Failed to update event:",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// Delete a specific event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    const { id } = await params;

    // Check if the event belongs to a feed owned by the current user
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        feed: true,
      },
    });

    if (!existingEvent || existingEvent.feed.userId !== userId) {
      logger.warn(
        "Unauthorized access attempt to delete event",
        { eventId: id, userId: userId || "unknown" },
        LOG_SOURCE
      );
      return NextResponse.json(
        { error: "Event not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      "Failed to delete event:",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
