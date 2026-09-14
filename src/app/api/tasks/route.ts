import { NextRequest, NextResponse } from "next/server";

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { RRule } from "rrule";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { newDate } from "@/lib/date-utils";
import { logger } from "@/lib/logger";
import { parseWeek } from "@/lib/planning-week";
import { prisma } from "@/lib/prisma";
import { schedulePushTaskBlock } from "@/lib/task-block-push";
import { isValidTaskColor, isValidTaskColorSlot } from "@/lib/task-colors";
import {
  pickMutableTaskFields,
  validateTaskRelations,
} from "@/lib/task-relations";
import {
  ChangeType,
  TaskChangeTracker,
} from "@/lib/task-sync/task-change-tracker";
import { normalizeRecurrenceRule } from "@/lib/utils/normalize-recurrence-rules";
import { planningTimeZone, rollUnfinishedTasks } from "@/lib/weekly-planning";

import { EnergyLevel, TaskStatus, TimePreference } from "@/types/task";

const LOG_SOURCE = "tasks-route";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.getAll("status") as TaskStatus[];
    const tagIds = searchParams.getAll("tagIds");
    const energyLevel = searchParams.getAll("energyLevel") as EnergyLevel[];
    const timePreference = searchParams.getAll(
      "timePreference"
    ) as TimePreference[];
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const taskStartDate = searchParams.get("taskStartDate");
    const hideUpcomingTasks = searchParams.get("hideUpcomingTasks") === "true";

    const now = newDate();
    const timeZone = await planningTimeZone(userId);
    await rollUnfinishedTasks(userId, timeZone, now);
    const today = fromZonedTime(
      `${formatInTimeZone(now, timeZone, "yyyy-MM-dd")}T00:00:00`,
      timeZone
    );
    const tasks = await prisma.task.findMany({
      where: {
        // Filter by the current user's ID
        userId,
        AND: [
          {
            OR: [
              { status: { not: "completed" } },
              { completedAt: { gte: today } },
            ],
          },
        ],
        ...(status.length > 0 && { status: { in: status } }),
        ...(energyLevel.length > 0 && { energyLevel: { in: energyLevel } }),
        ...(timePreference.length > 0 && {
          preferredTime: { in: timePreference },
        }),
        ...(tagIds.length > 0 && { tags: { some: { id: { in: tagIds } } } }),
        ...(search && {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
          ],
        }),
        ...(startDate &&
          endDate && {
            dueDate: {
              gte: newDate(startDate),
              lte: newDate(endDate),
            },
          }),
        ...(taskStartDate && {
          startDate: {
            gte: newDate(taskStartDate),
          },
        }),
        ...(hideUpcomingTasks && {
          OR: [{ startDate: null }, { startDate: { lte: now } }],
        }),
      },
      include: {
        tags: true,
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    logger.error(
      "Error fetching tasks:",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      LOG_SOURCE
    );
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    const json = (await request.json()) as Record<string, unknown>;
    const tagIds = Array.isArray(json.tagIds)
      ? [...new Set(json.tagIds)]
      : json.tagIds;
    const projectId = json.projectId;
    const taskData = pickMutableTaskFields(json);
    const recurrenceRule = taskData.recurrenceRule;
    const relationError = await validateTaskRelations(userId, {
      projectId,
      tagIds,
    });
    if (relationError) {
      return NextResponse.json({ error: relationError }, { status: 400 });
    }
    if (
      typeof taskData.title !== "string" ||
      !taskData.title.trim() ||
      typeof taskData.status !== "string"
    ) {
      return NextResponse.json(
        { error: "Task title and status are required" },
        { status: 400 }
      );
    }
    if (
      !isValidTaskColor(taskData.color) ||
      !isValidTaskColorSlot(taskData.colorSlot)
    ) {
      return NextResponse.json(
        { error: "Choose a valid task color" },
        { status: 400 }
      );
    }
    taskData.completedAt = taskData.status === "completed" ? newDate() : null;
    if (
      taskData.plannedWeekStart !== undefined &&
      taskData.plannedWeekStart !== null
    ) {
      const week = parseWeek(taskData.plannedWeekStart);
      if (!week)
        return NextResponse.json(
          { error: "Choose a valid week" },
          { status: 400 }
        );
      taskData.plannedWeekStart = week;
    }

    // Normalize and validate recurrence rule if provided
    const standardizedRecurrenceRule = recurrenceRule
      ? normalizeRecurrenceRule(recurrenceRule)
      : undefined;

    if (standardizedRecurrenceRule) {
      try {
        // Attempt to parse the standardized RRule string to validate it
        RRule.fromString(standardizedRecurrenceRule);
      } catch (error) {
        logger.error(
          "Error parsing recurrence rule:",
          {
            error: error instanceof Error ? error.message : String(error),
          },
          LOG_SOURCE
        );
        return new NextResponse("Invalid recurrence rule", { status: 400 });
      }
    }

    // Find the project's task mapping if it exists
    let mappingId = null;
    if (typeof projectId === "string") {
      const mapping = await prisma.taskListMapping.findFirst({
        where: {
          projectId,
          project: { userId },
        },
      });
      if (mapping) {
        mappingId = mapping.id;
      }
    }

    const task = await prisma.task.create({
      data: {
        ...taskData,
        title: taskData.title.trim(),
        status: taskData.status,
        projectId: typeof projectId === "string" ? projectId : null,
        // Associate the task with the current user
        userId,
        // Tasks participate in auto-scheduling unless explicitly opted out.
        isAutoScheduled: taskData.isAutoScheduled ?? true,
        isRecurring: !!recurrenceRule,
        recurrenceRule: standardizedRecurrenceRule,
        ...(Array.isArray(tagIds) && {
          tags: {
            connect: tagIds.map((id) => ({ id: id as string })),
          },
        }),
      },
      include: {
        tags: true,
        project: true,
      },
    });

    // Track the creation for sync purposes if the task is in a mapped project
    if (mappingId) {
      const changeTracker = new TaskChangeTracker();
      await changeTracker.trackChange(
        task.id,
        "CREATE" as ChangeType,
        userId,
        { task },
        undefined, // providerId will be determined later during sync
        mappingId
      );

      logger.info(
        `Tracked CREATE change for task ${task.id} in mapping ${mappingId}`,
        {
          taskId: task.id,
          mappingId,
        },
        LOG_SOURCE
      );
    }

    // Schedule calendar block push if task has scheduled times
    if (task.scheduledStart && task.scheduledEnd) {
      schedulePushTaskBlock(userId, task.id);
    }

    return NextResponse.json(task);
  } catch (error) {
    logger.error(
      "Error creating task:",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      LOG_SOURCE
    );
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
