import { deleteCalendarEvent } from "@/lib/calendar-db";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    calendarEvent: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it("removes every provider-linked row before rebuilding a recurring series", async () => {
  (prisma.calendarEvent.findUnique as jest.Mock).mockResolvedValue({
    id: "instance-1",
    feedId: "feed-1",
    externalEventId: "provider-instance-1",
    title: "Standup",
    description: null,
    start: new Date("2026-09-14T13:00:00Z"),
    end: new Date("2026-09-14T13:30:00Z"),
    location: null,
    color: null,
    colorSlot: null,
    isRecurring: true,
    recurrenceRule: null,
    allDay: false,
    isMaster: false,
    masterEventId: null,
    recurringEventId: "provider-series-1",
    feed: {
      id: "feed-1",
      name: "Work",
      type: "GOOGLE",
      enabled: true,
    },
  });

  await deleteCalendarEvent("instance-1", "series");

  expect(prisma.calendarEvent.deleteMany).toHaveBeenCalledWith({
    where: {
      feedId: "feed-1",
      OR: [
        { id: "instance-1" },
        { externalEventId: "provider-series-1" },
        { recurringEventId: "provider-series-1" },
      ],
    },
  });
  expect(prisma.calendarEvent.delete).not.toHaveBeenCalled();
});
