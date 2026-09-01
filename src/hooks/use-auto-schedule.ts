"use client";

import { toast } from "sonner";

import { useTaskStore } from "@/store/task";

import { TaskStatus } from "@/types/task";

export function useAutoSchedule() {
  const tasks = useTaskStore((state) => state.tasks);
  const scheduleAllTasks = useTaskStore((state) => state.scheduleAllTasks);

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
          "Open a task, turn on Auto-Schedule, and leave Lock Schedule off.",
      });
      return;
    }

    try {
      const updatedTasks = await scheduleAllTasks();
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
      const taskLabel = scheduledCount === 1 ? "task" : "tasks";
      toast.success(
        scheduledCount + " " + taskLabel + " placed on your calendar",
        {
          description:
            unscheduledCount > 0
              ? unscheduledCount +
                " couldn’t fit into your available time in the next 7 days."
              : "You can see the new time blocks on the Calendar page.",
        }
      );
    } catch {
      toast.error("Auto-scheduling failed", {
        description: "Please try again or review your Auto-Schedule Settings.",
      });
    }
  };

  return handleAutoSchedule;
}
