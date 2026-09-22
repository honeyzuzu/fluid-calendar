import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

import { PATCH } from "../route";

jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));
jest.mock("@/lib/calendar-db", () => ({ getEvent: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    calendarEvent: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

const recurringInstance = {
  id: "instance-1",
  feedId: "feed-1",
  externalEventId: "provider-instance-1",
  recurringEventId: "provider-series-1",
  masterEventId: "master-1",
  isMaster: false,
  isRecurring: true,
  color: null,
  colorSlot: null,
  feed: { userId: "owner" },
};

function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/events/instance-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "owner" });
  (prisma.calendarEvent.findUnique as jest.Mock).mockResolvedValue(
    recurringInstance
  );
});

it("updates a recurring series color locally without creating provider rows", async () => {
  const response = await PATCH(
    request({ color: "#9BC7D9", colorSlot: "event-1", mode: "series" }),
    { params: Promise.resolve({ id: "instance-1" }) }
  );

  expect(response).toBeDefined();
  expect(response!.status).toBe(200);
  expect(prisma.calendarEvent.updateMany).toHaveBeenCalledWith({
    where: {
      feedId: "feed-1",
      OR: [
        { id: "instance-1" },
        { id: "master-1" },
        { masterEventId: "master-1" },
        { externalEventId: "provider-series-1" },
        { recurringEventId: "provider-series-1" },
      ],
    },
    data: { color: "#9BC7D9", colorSlot: "event-1" },
  });
  expect(prisma.calendarEvent.update).not.toHaveBeenCalled();
});

it("keeps a single-occurrence color override scoped to that row", async () => {
  const response = await PATCH(
    request({ color: "#9BC7D9", colorSlot: null, mode: "single" }),
    { params: Promise.resolve({ id: "instance-1" }) }
  );

  expect(response).toBeDefined();
  expect(response!.status).toBe(200);
  expect(prisma.calendarEvent.update).toHaveBeenCalledWith({
    where: { id: "instance-1" },
    data: { color: "#9BC7D9", colorSlot: null },
  });
  expect(prisma.calendarEvent.updateMany).not.toHaveBeenCalled();
});

it("saves a private event name on one owned row without a provider edit", async () => {
  (prisma.calendarEvent.update as jest.Mock).mockResolvedValue({
    ...recurringInstance,
    titleOverride: "Work planning",
  });
  const response = await PATCH(
    request({ titleOverride: "  Work planning  " }),
    { params: Promise.resolve({ id: "instance-1" }) }
  );

  expect(response!.status).toBe(200);
  expect(prisma.calendarEvent.update).toHaveBeenCalledWith({
    where: { id: "instance-1" },
    data: { titleOverride: "Work planning" },
  });
  expect(prisma.calendarEvent.updateMany).not.toHaveBeenCalled();
});

it("rejects a private name for an event outside the signed-in account", async () => {
  (prisma.calendarEvent.findUnique as jest.Mock).mockResolvedValue({
    ...recurringInstance,
    feed: { userId: "someone-else" },
  });
  const response = await PATCH(request({ titleOverride: "Private" }), {
    params: Promise.resolve({ id: "instance-1" }),
  });
  expect(response!.status).toBe(404);
  expect(prisma.calendarEvent.update).not.toHaveBeenCalled();
});
