import { NextRequest, NextResponse } from "next/server";

import { scheduleAllTasksForUser } from "@/services/scheduling/TaskSchedulingService";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { repushDirtyBlocks } from "@/lib/task-block-push";

const LOG_SOURCE = "task-schedule-route";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    const body = await request.json().catch(() => ({}));
    const taskIds = Array.isArray(body.taskIds)
      ? body.taskIds.filter(
          (id: unknown): id is string => typeof id === "string"
        )
      : undefined;
    const rangeStart = body.rangeStart ? new Date(body.rangeStart) : undefined;
    const rangeEnd = body.rangeEnd ? new Date(body.rangeEnd) : undefined;

    if (
      (rangeStart && Number.isNaN(rangeStart.getTime())) ||
      (rangeEnd && Number.isNaN(rangeEnd.getTime())) ||
      ((rangeStart || rangeEnd) && !(rangeStart && rangeEnd)) ||
      (rangeStart && rangeEnd && rangeEnd <= rangeStart)
    ) {
      return NextResponse.json(
        { error: "Invalid scheduling window" },
        { status: 400 }
      );
    }

    const tasksWithRelations = await scheduleAllTasksForUser(userId, {
      taskIds,
      rangeStart,
      rangeEnd,
    });

    // Repush dirty blocks and newly scheduled tasks to calendar
    await repushDirtyBlocks(userId);

    return NextResponse.json(tasksWithRelations);
  } catch (error) {
    logger.error(
      "Error scheduling tasks:",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to schedule tasks" },
      { status: 500 }
    );
  }
}
