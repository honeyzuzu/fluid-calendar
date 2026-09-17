import { parseSelectedCalendars } from "@/lib/autoSchedule";
import { needsBackgroundReschedule } from "@/lib/background-scheduling";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { planningTimeZone, rollUnfinishedTasks } from "@/lib/weekly-planning";

import { ProjectStatus } from "@/types/project";
import {
  EnergyLevel,
  Priority,
  TaskStatus,
  TaskWithRelations,
  TimePreference,
} from "@/types/task";

import { SchedulingService } from "./SchedulingService";

const LOG_SOURCE = "TaskSchedulingService";

export interface ScheduleTasksOptions {
  taskIds?: string[];
  rangeStart?: Date;
  rangeEnd?: Date;
  preserveExisting?: boolean;
}

// Define a type for the database result
type DbTaskWithRelations = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  duration: number | null;
  priority: string | null;
  energyLevel: string | null;
  preferredTime: string | null;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  recurrenceRule: string | null;
  lastCompletedDate: Date | null;
  completedAt: Date | null;
  isRecurring: boolean;
  isAutoScheduled: boolean;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  scheduleScore: number | null;
  lastScheduled: Date | null;
  scheduleLocked: boolean;
  postponedUntil: Date | null;
  userId: string;
  tags: {
    id: string;
    name: string;
    color: string | null;
    userId: string | null;
  }[];
  project: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string | null;
  } | null;
};

/**
 * Convert database task to TaskWithRelations
 */
function convertDbTaskToTaskWithRelations(
  dbTask: DbTaskWithRelations
): TaskWithRelations {
  return {
    ...dbTask,
    status: dbTask.status as TaskStatus,
    priority: dbTask.priority as Priority | null,
    energyLevel: dbTask.energyLevel as EnergyLevel | null,
    preferredTime: dbTask.preferredTime as TimePreference | null,
    tags: dbTask.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color || undefined,
    })),
    project: dbTask.project
      ? {
          ...dbTask.project,
          status: dbTask.project.status as ProjectStatus,
        }
      : null,
  };
}

/**
 * Schedule all tasks for a user
 * @param userId The user ID
 * @returns The updated tasks
 */
export async function scheduleAllTasksForUser(
  userId: string,
  options?: ScheduleTasksOptions
): Promise<TaskWithRelations[]>;

/**
 * Implementation of scheduleAllTasksForUser
 */
export async function scheduleAllTasksForUser(
  userId: string,
  options: ScheduleTasksOptions = {}
): Promise<TaskWithRelations[]> {
  try {
    logger.info("Starting task scheduling for user", { userId }, LOG_SOURCE);

    // If settings are not provided, fetch them from the database
    const userSettings = await prisma.autoScheduleSettings.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        workDays: JSON.stringify([1, 2, 3, 4, 5]),
        workHourStart: 9,
        workHourEnd: 17,
      },
    });

    // Get all tasks marked for auto-scheduling that are not locked
    await rollUnfinishedTasks(userId, await planningTimeZone(userId));
    const eligibleTasks = await prisma.task.findMany({
      where: {
        isAutoScheduled: true,
        scheduleLocked: false,
        status: {
          not: {
            in: [TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS],
          },
        },
        userId,
        ...(options.taskIds && { id: { in: options.taskIds } }),
      },
      include: {
        project: true,
        tags: true,
      },
    });

    let tasksToSchedule = eligibleTasks;
    if (options.preserveExisting) {
      const now = new Date();
      const horizon =
        options.rangeEnd ?? new Date(now.getTime() + 7 * 86_400_000);
      const selectedCalendars = parseSelectedCalendars(
        userSettings.selectedCalendars
      );
      const events = selectedCalendars.length
        ? await prisma.calendarEvent.findMany({
            where: {
              feed: { userId },
              feedId: { in: selectedCalendars },
              start: { lt: horizon },
              end: { gt: now },
            },
            select: {
              start: true,
              end: true,
              allDay: true,
              status: true,
              externalEventId: true,
            },
          })
        : [];
      const pushedBlockIds = new Set(
        (
          await prisma.task.findMany({
            where: { userId, blockEventId: { not: null } },
            select: { blockEventId: true },
          })
        )
          .map((task) => task.blockEventId)
          .filter((id): id is string => Boolean(id))
      );
      tasksToSchedule = eligibleTasks.filter(
        (task) =>
          (!task.scheduledStart || task.scheduledStart < horizon) &&
          needsBackgroundReschedule(
            task,
            now,
            events,
            pushedBlockIds,
            userSettings.bufferMinutes
          )
      );
    }

    // Get locked tasks (we'll keep their schedules)
    const lockedTasks = await prisma.task.findMany({
      where: {
        isAutoScheduled: true,
        scheduleLocked: true,
        status: {
          not: {
            in: [TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS],
          },
        },
        userId,
        ...(options.taskIds && { id: { in: options.taskIds } }),
      },
      include: {
        project: true,
        tags: true,
      },
    });

    logger.info(
      "Found tasks to schedule",
      {
        tasksToScheduleCount: tasksToSchedule.length,
        lockedTasksCount: lockedTasks.length,
      },
      LOG_SOURCE
    );

    // Initialize scheduling service with settings
    const schedulingService = new SchedulingService(
      userSettings,
      options.preserveExisting
    );

    // Clear existing schedules for non-locked tasks
    await prisma.task.updateMany({
      where: {
        id: {
          in: tasksToSchedule.map((task) => task.id),
        },
        userId,
      },
      data: {
        scheduledStart: null,
        scheduledEnd: null,
        scheduleScore: null,
      },
    });

    // Schedule all tasks
    const updatedTasks = await schedulingService.scheduleMultipleTasks(
      [...tasksToSchedule, ...lockedTasks],
      userId,
      options.rangeStart && options.rangeEnd
        ? { start: options.rangeStart, end: options.rangeEnd }
        : undefined
    );

    // Update the lastScheduled timestamp for all tasks
    await prisma.task.updateMany({
      where: {
        id: {
          in: updatedTasks.map((task) => task.id),
        },
      },
      data: {
        lastScheduled: new Date(),
      },
    });

    // Fetch the tasks again with their relations to return
    const dbTasks = (await prisma.task.findMany({
      where: {
        id: {
          in: updatedTasks.map((task) => task.id),
        },
        userId,
      },
      include: {
        tags: true,
        project: true,
      },
    })) as DbTaskWithRelations[];

    // Convert database tasks to TaskWithRelations
    const tasksWithRelations = dbTasks.map(convertDbTaskToTaskWithRelations);

    logger.info(
      "Task scheduling completed successfully",
      { userId, tasksScheduled: updatedTasks.length },
      LOG_SOURCE
    );

    return tasksWithRelations;
  } catch (error) {
    logger.error(
      "Error scheduling tasks",
      {
        error: error instanceof Error ? error.message : String(error),
        userId,
      },
      LOG_SOURCE
    );
    throw error;
  }
}
