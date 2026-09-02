import { AutoScheduleSettings } from "@prisma/client";
import { Task } from "@prisma/client";

import { parseSelectedCalendars } from "@/lib/autoSchedule";
import {
  addMinutes,
  areIntervalsOverlapping,
  toZonedTime,
} from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";
import {
  generateCandidateIntervals,
  isWithinWorkingHours,
} from "@/lib/scheduling-windows";
import { type SleepWindow, overlapsSleepHours } from "@/lib/sleep-hours";

import { useSettingsStore } from "@/store/settings";

import { Conflict, TimeSlot } from "@/types/scheduling";

import { CalendarService } from "./CalendarService";
import { SlotScorer } from "./SlotScorer";

// Import the global Prisma instance

const DEFAULT_TASK_DURATION = 30;

export interface TimeSlotManager {
  findAvailableSlots(
    task: Task,
    startDate: Date,
    endDate: Date,
    userId: string
  ): Promise<TimeSlot[]>;

  isSlotAvailable(slot: TimeSlot, userId: string): Promise<boolean>;

  calculateBufferTimes(slot: TimeSlot): {
    beforeBuffer: TimeSlot;
    afterBuffer: TimeSlot;
  };

  updateScheduledTasks(userId: string): Promise<void>;

  addScheduledTaskConflict(task: Task): Promise<void>;
}

export class TimeSlotManagerImpl implements TimeSlotManager {
  private slotScorer: SlotScorer;
  private timeZone: string;
  private scheduledTasksLoaded = false;
  private scheduledTasksLoadPromise?: Promise<void>;

  constructor(
    private settings: AutoScheduleSettings,
    private calendarService: CalendarService,
    timeZone?: string,
    private sleepWindow?: SleepWindow
  ) {
    // On the server the settings store holds no user state, so callers
    // should pass the user's timezone explicitly (e.g. from UserSettings).
    this.timeZone = timeZone || useSettingsStore.getState().user.timeZone;
    this.slotScorer = new SlotScorer(settings, new Map(), this.timeZone);
  }

  async updateScheduledTasks(userId: string): Promise<void> {
    // Fetch all scheduled tasks
    const scheduledTasks = await prisma.task.findMany({
      where: {
        isAutoScheduled: true,
        scheduledStart: { not: null },
        scheduledEnd: { not: null },
        // Locked tasks keep their slots across runs, so they must count as
        // busy no matter what project they belong to (or none at all);
        // unlocked tasks are about to be rescheduled and must not block
        scheduleLocked: true,
        userId,
      },
    });

    // Update the slot scorer with the latest scheduled tasks
    this.slotScorer.updateScheduledTasks(scheduledTasks);
    this.scheduledTasksLoaded = true;
  }

  private async ensureScheduledTasksLoaded(userId: string) {
    if (this.scheduledTasksLoaded) return;
    if (!this.scheduledTasksLoadPromise) {
      this.scheduledTasksLoadPromise = this.updateScheduledTasks(
        userId
      ).finally(() => {
        this.scheduledTasksLoadPromise = undefined;
      });
    }
    await this.scheduledTasksLoadPromise;
  }

  async findAvailableSlots(
    task: Task,
    startDate: Date,
    endDate: Date,
    userId: string
  ): Promise<TimeSlot[]> {
    // Only load scheduled tasks from the database on the first call
    // For subsequent calls, we'll use the in-memory scheduled tasks
    // that have been updated by addScheduledTaskConflict
    await this.ensureScheduledTasksLoaded(userId);

    // If task has a startDate that is beyond our endDate window, return empty slots
    // These tasks will get picked up in a future scheduling run
    if (task.startDate instanceof Date && task.startDate > endDate) {
      // Skip this task - it will be scheduled in a future run
      return [];
    }

    // If task has a startDate and it's after the provided startDate but within window, use the task's startDate
    const effectiveStartDate =
      task.startDate instanceof Date && task.startDate > startDate
        ? task.startDate
        : startDate;

    // 1. Generate potential slots
    const potentialSlots = this.generatePotentialSlots(
      task.duration || DEFAULT_TASK_DURATION,
      effectiveStartDate,
      endDate
    );

    // 2. Filter by work hours
    const workHourSlots = this.filterByWorkHours(potentialSlots);

    // 3. Check calendar conflicts
    const availableSlots = await this.removeConflicts(workHourSlots, task);

    // 4. Score slots (conflict checks already include the configured buffer)
    const scoredSlots = this.scoreSlots(availableSlots, task);

    // 5. Sort by score
    const sortedSlots = this.sortByScore(scoredSlots);

    return sortedSlots;
  }

