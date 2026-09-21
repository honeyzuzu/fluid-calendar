import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { GET, PUT } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    dailyPlan: { findUnique: jest.fn(), upsert: jest.fn() },
    task: { count: jest.fn() },
  },
}));

function request(body: unknown) {
  return new NextRequest("http://localhost/api/daily-plan", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.dailyPlan.upsert as jest.Mock).mockResolvedValue({
    id: "plan",
    intention: "Move gently",
    dayVibe: "soft",
    unwindReflection: "I can leave this here.",
    completedAt: new Date(),
    unwindCompletedAt: new Date(),
  });
});

it("requires authentication for private daily rituals", async () => {
  (authenticateRequest as jest.Mock).mockResolvedValue({
    response: NextResponse.json({}, { status: 401 }),
  });
  expect(
    (await GET(
      new NextRequest("http://localhost/api/daily-plan?date=2026-09-12")
    ))!.status
  ).toBe(401);
  expect((await PUT(request({ date: "2026-09-12" })))!.status).toBe(401);
});

it("stores Rise and Unwind only for the authenticated owner and day", async () => {
  expect(
    (await PUT(
      request({
        date: "2026-09-12",
        intention: "  Move gently  ",
        completed: true,
        dayVibe: "soft",
        unwindReflection: "  I can leave this here.  ",
        unwindCompleted: true,
        userId: "someone-else",
      })
    ))!.status
  ).toBe(200);
  expect(prisma.dailyPlan.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        userId_date: {
          userId: "owner",
          date: new Date("2026-09-12T00:00:00.000Z"),
        },
      },
      update: expect.objectContaining({
        intention: "Move gently",
        dayVibe: "soft",
        unwindReflection: "I can leave this here.",
        completedAt: expect.any(Date),
        unwindCompletedAt: expect.any(Date),
      }),
    })
  );
});

it("rejects invalid ritual values", async () => {
  expect(
    (await PUT(request({ date: "not-a-day", dayVibe: "sunny" })))!.status
  ).toBe(400);
  expect(
    (await PUT(request({ date: "2026-09-12", dayVibe: "perfect" })))!.status
  ).toBe(400);
  expect(
    (await PUT(request({ date: "2026-09-12", unwindCompleted: "yes" })))!.status
  ).toBe(400);
  expect(prisma.dailyPlan.upsert).not.toHaveBeenCalled();
});

it("saves only owned tasks in a daily commitment", async () => {
  (prisma.task.count as jest.Mock).mockResolvedValue(2);
  expect(
    (await PUT(
      request({
        date: "2026-09-21",
        committedTaskIds: ["first", "second"],
        energyMode: "low",
        recoveryMinutes: 30,
      })
    ))!.status
  ).toBe(200);
  expect(prisma.task.count).toHaveBeenCalledWith({
    where: { userId: "owner", id: { in: ["first", "second"] } },
  });
  expect(prisma.dailyPlan.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      update: expect.objectContaining({
        committedTaskIds: ["first", "second"],
        commitmentSetAt: expect.any(Date),
        energyMode: "low",
        recoveryMinutes: 30,
      }),
    })
  );
});

it("rejects foreign, duplicate, and invalid commitment tasks", async () => {
  (prisma.task.count as jest.Mock).mockResolvedValue(1);
  expect(
    (await PUT(
      request({ date: "2026-09-21", committedTaskIds: ["first", "foreign"] })
    ))!.status
  ).toBe(400);
  expect(
    (await PUT(
      request({ date: "2026-09-21", committedTaskIds: ["same", "same"] })
    ))!.status
  ).toBe(400);
  expect(
    (await PUT(request({ date: "2026-09-21", energyMode: "exhausted" })))!
      .status
  ).toBe(400);
  expect(prisma.dailyPlan.upsert).not.toHaveBeenCalled();
});
