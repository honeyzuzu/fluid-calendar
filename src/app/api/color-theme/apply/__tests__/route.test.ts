import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { POST } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    userSettings: { upsert: jest.fn() },
  },
}));

function request(colorTheme: unknown) {
  return new NextRequest("http://localhost/api/color-theme/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ colorTheme }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: "admin" });
  (prisma.userSettings.upsert as jest.Mock).mockResolvedValue({
    userId: "owner",
    colorTheme: "spring-fresh-air",
  });
});

it("requires authentication", async () => {
  (authenticateRequest as jest.Mock).mockResolvedValue({
    response: NextResponse.json({}, { status: 401 }),
  });
  const response = await POST(request("spring-fresh-air"));
  expect(response).toBeDefined();
  expect(response!.status).toBe(401);
  expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
});

it("rejects unknown colorways", async () => {
  const response = await POST(request("neon"));
  expect(response).toBeDefined();
  expect(response!.status).toBe(400);
  expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
});

it("changes only the authenticated user's selected colorway", async () => {
  const response = await POST(request("spring-fresh-air"));
  expect(response).toBeDefined();
  expect(response!.status).toBe(200);
  expect(prisma.userSettings.upsert).toHaveBeenCalledWith({
    where: { userId: "owner" },
    update: { colorTheme: "spring-fresh-air" },
    create: expect.objectContaining({
      userId: "owner",
      colorTheme: "spring-fresh-air",
    }),
  });
});

it("keeps regular users on Sunnie Base", async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: "user" });
  const response = await POST(request("spring-fresh-air"));
  expect(response?.status).toBe(403);
  expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
});
