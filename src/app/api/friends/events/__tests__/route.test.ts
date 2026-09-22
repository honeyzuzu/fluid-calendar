import { NextRequest } from "next/server";

import { GET } from "@/app/api/friends/events/route";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    friendConnection: { findMany: jest.fn() },
    calendarEvent: { findMany: jest.fn() },
    task: { findMany: jest.fn() },
  },
}));

it("shares occupied time, not free events or a private Sunnie name", async () => {
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "viewer" });
  (prisma.friendConnection.findMany as jest.Mock).mockResolvedValue([
    {
      requesterId: "viewer",
      addresseeId: "friend",
      addresseeVisibility: "BUSY_ONLY",
      requester: { id: "viewer", name: "Viewer", email: null },
      addressee: { id: "friend", name: "Friend", email: null },
    },
  ]);
  const start = new Date("2026-09-21T14:00:00.000Z");
  const end = new Date("2026-09-21T15:00:00.000Z");
  const feed = { userId: "friend", color: null };
  (prisma.calendarEvent.findMany as jest.Mock).mockResolvedValue([
    { id: "busy", title: "Work meeting", titleOverride: "My note", isFree: false, status: "confirmed", start, end, allDay: false, feed },
    { id: "free", title: "Untitled Event", isFree: true, status: "confirmed", start, end, allDay: false, feed },
    { id: "cancelled", title: "Cancelled", isFree: false, status: "cancelled", start, end, allDay: false, feed },
  ]);
  (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

  const request = new NextRequest(
    "http://localhost/api/friends/events?start=2026-09-21T13%3A00%3A00.000Z&end=2026-09-21T16%3A00%3A00.000Z"
  );
  const response = await GET(request);
  if (!response) throw new Error("Expected a friend events response");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([
    expect.objectContaining({ id: "event-busy", title: "Busy" }),
  ]);
  expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        feed: { userId: { in: ["friend"] }, enabled: true },
      }),
    })
  );
});
