import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { GET, PATCH } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    userSettings: { upsert: jest.fn(), findUnique: jest.fn() },
  },
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
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: "user" });
  (prisma.userSettings.upsert as jest.Mock).mockResolvedValue({
    userId: "owner",
    calendarStyle: "bujo",
  });
});

it("shows Sunnie Base to regular users without erasing their saved choice", async () => {
  (prisma.userSettings.upsert as jest.Mock).mockResolvedValue({
    userId: "owner",
    colorTheme: "spring-fresh-air",
  });
  const response = await GET(request({}));
  expect(response?.status).toBe(200);
  expect((await response!.json()).colorTheme).toBe("base");
  expect(prisma.userSettings.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ update: {} })
  );
});

it("loads settings created by a simultaneous first request", async () => {
  (prisma.userSettings.upsert as jest.Mock).mockRejectedValue({
    code: "P2002",
  });
  (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
    userId: "owner",
    colorTheme: "base",
  });
  const response = await GET(request({}));
  expect(response?.status).toBe(200);
  expect(prisma.userSettings.findUnique).toHaveBeenCalledWith({
    where: { userId: "owner" },
  });
});

it("rejects seasonal colorways through the general settings route", async () => {
  const response = await PATCH(request({ colorTheme: "spring-fresh-air" }));
  expect(response?.status).toBe(403);
  expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
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

it("rejects an unknown motion preference", async () => {
  const response = await PATCH(request({ motionPreference: "extra-bouncy" }));

  expect(response).toBeDefined();
  expect(response!.status).toBe(400);
  expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
});

it("persists a valid motion preference for the authenticated user", async () => {
  const response = await PATCH(request({ motionPreference: "reduced" }));

  expect(response).toBeDefined();
  expect(response!.status).toBe(200);
  expect(prisma.userSettings.upsert).toHaveBeenCalledWith({
    where: { userId: "owner" },
    update: { motionPreference: "reduced" },
    create: expect.objectContaining({
      userId: "owner",
      motionPreference: "reduced",
    }),
  });
});