  async isSlotAvailable(slot: TimeSlot, userId: string): Promise<boolean> {
    // Check if the slot is within work hours
    if (!this.isWithinWorkHours(slot)) {
      return false;
    }

    // Check for calendar conflicts
    const conflicts = await this.findCalendarConflicts(slot, userId);
    if (conflicts.length > 0) {
      return false;
    }

    // Check for conflicts with in-memory scheduled tasks
    if (this.hasInMemoryConflict(slot)) {
      return false;
    }

    return true;
  }

  calculateBufferTimes(slot: TimeSlot): {
    beforeBuffer: TimeSlot;
    afterBuffer: TimeSlot;
  } {
    const bufferMinutes = this.settings.bufferMinutes;

    return {
      beforeBuffer: {
        start: addMinutes(slot.start, -bufferMinutes),
        end: slot.start,
        score: 0,
        conflicts: [],
        energyLevel: null,
        isWithinWorkHours: this.isWithinWorkHours({
          start: addMinutes(slot.start, -bufferMinutes),
          end: slot.start,
          score: 0,
          conflicts: [],
          energyLevel: null,
          isWithinWorkHours: false,
          hasBufferTime: false,
        }),
        hasBufferTime: false,
      },
      afterBuffer: {
        start: slot.end,
        end: addMinutes(slot.end, bufferMinutes),
        score: 0,
        conflicts: [],
        energyLevel: null,
        isWithinWorkHours: this.isWithinWorkHours({
          start: slot.end,
          end: addMinutes(slot.end, bufferMinutes),
          score: 0,
          conflicts: [],
          energyLevel: null,
          isWithinWorkHours: false,
          hasBufferTime: false,
        }),
        hasBufferTime: false,
      },
    };
  }

  /**
   * Generates potential time slots for task scheduling.
   *
   * Starts no earlier than the requested window or 15 minutes from now,
   * rounds to a 30-minute grid, and never lets a task extend past the window.
   * Workday, work-hour, sleep, and conflict filtering happen afterward.
   *
   * @param duration - Duration of the task in minutes
   * @param startDate - UTC date to start generating slots from
   * @param endDate - UTC date to stop generating slots at
   * @returns Array of potential time slots
   */
  private generatePotentialSlots(
    duration: number,
    startDate: Date,
    endDate: Date
  ): TimeSlot[] {
    const MINIMUM_BUFFER_MINUTES = 15;

    return generateCandidateIntervals({
      durationMinutes: duration,
      startDate,
      endDate,
      timeZone: this.timeZone,
      minimumLeadMinutes: MINIMUM_BUFFER_MINUTES,
    }).map(
      (interval): TimeSlot => ({
        start: interval.start,
        end: interval.end,
        score: 0,
        conflicts: [],
        energyLevel: null,
        isWithinWorkHours: false,
        hasBufferTime: false,
      })
    );
  }

  private filterByWorkHours(slots: TimeSlot[]): TimeSlot[] {
    const filteredSlots = slots.filter((slot) => {
      // Convert UTC to local time for comparison
      const localStart = toZonedTime(slot.start, this.timeZone);
      const localEnd = toZonedTime(slot.end, this.timeZone);

      const result =
        isWithinWorkingHours(localStart, localEnd, this.settings) &&
        !overlapsSleepHours(localStart, localEnd, this.sleepWindow);
      if (result) {
        slot.isWithinWorkHours = true;
      }
      return result;
    });

    return filteredSlots;
  }

