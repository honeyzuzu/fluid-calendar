import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { PUT } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/logger", () => ({ logger: { error: jest.fn() } }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
    userSettings: { findUnique: jest.fn() },
    calendarSettings: { findUnique: jest.fn() },
    autoScheduleSettings: { findUnique: jest.fn() },
    dailyPlan: { findUnique: jest.fn(), upsert: jest.fn() },
    task: { count: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    calendarEvent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    calendarFeed: { findUnique: jest.fn(), upsert: jest.fn() },
  },
}));

function request(body: unknown) {
  return new NextRequest("http://localhost/api/daily-plan/energy", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date("2026-09-21T13:00:00Z"));
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
    callback(prisma)
  );
  (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
    timeZone: "America/New_York",
  });
  (prisma.calendarSettings.findUnique as jest.Mock).mockResolvedValue({
    workingHoursEnabled: true,
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
    workingHoursDays: "[1,2,3,4,5]",
  });
  (prisma.autoScheduleSettings.findUnique as jest.Mock).mockResolvedValue({
    workDays: "[1,2,3,4,5]",
    workHourStart: 9,
    workHourEnd: 17,
  });
  (prisma.task.count as jest.Mock).mockResolvedValue(1);
  (prisma.dailyPlan.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.task.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
  (prisma.calendarEvent.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.calendarEvent.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.calendarFeed.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.dailyPlan.upsert as jest.Mock).mockResolvedValue({ id: "plan" });
});

afterEach(() => jest.useRealTimers());

it("books local recovery and defers only flexible uncommitted blocks", async () => {
  const flexible = {
    id: "flexible",
    userId: "owner",
    status: "todo",
    scheduledStart: new Date("2026-09-21T18:00:00Z"),
    scheduledEnd: new Date("2026-09-21T18:30:00Z"),
    isAutoScheduled: true,
    scheduleLocked: false,
    blockEventId: null,
    blockFeedId: null,
    priority: "low",
    dueDate: null,
    postponedUntil: null,
  };
  (prisma.task.findMany as jest.Mock)
    .mockResolvedValueOnce([
      flexible,
      { ...flexible, id: "locked", scheduleLocked: true },
      { ...flexible, id: "pushed", blockEventId: "google-event" },
    ])
    .mockResolvedValueOnce([
      {
        id: "essential",
        status: "todo",
        energyLevel: "high",
        duration: 45,
        scheduledEnd: null,
      },
    ]);

  const response = await PUT(
    request({
      date: "2026-09-21",
      energyMode: "low",
      committedTaskIds: ["essential"],
    })
  );
  expect(response!.status).toBe(200);
  expect(prisma.task.updateMany).toHaveBeenCalledTimes(1);
  expect(prisma.task.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ id: "flexible", userId: "owner" }),
      data: expect.objectContaining({
        scheduledStart: null,
        postponedUntil: new Date("2026-09-22T13:00:00Z"),
      }),
    })
  );
  expect(prisma.calendarFeed.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      create: expect.objectContaining({ userId: "owner", type: "LOCAL" }),
    })
  );
  expect(prisma.calendarEvent.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      create: expect.objectContaining({
        title: "Recovery time",
        start: new Date("2026-09-21T13:45:00Z"),
        end: new Date("2026-09-21T14:15:00Z"),
      }),
    })
  );
  expect(prisma.dailyPlan.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      update: expect.objectContaining({
        energyMode: "low",
        recoveryMinutes: 30,
        deferredTaskIds: ["flexible"],
      }),
    })
  );
});

it("places an eligible shallow task after recovery", async () => {
  (prisma.task.count as jest.Mock).mockResolvedValue(2);
  (prisma.task.findMany as jest.Mock)
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([
      {
        id: "essential",
        status: "todo",
        energyLevel: "high",
        duration: 45,
        scheduledStart: null,
        scheduledEnd: null,
      },
      {
        id: "shallow",
        status: "todo",
        energyLevel: "low",
        duration: 30,
        scheduledStart: null,
        scheduledEnd: null,
        isAutoScheduled: true,
        scheduleLocked: false,
        blockEventId: null,
        blockFeedId: null,
        postponedUntil: null,
      },
    ]);
  const response = await PUT(
    request({
      date: "2026-09-21",
      energyMode: "low",
      committedTaskIds: ["essential", "shallow"],
    })
  );
  expect(response!.status).toBe(200);
  expect(prisma.task.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ id: "shallow", userId: "owner" }),
      data: expect.objectContaining({
        scheduledStart: new Date("2026-09-21T14:15:00Z"),
        scheduledEnd: new Date("2026-09-21T14:45:00Z"),
      }),
    })
  );
  expect((await response!.json()).shallowScheduledCount).toBe(1);
});

it("restores deferred tasks when returning to normal without touching changed blocks", async () => {
  (prisma.dailyPlan.findUnique as jest.Mock).mockResolvedValue({
    energyMode: "low",
    deferredTaskIds: ["flexible"],
    deferredUntilAt: new Date("2026-09-22T13:00:00Z"),
  });
  (prisma.task.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
  const response = await PUT(
    request({
      date: "2026-09-21",
      energyMode: "normal",
      committedTaskIds: ["essential"],
    })
  );
  expect(response!.status).toBe(200);
  expect(prisma.calendarEvent.deleteMany).toHaveBeenCalledWith({
    where: {
      id: "sunnie-recovery-event:owner:2026-09-21",
      feed: { userId: "owner" },
    },
  });
  expect(prisma.task.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        id: "flexible",
        scheduledStart: null,
        postponedUntil: new Date("2026-09-22T13:00:00Z"),
      }),
      data: { postponedUntil: null },
    })
  );
  expect(prisma.dailyPlan.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      update: expect.objectContaining({
        deferredTaskIds: [],
        deferredUntilAt: null,
        recoveryMinutes: 0,
      }),
    })
  );
});

it("rejects unauthenticated and foreign-task changes", async () => {
  (authenticateRequest as jest.Mock).mockResolvedValueOnce({
    response: NextResponse.json({}, { status: 401 }),
  });
  expect(
    (await PUT(
      request({
        date: "2026-09-21",
        energyMode: "low",
        committedTaskIds: ["essential"],
      })
    ))!.status
  ).toBe(401);
  (prisma.task.count as jest.Mock).mockResolvedValue(0);
  expect(
    (await PUT(
      request({
        date: "2026-09-21",
        energyMode: "low",
        committedTaskIds: ["foreign"],
      })
    ))!.status
  ).toBe(400);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it("reports an atomic update failure without claiming the plan changed", async () => {
  (prisma.$transaction as jest.Mock).mockRejectedValue(
    new Error("db unavailable")
  );
  const response = await PUT(
    request({
      date: "2026-09-21",
      energyMode: "low",
      committedTaskIds: ["essential"],
    })
  );
  expect(response!.status).toBe(500);
  expect(await response!.json()).toEqual({
    error: "Couldn't adjust today. Your plan was not changed.",
  });
});

it("refuses a recovery feed belonging to another user", async () => {
  (prisma.task.findMany as jest.Mock)
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([]);
  (prisma.calendarFeed.findUnique as jest.Mock).mockResolvedValue({
    userId: "another-user",
    type: "LOCAL",
  });
  const response = await PUT(
    request({
      date: "2026-09-21",
      energyMode: "low",
      committedTaskIds: ["essential"],
    })
  );
  expect(response!.status).toBe(500);
  expect(prisma.calendarFeed.upsert).not.toHaveBeenCalled();
  expect(prisma.calendarEvent.upsert).not.toHaveBeenCalled();
});
