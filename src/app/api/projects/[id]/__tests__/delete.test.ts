import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { DELETE } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/logger", () => ({ logger: { error: jest.fn() } }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const tx = {
  project: { findFirst: jest.fn(), create: jest.fn(), delete: jest.fn() },
  task: { updateMany: jest.fn(), deleteMany: jest.fn() },
};

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.project.findUnique as jest.Mock).mockResolvedValue({
    id: "work",
    _count: { tasks: 2 },
  });
  (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
    callback(tx)
  );
});

async function removeProject() {
  const response = await DELETE(
    new NextRequest("http://localhost/api/projects/work", { method: "DELETE" }),
    { params: Promise.resolve({ id: "work" }) }
  );
  if (!response) throw new Error("Expected a delete response");
  return response;
}

it("moves owned tasks to General before deleting their project", async () => {
  tx.project.findFirst.mockResolvedValueOnce({
    id: "general",
    name: "General",
  });

  const response = await removeProject();

  expect(response.status).toBe(200);
  expect(tx.task.updateMany).toHaveBeenCalledWith({
    where: { projectId: "work", userId: "owner" },
    data: { projectId: "general" },
  });
  expect(tx.task.deleteMany).not.toHaveBeenCalled();
  expect(tx.project.delete).toHaveBeenCalledWith({
    where: { id: "work", userId: "owner" },
  });
  await expect(response.json()).resolves.toMatchObject({
    movedTasks: 2,
    destination: "General",
  });
});

it("creates a safe destination when deleting the last project with tasks", async () => {
  tx.project.findFirst.mockResolvedValue(null);
  tx.project.create.mockResolvedValue({ id: "unsorted", name: "Unsorted" });

  const response = await removeProject();

  expect(response.status).toBe(200);
  expect(tx.project.create).toHaveBeenCalledWith({
    data: { userId: "owner", name: "Unsorted", status: "active" },
    select: { id: true, name: true },
  });
  expect(tx.task.updateMany).toHaveBeenCalledWith({
    where: { projectId: "work", userId: "owner" },
    data: { projectId: "unsorted" },
  });
});
