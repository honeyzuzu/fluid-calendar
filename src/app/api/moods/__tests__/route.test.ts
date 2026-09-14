import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { GET, PUT } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    dailyMoodEntry: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const updateRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/moods", {
    method: "PUT",
    body: JSON.stringify(body),
  });

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.dailyMoodEntry.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.dailyMoodEntry.upsert as jest.Mock).mockResolvedValue({ id: "mood" });
  (prisma.dailyMoodEntry.deleteMany as jest.Mock).mockResolvedValue({
    count: 1,
  });
});

it("reads only the authenticated owner's requested month", async () => {
  const response = await GET(
    new NextRequest("http://localhost/api/moods?month=2026-09")
  );
  expect(response).toBeDefined();
  if (!response) throw new Error("Expected an API response");
  expect(response.status).toBe(200);
  expect(prisma.dailyMoodEntry.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        userId: "owner",
        date: {
          gte: new Date("2026-09-01T00:00:00.000Z"),
          lt: new Date("2026-10-01T00:00:00.000Z"),
        },
      },
    })
  );
});

it("upserts one owner/date/phase entry and ignores supplied ownership", async () => {
  const response = await PUT(
    updateRequest({
      userId: "someone-else",
      date: "2026-09-14",
      phase: "rise",
      mood: 4,
      energy: 2,
      note: "  Quietly hopeful  ",
    })
  );
  expect(response).toBeDefined();
  if (!response) throw new Error("Expected an API response");
  expect(response.status).toBe(200);
  expect(prisma.dailyMoodEntry.upsert).toHaveBeenCalledWith({
    where: {
      userId_date_phase: {
        userId: "owner",
        date: new Date("2026-09-14T00:00:00.000Z"),
        phase: "rise",
      },
    },
    create: expect.objectContaining({
      userId: "owner",
      mood: 4,
      note: "Quietly hopeful",
    }),
    update: { mood: 4, energy: 2, note: "Quietly hopeful" },
  });
});

it("supports clearing an optional check-in without deleting another user's", async () => {
  const response = await PUT(
    updateRequest({
      date: "2026-09-14",
      phase: "unwind",
      mood: null,
    })
  );
  expect(response).toBeDefined();
  if (!response) throw new Error("Expected an API response");
  expect(response.status).toBe(200);
  expect(prisma.dailyMoodEntry.deleteMany).toHaveBeenCalledWith({
    where: {
      userId: "owner",
      date: new Date("2026-09-14T00:00:00.000Z"),
      phase: "unwind",
    },
  });
});