  private isWithinWorkHours(slot: TimeSlot): boolean {
    const localStart = toZonedTime(slot.start, this.timeZone);
    const localEnd = toZonedTime(slot.end, this.timeZone);

    if (overlapsSleepHours(localStart, localEnd, this.sleepWindow)) {
      return false;
    }
    return isWithinWorkingHours(localStart, localEnd, this.settings);
  }

  private async findCalendarConflicts(
    slot: TimeSlot,
    userId: string
  ): Promise<Conflict[]> {
    const selectedCalendars = parseSelectedCalendars(
      this.settings.selectedCalendars
    );
    // Only check for conflicts if calendars are selected
    if (selectedCalendars.length === 0) {
      return [];
    }

    return this.calendarService.findConflicts(slot, selectedCalendars, userId);
  }

  private hasInMemoryConflict(slot: TimeSlot): boolean {
    // Check all project tasks for conflicts
    for (const [, projectTasks] of this.slotScorer
      .getScheduledTasks()
      .entries()) {
      for (const projectTask of projectTasks) {
        if (
          areIntervalsOverlapping(
            { start: slot.start, end: slot.end },
            { start: projectTask.start, end: projectTask.end }
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }

  private async removeConflicts(
    slots: TimeSlot[],
    task: Task
  ): Promise<TimeSlot[]> {
    const availableSlots: TimeSlot[] = [];
    const selectedCalendars = parseSelectedCalendars(
      this.settings.selectedCalendars
    );

    // Prepare slots for batch checking
    const bufferMinutes = Math.max(0, this.settings.bufferMinutes);
    const slotsToCheck = slots.map((slot) => ({
      slot: {
        ...slot,
        start: addMinutes(slot.start, -bufferMinutes),
        end: addMinutes(slot.end, bufferMinutes),
      },
      taskId: task.id,
    }));

    // Batch check conflicts
    const batchResults = await this.calendarService.findBatchConflicts(
      slotsToCheck,
      selectedCalendars,
      task.userId || "",
      task.id
    );

    // Process results and check for conflicts with in-memory scheduled tasks
    for (const [index, result] of batchResults.entries()) {
      // Add null check to prevent "Cannot read properties of undefined (reading 'slot')"
      if (!result || !result.slot) {
        continue;
      }

      if (result.conflicts.length === 0) {
        // Check for conflicts with in-memory scheduled tasks
        if (!this.hasInMemoryConflict(result.slot)) {
          const originalSlot = slots[index];
          originalSlot.hasBufferTime = true;
          availableSlots.push(originalSlot);
        }
      } else {
        result.slot.conflicts = result.conflicts;
      }
    }

    return availableSlots;
  }

  private scoreSlots(slots: TimeSlot[], task: Task): TimeSlot[] {
    return slots.map((slot) => {
      const score = this.slotScorer.scoreSlot(slot, task);
      return {
        ...slot,
        score: score.total,
      };
    });
  }

  private sortByScore(slots: TimeSlot[]): TimeSlot[] {
    return [...slots].sort((a, b) => b.score - a.score);
  }

  async addScheduledTaskConflict(task: Task): Promise<void> {
    if (task.scheduledStart && task.scheduledEnd) {
      // Add this task to the list of scheduled tasks
      // This will make it show up as a conflict for future slot checks
      const projectId = task.projectId || "none";
      const projectTasks =
        this.slotScorer.getScheduledTasks().get(projectId) || [];
      projectTasks.push({
        start: task.scheduledStart,
        end: task.scheduledEnd,
      });
      this.slotScorer.getScheduledTasks().set(projectId, projectTasks);
    }
  }
}
