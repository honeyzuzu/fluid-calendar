import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { DELETE, PATCH } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/logger", () => ({ logger: { error: jest.fn() } }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    calendarSticker: {
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

const context = { params: Promise.resolve({ id: "sticker-1" }) };

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.calendarSticker.updateMany as jest.Mock).mockResolvedValue({
    count: 1,
  });
  (prisma.calendarSticker.deleteMany as jest.Mock).mockResolvedValue({
    count: 1,
  });
  (prisma.calendarSticker.findFirst as jest.Mock).mockResolvedValue({
    id: "sticker-1",
  });
});

it("updates through an owner-scoped compare and returns the saved sticker", async () => {
  const response = await PATCH(
    new NextRequest("http://localhost/api/calendar-stickers/sticker-1", {
      method: "PATCH",
      body: JSON.stringify({ x: 0.75, rotation: 12 }),
    }),
    context
  );
  expect(response).toBeDefined();
  if (!response) throw new Error("Expected an API response");
  expect(response.status).toBe(200);
  expect(prisma.calendarSticker.updateMany).toHaveBeenCalledWith({
    where: { id: "sticker-1", userId: "owner" },
    data: { x: 0.75, rotation: 12 },
  });
  expect(prisma.calendarSticker.findFirst).toHaveBeenCalledWith({
    where: { id: "sticker-1", userId: "owner" },
  });
});

it("never deletes another user's sticker", async () => {
  (prisma.calendarSticker.deleteMany as jest.Mock).mockResolvedValue({
    count: 0,
  });
  const response = await DELETE(
    new NextRequest("http://localhost/api/calendar-stickers/sticker-1", {
      method: "DELETE",
    }),
    context
  );
  expect(response).toBeDefined();
  if (!response) throw new Error("Expected an API response");
  expect(response.status).toBe(404);
  expect(prisma.calendarSticker.deleteMany).toHaveBeenCalledWith({
    where: { id: "sticker-1", userId: "owner" },
  });
});
