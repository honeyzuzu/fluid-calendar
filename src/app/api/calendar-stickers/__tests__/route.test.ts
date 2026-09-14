import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { GET, POST } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/logger", () => ({ logger: { error: jest.fn() } }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    calendarSticker: { findMany: jest.fn(), create: jest.fn() },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.calendarSticker.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.calendarSticker.create as jest.Mock).mockResolvedValue({
    id: "sticker-1",
  });
});

it("requires a bounded visible range and scopes reads to the owner", async () => {
  const missingRange = await GET(
    new NextRequest("http://localhost/api/calendar-stickers")
  );
  expect(missingRange).toBeDefined();
  if (!missingRange) throw new Error("Expected an API response");
  expect(missingRange.status).toBe(400);

  const response = await GET(
    new NextRequest(
      "http://localhost/api/calendar-stickers?start=2026-09-01&end=2026-10-01"
    )
  );
  expect(response).toBeDefined();
  if (!response) throw new Error("Expected an API response");
  expect(response.status).toBe(200);
  expect(prisma.calendarSticker.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        userId: "owner",
        view: "month",
        anchorDate: { gte: "2026-09-01", lt: "2026-10-01" },
      },
    })
  );
});

it("creates only whitelisted sticker assets for the authenticated owner", async () => {
  const response = await POST(
    new NextRequest("http://localhost/api/calendar-stickers", {
      method: "POST",
      body: JSON.stringify({
        userId: "someone-else",
        packId: "base",
        stickerId: "garden-daisy",
        view: "month",
        anchorDate: "2026-09-14",
        x: 0.5,
        y: 0.45,
      }),
    })
  );
  expect(response).toBeDefined();
  if (!response) throw new Error("Expected an API response");
  expect(response.status).toBe(201);
  expect(prisma.calendarSticker.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      userId: "owner",
      packId: "base",
      stickerId: "garden-daisy",
    }),
  });

  const invalid = await POST(
    new NextRequest("http://localhost/api/calendar-stickers", {
      method: "POST",
      body: JSON.stringify({
        packId: "arbitrary",
        stickerId: "../../file",
        view: "month",
        anchorDate: "2026-09-14",
        x: 0.5,
        y: 0.45,
      }),
    })
  );
  expect(invalid).toBeDefined();
  if (!invalid) throw new Error("Expected an API response");
  expect(invalid.status).toBe(400);
});
