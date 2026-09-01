"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Sparkles } from "lucide-react";
import { BsKanban, BsListTask } from "react-icons/bs";
import { toast } from "sonner";

import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { BoardView } from "@/components/tasks/BoardView/BoardView";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { cn } from "@/lib/utils";

import { useProjectStore } from "@/store/project";
import { useTaskStore } from "@/store/task";
import { useTaskModalStore } from "@/store/taskModal";
import { useTaskPageSettings } from "@/store/taskPageSettings";

import { NewTask, Task, TaskStatus } from "@/types/task";

export default function TasksPage() {
  const {
    tasks,
    tags,
    loading,
    error,
    fetchTasks,
    fetchTags,
    createTask,
    updateTask,
    deleteTask,
    createTag,
    scheduleAllTasks,
  } = useTaskStore();
  const { fetchProjects, activeProject } = useProjectStore();
  const { viewMode, setViewMode } = useTaskPageSettings();
  const { isOpen, setOpen } = useTaskModalStore();

  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [initialProjectId, setInitialProjectId] = useState<
    string | null | undefined
  >(undefined);

  // Fetch tasks and tags on mount
  useEffect(() => {
    fetchTasks();
    fetchTags();
    fetchProjects();
  }, [fetchTasks, fetchTags, fetchProjects]);

  const handleCreateTask = async (task: NewTask) => {
    await createTask(task);
    await fetchTasks();
    await fetchProjects();
  };

  const handleUpdateTask = async (task: NewTask) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, task);
      await fetchTasks();
      await fetchProjects();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
      await fetchTasks();
      await fetchProjects();
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status });
    await fetchTasks();
    await fetchProjects();
  };

  const handleCreateTag = async (name: string, color?: string) => {
    try {
      const newTag = await createTag({ name, color });
      await fetchTags(); // Refresh tags after creation
      return newTag;
    } catch (error) {
      console.error("Error creating tag:", error);
      throw error;
    }
  };

  const handleInlineEdit = async (task: Task) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, tags, createdAt, updatedAt, project, ...updates } = task;
    console.log("Updating task:", { id, updates });
    try {
      await updateTask(id, updates);
      await fetchTasks();
      // If projectId was changed, refresh projects to update task counts
      if ("projectId" in updates) {
        await fetchProjects();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task", {
        description: "Please try again later.",
      });
    }
  };

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

  return (
    <div className="flex h-full bg-[#fff9e8]">
      <ProjectSidebar />
      <div className="flex min-w-0 flex-1 flex-col" data-task-page>
        <div className="border-b border-[#dfe2c8] bg-[#fffdf5]/75 px-6 py-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d0902f]">
                  Little things, lovingly planned
                </p>
                <h1 className="text-2xl font-bold tracking-[-0.04em] text-foreground">
                  Tasks
                </h1>
                <p
                  id="auto-schedule-description"
                  className="mt-1 max-w-xl text-xs text-muted-foreground"
                >
                  Auto-schedule fits opted-in tasks into free time during the
                  next 7 days.
                  <Link
                    href="/settings#auto-schedule"
                    className="ml-1 font-medium text-primary hover:underline"
                  >
                    Adjust its rules.
                  </Link>
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex items-center gap-2 rounded-md p-2 text-sm font-medium",
                    viewMode === "list"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BsListTask className="h-4 w-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode("board")}
                  className={cn(
                    "flex items-center gap-2 rounded-md p-2 text-sm font-medium",
                    viewMode === "board"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BsKanban className="h-4 w-4" />
                  Board
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="group relative">
                <Button
                  variant="secondary"
                  onClick={handleAutoSchedule}
                  aria-describedby="auto-schedule-description auto-schedule-tooltip"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Auto-schedule tasks
                </Button>
                <div
                  id="auto-schedule-tooltip"
                  role="tooltip"
                  className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-[#dfe2c8] bg-[#fffdf5] p-3 text-xs leading-relaxed text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  Sunnie schedules only unfinished tasks with Auto-Schedule
                  turned on. It avoids conflicts, respects your working hours,
                  and uses duration, priority, energy, and preferred time to
                  choose a spot.
                </div>
              </div>
              <Button
                data-create-task-button
                onClick={() => {
                  setSelectedTask(undefined);
                  // Set initial project ID based on active project
                  // If viewing "No Project", set to null
                  // If viewing a specific project, set to that project's ID
                  // Otherwise, don't set an initial project (undefined)
                  const projectId = activeProject
                    ? activeProject.id === "no-project"
                      ? null
                      : activeProject.id
                    : undefined;
                  setInitialProjectId(projectId);
                  setOpen(true);
                }}
              >
                Create Task
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          {viewMode === "list" ? (
            <TaskList
              tasks={tasks}
              onEdit={(task) => {
                setSelectedTask(task);
                setOpen(true);
              }}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
              onInlineEdit={handleInlineEdit}
            />
          ) : (
            <BoardView
              tasks={tasks}
              onEdit={(task) => {
                setSelectedTask(task);
                setOpen(true);
              }}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>

        <TaskModal
          isOpen={isOpen}
          onClose={() => {
            setOpen(false);
            setSelectedTask(undefined);
            setInitialProjectId(undefined);
          }}
          onSave={selectedTask ? handleUpdateTask : handleCreateTask}
          task={selectedTask}
          tags={tags}
          onCreateTag={handleCreateTag}
          initialProjectId={initialProjectId}
        />

        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="rounded-lg border bg-background p-4 shadow-lg">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
