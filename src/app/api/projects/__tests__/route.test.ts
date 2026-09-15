import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { POST } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      create: jest.fn(),
    },
  },
}));

const postRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.project.create as jest.Mock).mockResolvedValue({
    id: "project-1",
    name: "Garden plans",
    status: "active",
    userId: "owner",
    _count: { tasks: 0 },
  });
});

it("creates a normalized project for the authenticated owner", async () => {
  const response = await POST(
    postRequest({
      name: "  Garden plans  ",
      description: "   ",
      color: "#F4D27D",
      colorSlot: "project-1",
    })
  );

  if (!response) throw new Error("Expected a project response");
  expect(response.status).toBe(201);
  expect(prisma.project.create).toHaveBeenCalledWith({
    data: {
      name: "Garden plans",
      description: undefined,
      color: "#F4D27D",
      colorSlot: "project-1",
      status: "active",
      userId: "owner",
    },
    include: { _count: { select: { tasks: true } } },
  });
});

it("returns a useful error instead of attempting an invalid create", async () => {
  const response = await POST(postRequest({ name: "   " }));

  if (!response) throw new Error("Expected a validation response");
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Project name is required",
  });
  expect(prisma.project.create).not.toHaveBeenCalled();
});
