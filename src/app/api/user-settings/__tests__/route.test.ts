import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { PATCH } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: { userSettings: { upsert: jest.fn() } },
}));

function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/user-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.userSettings.upsert as jest.Mock).mockResolvedValue({
    userId: "owner",
    calendarStyle: "bujo",
  });
});

it("rejects an unknown calendar style", async () => {
  const response = await PATCH(request({ calendarStyle: "scrapbook" }));

  expect(response).toBeDefined();
  expect(response!.status).toBe(400);
  expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
});

it("persists a valid calendar style for the authenticated user", async () => {
  const response = await PATCH(request({ calendarStyle: "bujo" }));

  expect(response).toBeDefined();
  expect(response!.status).toBe(200);
  expect(prisma.userSettings.upsert).toHaveBeenCalledWith({
    where: { userId: "owner" },
    update: { calendarStyle: "bujo" },
    create: expect.objectContaining({
      userId: "owner",
      calendarStyle: "bujo",
    }),
  });
});
