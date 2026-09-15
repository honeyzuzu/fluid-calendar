"use client";

import { toast } from "sonner";

import {
  collectScheduleChanges,
  formatScheduleSummary,
  restoreScheduleChanges,
} from "@/lib/schedule-feedback";

import { useSettingsStore } from "@/store/settings";
import { useTaskStore } from "@/store/task";

import { TaskStatus } from "@/types/task";

export function useAutoSchedule() {
  const tasks = useTaskStore((state) => state.tasks);
  const scheduleAllTasks = useTaskStore((state) => state.scheduleAllTasks);
  const userSettings = useSettingsStore((state) => state.user);

  const handleAutoSchedule = async () => {
    const eligibleTasks = tasks.filter(
      (task) =>
        task.isAutoScheduled &&
        !task.scheduleLocked &&
        task.status !== TaskStatus.COMPLETED &&
        task.status !== TaskStatus.IN_PROGRESS
    );

    if (eligibleTasks.length === 0) {
      toast.info("Nothing is ready to auto-schedule", {
        description:
          "Create an unfinished task, or open one and make sure Auto-Schedule is on and Lock Schedule is off.",
      });
      return;
    }

    try {
      const updatedTasks = await scheduleAllTasks();
      const changes = collectScheduleChanges(eligibleTasks, updatedTasks);
      const eligibleIds = new Set(eligibleTasks.map((task) => task.id));
      const scheduledCount = updatedTasks.filter(
        (task) =>
          eligibleIds.has(task.id) && task.scheduledStart && task.scheduledEnd
      ).length;

      if (scheduledCount === 0) {
        toast.info("Sunnie couldn’t find an open time", {
          description:
            "It checked the next 7 days. Try widening your hours or calendars in Auto-Schedule Settings.",
        });
        return;
      }

      const unscheduledCount = eligibleTasks.length - scheduledCount;
      if (changes.length === 0) {
        toast.info("Your current schedule already fits", {
          description: formatScheduleSummary(
            changes,
            userSettings.timeZone,
            userSettings.timeFormat,
            "Next 7 days"
          ),
        });
        return;
      }

      const taskLabel = changes.length === 1 ? "task" : "tasks";
      toast.success(changes.length + " " + taskLabel + " scheduled", {
        description: `${formatScheduleSummary(
          changes,
          userSettings.timeZone,
          userSettings.timeFormat,
          "Next 7 days"
        )}${
          unscheduledCount > 0
            ? ` ${unscheduledCount} couldn’t fit this time.`
            : ""
        }`,
        action: {
          label: "Undo",
          onClick: () => {
            void restoreScheduleChanges(changes)
              .then((restoredCount) => {
                void useTaskStore.getState().fetchTasks();
                if (restoredCount === changes.length) {
                  toast.success("Schedule restored");
                } else {
                  toast.info("Some newer changes were kept", {
                    description:
                      "Sunnie restored only the blocks that had not changed since scheduling.",
                  });
                }
              })
              .catch(() =>
                toast.error("Sunnie couldn't restore that schedule")
              );
          },
        },
      });
    } catch (error) {
      toast.error("Auto-scheduling failed", {
        description:
          error instanceof Error
            ? error.message
            : "Your tasks are safe. Please try again or review Auto-Schedule Settings.",
      });
    }
  };

  return handleAutoSchedule;
}
