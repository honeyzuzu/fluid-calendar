import { ConnectedAccount } from "@prisma/client";

import { CalDAVCalendarService } from "@/lib/caldav-calendar";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    calendarFeed: { findFirst: jest.fn() },
    calendarEvent: { findMany: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("CalDAV refresh", () => {
  it("keeps stored events when the remote calendar cannot be fetched", async () => {
    const account = {
      id: "account-1",
    } as ConnectedAccount;
    const service = new CalDAVCalendarService(account);
    const deleteMany = prisma.calendarEvent.deleteMany as jest.Mock;
    const transaction = prisma.$transaction as jest.Mock;

    (prisma.calendarFeed.findFirst as jest.Mock).mockResolvedValue({
      id: "feed-1",
      syncToken: null,
    });
    (prisma.calendarEvent.findMany as jest.Mock).mockResolvedValue([]);
    Object.assign(service, {
      getEvents: jest.fn().mockRejectedValue(new Error("CalDAV unavailable")),
    });

    await expect(
      service.syncCalendar("feed-1", "https://dav.test/calendar", "user-1")
    ).rejects.toThrow("CalDAV unavailable");
    expect(deleteMany).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });
});
