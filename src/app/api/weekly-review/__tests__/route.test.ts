import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { GET, PUT } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/weekly-planning", () => ({
  planningTimeZone: jest.fn().mockResolvedValue("America/New_York"),
  rollUnfinishedTasks: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    weeklyReview: { findUnique: jest.fn(), upsert: jest.fn() },
    task: { findMany: jest.fn() },
    calendarFeed: { findMany: jest.fn() },
    calendarEvent: { findMany: jest.fn() },
  },
}));
const input = {
  week: "2026-09-06",
  goodThings: "A peaceful walk",
  makeEasier: "More breaks",
  nextPriorities: "Make room for friends",
  calendarIds: ["mine"],
  completed: true,
};
function request(body: unknown) {
  return new NextRequest("http://localhost/api/weekly-review", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.calendarFeed.findMany as jest.Mock).mockResolvedValue([
    { id: "mine" },
  ]);
  (prisma.weeklyReview.upsert as jest.Mock).mockResolvedValue(input);
});
it("requires authentication before reading or writing private reflections", async () => {
  (authenticateRequest as jest.Mock).mockResolvedValue({
    response: NextResponse.json({}, { status: 401 }),
  });
  expect((await PUT(request(input)))?.status).toBe(401);
  expect(
    (
      await GET(
        new NextRequest("http://localhost/api/weekly-review?week=2026-09-06")
      )
    )?.status
  ).toBe(401);
  expect(prisma.weeklyReview.upsert).not.toHaveBeenCalled();
  expect(prisma.weeklyReview.findUnique).not.toHaveBeenCalled();
});
it("saves reflections only for the authenticated owner and chosen week", async () => {
  expect(
    (await PUT(request({ ...input, userId: "someone-else" })))?.status
  ).toBe(200);
  expect(prisma.weeklyReview.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        userId_weekStart: {
          userId: "owner",
          weekStart: new Date("2026-09-06T00:00:00Z"),
        },
      },
      create: expect.objectContaining({
        userId: "owner",
        goodThings: input.goodThings,
      }),
      update: expect.objectContaining({ nextPriorities: input.nextPriorities }),
    })
  );
});
it("rejects calendars outside the user's account and invalid review inputs", async () => {
  expect(
    (await PUT(request({ ...input, calendarIds: ["mine", "someone-else"] })))
      ?.status
  ).toBe(400);
  expect(
    (await PUT(request({ ...input, goodThings: "x".repeat(5001) })))?.status
  ).toBe(400);
  expect((await PUT(request({ ...input, week: "2026-09-07" })))?.status).toBe(
    400
  );
  expect(prisma.weeklyReview.upsert).not.toHaveBeenCalled();
});
it("bounds history to local completion dates and removes mirrored task blocks", async () => {
  (prisma.weeklyReview.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.task.findMany as jest.Mock)
    .mockResolvedValueOnce([{ id: "done" }])
    .mockResolvedValueOnce([
      { blockEventId: "external-task", blockFeedId: "mine" },
    ])
    .mockResolvedValueOnce([]);
  (prisma.calendarEvent.findMany as jest.Mock).mockResolvedValue([
    { id: "mirror", feedId: "mine", externalEventId: "external-task" },
    { id: "meeting", feedId: "mine", externalEventId: "meeting" },
  ]);
  const response = await GET(
    new NextRequest("http://localhost/api/weekly-review?week=2026-09-06")
  );
  const body = await response!.json();
  expect(body.events).toEqual([
    { id: "meeting", feedId: "mine", externalEventId: "meeting" },
  ]);
  expect(prisma.task.findMany).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      where: {
        userId: "owner",
        status: "completed",
        completedAt: {
          gte: new Date("2026-09-06T04:00:00Z"),
          lt: new Date("2026-09-13T04:00:00Z"),
        },
      },
      take: 101,
    })
  );
  expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        feed: { userId: "owner" },
        isMaster: false,
      }),
    })
  );
  expect(prisma.task.findMany).toHaveBeenNthCalledWith(
    3,
    expect.objectContaining({
      where: expect.objectContaining({
        userId: "owner",
        status: { not: "completed" },
        OR: expect.arrayContaining([
          {
            scheduledStart: {
              gte: new Date("2026-09-06T04:00:00Z"),
              lt: new Date("2026-09-13T04:00:00Z"),
            },
          },
          {
            startDate: {
              gte: new Date("2026-09-06T04:00:00Z"),
              lt: new Date("2026-09-13T04:00:00Z"),
            },
          },
        ]),
      }),
    })
  );
});
