import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  AttendeeStatus,
  CalendarEventWithFeed,
  EventStatus,
  ValidatedEvent,
} from "@/types/calendar";

export async function getEvent(
  eventId: string
): Promise<CalendarEventWithFeed | null> {
  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    include: { feed: true },
  });

  if (!event) return null;

  // Map Prisma result to our CalendarEventWithFeed type
  return {
    ...event,
    externalEventId: event.externalEventId || undefined,
    description: event.description || undefined,
    location: event.location || undefined,
    recurrenceRule: event.recurrenceRule || undefined,
    sequence: event.sequence || undefined,
    status: (event.status as EventStatus) || undefined,
    created: event.created || undefined,
    lastModified: event.lastModified || undefined,
    organizer: event.organizer as { name?: string; email?: string } | undefined,
    attendees: event.attendees as
      | Array<{ name?: string; email: string; status?: AttendeeStatus }>
      | undefined,
    masterEventId: event.masterEventId || undefined,
    recurringEventId: event.recurringEventId || undefined,
    feed: {
      ...event.feed,
      type: event.feed.type as "GOOGLE" | "OUTLOOK" | "CALDAV",
      url: event.feed.url || undefined,
      color: event.feed.color || undefined,
      lastSync: event.feed.lastSync || undefined,
      error: event.feed.error || undefined,
      caldavPath: event.feed.caldavPath || undefined,
      accountId: event.feed.accountId || undefined,
      syncToken: event.feed.syncToken || undefined,
      userId: event.feed.userId || undefined,
    },
  };
}

export async function validateEvent(
  event: CalendarEventWithFeed | null,
  provider: "GOOGLE" | "OUTLOOK" | "CALDAV"
): Promise<ValidatedEvent | NextResponse> {
  if (!event || !event.feed || !event.feed.accountId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.feed.type !== provider) {
    return NextResponse.json(
      { error: `Not a ${provider} Calendar event` },
      { status: 400 }
    );
  }

  // For CalDAV, we need either a URL or a caldavPath
  if (provider === "CALDAV" && !event.feed.caldavPath && !event.feed.url) {
    return NextResponse.json(
      { error: "No CalDAV calendar path found" },
      { status: 400 }
    );
  } else if (provider !== "CALDAV" && !event.feed.url) {
    return NextResponse.json(
      { error: "No calendar URL found" },
      { status: 400 }
    );
  }

  if (!event.externalEventId) {
    return NextResponse.json(
      { error: `No ${provider} Calendar event ID found` },
      { status: 400 }
    );
  }

  return event as ValidatedEvent;
}

export async function deleteCalendarEvent(
  eventId: string,
  mode: "single" | "series" = "single"
) {
  const event = await getEvent(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  await deleteCalendarEventRows(prisma, event, mode);

  return event;
}

export async function deleteCalendarEventRows(
  db: Pick<Prisma.TransactionClient, "calendarEvent">,
  event: CalendarEventWithFeed,
  mode: "single" | "series" = "single"
) {
  if (mode === "series") {
    // Provider-created recurring instances do not always have a local master
    // row, but they do share recurringEventId. Remove both relationship forms
    // before regenerated provider instances are inserted.
    const masterDatabaseId = event.isMaster ? event.id : event.masterEventId;
    const providerSeriesId = event.isMaster
      ? event.externalEventId
      : event.recurringEventId;

    await db.calendarEvent.deleteMany({
      where: {
        feedId: event.feedId,
        OR: [
          { id: event.id },
          ...(masterDatabaseId
            ? [{ id: masterDatabaseId }, { masterEventId: masterDatabaseId }]
            : []),
          ...(providerSeriesId
            ? [
                { externalEventId: providerSeriesId },
                { recurringEventId: providerSeriesId },
              ]
            : []),
        ],
      },
    });
  } else {
    //delete a single instance
    await db.calendarEvent.delete({
      where: {
        id: event.id,
      },
    });
  }
}
