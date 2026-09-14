import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { GET } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), error: jest.fn() },
}));
jest.mock("@/lib/prisma", () => ({
  prisma: { calendarEvent: { findMany: jest.fn() } },
}));

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.calendarEvent.findMany as jest.Mock).mockResolvedValue([]);
});

it("requires a bounded visible range", async () => {
  const response = await GET(
    new NextRequest("http://localhost/api/events?start=2026-09-01")
  );

  expect(response).toBeDefined();
  if (!response) throw new Error("Expected an API response");
  expect(response.status).toBe(400);
  expect(prisma.calendarEvent.findMany).not.toHaveBeenCalled();
});

it("keeps range reads scoped to the owner and selected feeds", async () => {
  const url = new URL("http://localhost/api/events");
  url.searchParams.set("start", "2026-09-01T00:00:00.000Z");
  url.searchParams.set("end", "2026-10-01T00:00:00.000Z");
  url.searchParams.append("feedId", "feed-a");
  url.searchParams.append("feedId", "feed-b");

  const response = await GET(new NextRequest(url));

  expect(response).toBeDefined();
  if (!response) throw new Error("Expected an API response");
  expect(response.status).toBe(200);
  expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        feedId: { in: ["feed-a", "feed-b"] },
        feed: { userId: "owner" },
        OR: expect.any(Array),
      }),
    })
  );
});
