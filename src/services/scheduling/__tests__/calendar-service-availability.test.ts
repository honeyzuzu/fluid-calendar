import { prisma } from "@/lib/prisma";
import { CalendarServiceImpl } from "@/services/scheduling/CalendarServiceImpl";

jest.mock("@/lib/prisma", () => ({
  prisma: { calendarEvent: { findMany: jest.fn() } },
}));

it("does not pass free or cancelled provider events to conflict checks", async () => {
  const start = new Date("2026-09-21T14:00:00.000Z");
  const end = new Date("2026-09-21T15:00:00.000Z");
  (prisma.calendarEvent.findMany as jest.Mock).mockResolvedValue([
    { id: "busy", start, end, isFree: false, status: "confirmed" },
    { id: "free", start, end, isFree: true, status: "confirmed" },
    { id: "cancelled", start, end, isFree: false, status: "cancelled" },
  ]);

  const events = await new CalendarServiceImpl().getEvents(start, end, ["feed"]);
  expect(events.map((event) => event.id)).toEqual(["busy"]);
});
