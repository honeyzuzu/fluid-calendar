import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { PUT } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    task: { findUnique: jest.fn(), update: jest.fn() },
  },
}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("@/lib/task-block-push", () => ({
  schedulePushTaskBlock: jest.fn(),
  deleteTaskBlockEvent: jest.fn(),
}));
jest.mock("@/lib/task-sync/task-change-tracker", () => ({
  TaskChangeTracker: jest.fn(),
}));

const updateTask = prisma.task.update as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "user-1" });
  (prisma.task.findUnique as jest.Mock).mockResolvedValue({
    id: "task-1",
    userId: "user-1",
    status: "todo",
    tags: [],
  });
  updateTask.mockImplementation(async ({ data }) => ({
    id: "task-1",
    ...data,
  }));
});

async function save(body: Record<string, unknown>) {
  const response = await PUT(
    new NextRequest("http://localhost/api/tasks/task-1", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
    { params: Promise.resolve({ id: "task-1" }) }
  );
  if (!response) throw new Error("Expected a task update response");
  return response;
}

it("validates week selection and protects completion and rollover metadata", async () => {
  expect((await save({ plannedWeekStart: "2026-09-08" })).status).toBe(400);
  expect(
    (
      await save({
        plannedWeekStart: "2026-09-13",
        rolloverCount: 999,
        completedAt: "2001-01-01",
      })
    ).status
  ).toBe(200);
  expect(updateTask).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        plannedWeekStart: new Date("2026-09-13T00:00:00Z"),
        rolloverCount: 0,
        scheduledStart: null,
        scheduledEnd: null,
      }),
    })
  );
  expect(updateTask.mock.calls[0][0].data.completedAt).toBeUndefined();
});

it("clears completion time when undoing and preserves locked calendar placement on reassignment", async () => {
  (prisma.task.findUnique as jest.Mock).mockResolvedValue({
    id: "task-1",
    userId: "user-1",
    status: "completed",
    scheduleLocked: true,
    plannedWeekStart: new Date("2026-09-06T00:00:00Z"),
    tags: [],
  });
  expect(
    (await save({ status: "todo", plannedWeekStart: "2026-09-13" })).status
  ).toBe(200);
  const data = updateTask.mock.calls[0][0].data;
  expect(data.completedAt).toBeNull();
  expect(data.scheduledStart).toBeUndefined();
  expect(data.scheduleLocked).toBeUndefined();
});

it("saves the Tune-up payload with a Prisma-compatible due date", async () => {
  const response = await save({
    status: "todo",
    duration: 30,
    priority: "low",
    energyLevel: "medium",
    dueDate: "2026-09-20",
  });
  expect(response.status).toBe(200);
  expect(updateTask).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: "task-1", userId: "user-1" },
      data: expect.objectContaining({
        dueDate: new Date("2026-09-20T00:00:00Z"),
      }),
    })
  );
  expect((await response.json()).dueDate).toBe("2026-09-20T00:00:00.000Z");
});

it.each(["dueDate", "startDate"])(
  "rejects invalid %s before writing",
  async (field) => {
    const response = await save({ [field]: "invalid" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: `Invalid ${field}` });
    expect(updateTask).not.toHaveBeenCalled();
  }
);

it("preserves timestamp instants and explicit date clearing", async () => {
  const response = await save({
    startDate: "2026-09-20T09:00:00-04:00",
    dueDate: null,
  });
  expect(response.status).toBe(200);
  expect(updateTask.mock.calls[0][0].data).toEqual(
    expect.objectContaining({
      startDate: new Date("2026-09-20T13:00:00Z"),
      dueDate: null,
    })
  );
});

it("leaves dates untouched when omitted", async () => {
  expect((await save({ duration: 30 })).status).toBe(200);
  expect(updateTask.mock.calls[0][0].data).not.toHaveProperty("dueDate");
  expect(updateTask.mock.calls[0][0].data).not.toHaveProperty("startDate");
});
