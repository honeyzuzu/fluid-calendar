"use client";

import { FormEvent, useEffect, useState } from "react";

import Link from "next/link";

import { Brain, ListTodo, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import {
  MobileProjectPicker,
  ProjectSidebar,
} from "@/components/projects/ProjectSidebar";
import { AutoScheduleTooltip } from "@/components/tasks/AutoScheduleTooltip";
import { TaskCaptureWorkspace } from "@/components/tasks/TaskCaptureWorkspace";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SunnieSkeleton } from "@/components/ui/sunnie";
import { SunnieDeleteDialog } from "@/components/ui/sunnie-delete-dialog";

import { dateKeyInTimeZone } from "@/lib/daily-intention";

import { useAutoSchedule } from "@/hooks/use-auto-schedule";

import { useProjectStore } from "@/store/project";
import { useSettingsStore } from "@/store/settings";
import { useTaskStore } from "@/store/task";
import { useTaskModalStore } from "@/store/taskModal";

import { NewTask, Task, TaskStatus } from "@/types/task";

type TasksWorkspace = "tasks" | "brain-dump" | "tune-up";

const isTasksWorkspace = (value: string | null): value is TasksWorkspace =>
  value === "tasks" || value === "brain-dump" || value === "tune-up";

export default function TasksPage() {
  const {
    tasks,
    tags,
    error,
    schedulingError,
    fetchTasks,
    fetchTags,
    createTask,
    updateTask,
    deleteTask,
    createTag,
  } = useTaskStore();
  const { fetchProjects, activeProject, setActiveProject, projects } =
    useProjectStore();
  const { isOpen, setOpen } = useTaskModalStore();

  const [workspace, setWorkspace] = useState<TasksWorkspace>("tasks");
  const [initialLoading, setInitialLoading] = useState(true);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task>();
  const [initialProjectId, setInitialProjectId] = useState<
    string | null | undefined
  >(undefined);
  const handleAutoSchedule = useAutoSchedule();
  const timeZone = useSettingsStore((state) => state.user.timeZone);
  const todayKey = dateKeyInTimeZone(new Date(), timeZone);
  const completedTodayTasks = tasks.filter(
    (task) =>
      task.status === TaskStatus.COMPLETED &&
      task.completedAt &&
      dateKeyInTimeZone(new Date(task.completedAt), timeZone) === todayKey &&
      (!activeProject ||
        (activeProject.id === "no-project"
          ? !task.projectId
          : task.projectId === activeProject.id))
  );

  // Fetch tasks and tags on mount
  useEffect(() => {
    let active = true;
    setActiveProject(null);
    void Promise.all([fetchTasks(), fetchTags(), fetchProjects()]).finally(
      () => {
        if (active) setInitialLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, [fetchTasks, fetchTags, fetchProjects, setActiveProject]);

  useEffect(() => {
    const requestedView = new URLSearchParams(window.location.search).get(
      "view"
    );
    if (isTasksWorkspace(requestedView)) setWorkspace(requestedView);
  }, []);

  const selectWorkspace = (nextWorkspace: TasksWorkspace) => {
    setWorkspace(nextWorkspace);
    const url = new URL(window.location.href);
    if (nextWorkspace === "tasks") {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", nextWorkspace);
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  };

  const handleCreateTask = async (task: NewTask) => {
    await createTask(task);
    toast.success("Task saved", {
      description: "You can find it in All tasks.",
    });
  };

  const captureTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title || quickSaving) return;
    setQuickSaving(true);
    setQuickError(null);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status: "todo", isAutoScheduled: false }),
      });
      if (!response.ok)
        throw new Error("Sunnie couldn't save that task. Try again.");
      const created = (await response.json()) as Task;
      useTaskStore.setState((state) => ({ tasks: [created, ...state.tasks] }));
      void fetchProjects();
      setQuickTitle("");
      toast.success("Saved to Backlog", {
        description: "Add details whenever you’re ready.",
      });
    } catch (caught) {
      setQuickError(
        caught instanceof Error ? caught.message : "Couldn't save that task."
      );
    } finally {
      setQuickSaving(false);
    }
  };

  const handleUpdateTask = async (task: NewTask) => {
    if (selectedTask) {
      let switchedProject = false;
      if (activeProject && task.projectId !== undefined) {
        const remainsVisible =
          activeProject.id === "no-project"
            ? !task.projectId
            : task.projectId === activeProject.id;
        if (!remainsVisible) {
          setActiveProject(
            projects.find((project) => project.id === task.projectId) || null
          );
          switchedProject = true;
        }
      }
      try {
        await updateTask(selectedTask.id, task);
        toast.success("Task changes saved");
      } catch (error) {
        if (switchedProject) setActiveProject(activeProject);
        throw error;
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTaskPendingDelete(tasks.find((task) => task.id === taskId));
  };

  const confirmDeleteTask = async () => {
    if (!taskPendingDelete) return;

    try {
      await deleteTask(taskPendingDelete.id);
      setTaskPendingDelete(undefined);
    } catch {
      toast.error("Sunnie couldn't delete that task", {
        description: "Your task was restored. Please try again.",
      });
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask(taskId, { status });
      if (status === TaskStatus.COMPLETED) {
        const title = tasks.find((task) => task.id === taskId)?.title;
        toast.success("A sunny step forward ☀️", {
          description: title ? `${title} is complete.` : "Task complete.",
        });
      }
    } catch {
      toast.error("Sunnie couldn't save that change", {
        description: "The task was restored to its previous status.",
      });
    }
  };

  const handleCreateTag = async (name: string, color?: string) => {
    try {
      const newTag = await createTag({ name, color });
      return newTag;
    } catch (error) {
      console.error("Error creating tag:", error);
      throw error;
    }
  };

  return (
    <div className="flex h-full w-full min-w-0 overflow-x-clip bg-background">
      {workspace === "tasks" && <ProjectSidebar />}
      <div className="flex min-w-0 flex-1 flex-col" data-task-page>
        <div className="relative z-30 overflow-visible border-b border-border bg-card/75 px-3 py-3 backdrop-blur-sm sm:px-6 sm:py-4">
          <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-col items-start gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-[-0.04em] text-foreground">
                  Tasks
                </h1>
                {workspace === "tasks" && (
                  <div className="sr-only">
                    <p id="auto-schedule-description">
                      Auto-schedule fits unfinished tasks into free time during
                      the next 7 days. New tasks are included by default.
                    </p>
                  </div>
                )}
              </div>
              <div
                className="grid w-full grid-cols-3 gap-1 rounded-xl border border-border/70 bg-card/60 p-1 sm:w-auto"
                aria-label="Task tools"
              >
                <WorkspaceButton
                  active={workspace === "tasks"}
                  onClick={() => selectWorkspace("tasks")}
                  icon={ListTodo}
                >
                  All tasks
                </WorkspaceButton>
                <WorkspaceButton
                  active={workspace === "brain-dump"}
                  onClick={() => selectWorkspace("brain-dump")}
                  icon={Brain}
                >
                  Capture many
                </WorkspaceButton>
                <WorkspaceButton
                  active={workspace === "tune-up"}
                  onClick={() => selectWorkspace("tune-up")}
                  icon={WandSparkles}
                >
                  Needs details
                </WorkspaceButton>
              </div>
            </div>
            {workspace === "tasks" && (
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <details className="group relative min-w-0 flex-1 sm:flex-none">
                  <summary className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
                    <Sparkles className="h-4 w-4" /> Schedule
                  </summary>
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-lg">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Place eligible tasks around your calendar for the next
                      seven days.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={handleAutoSchedule}
                      aria-describedby="auto-schedule-description auto-schedule-tooltip"
                      className="w-full"
                    >
                      Auto-schedule tasks
                    </Button>
                    <AutoScheduleTooltip id="auto-schedule-tooltip" />
                  </div>
                </details>
                <Button
                  data-create-task-button
                  className="min-w-0 flex-1 sm:flex-none"
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
                  <span className="sm:hidden">New task</span>
                  <span className="hidden sm:inline">Create Task</span>
                </Button>
              </div>
            )}
          </div>

          {workspace === "tasks" && projects.length > 0 && (
            <MobileProjectPicker />
          )}
          {workspace === "tasks" && (
            <div className="mx-auto mt-3 w-full max-w-[1480px]">
              <form
                onSubmit={captureTask}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
              >
                <input
                  value={quickTitle}
                  onChange={(event) => setQuickTitle(event.target.value)}
                  aria-label="Capture a task for later"
                  placeholder="Add a task to your backlog…"
                  className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
                />
                <Button
                  type="submit"
                  disabled={quickSaving || !quickTitle.trim()}
                  size="sm"
                >
                  Add
                </Button>
              </form>
              {quickError && (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  {quickError}
                </p>
              )}
            </div>
          )}
          {workspace === "tasks" && (
            <details className="mx-auto mt-3 w-full max-w-[1480px] rounded-xl border border-border bg-muted px-3 py-2 text-sm">
              <summary className="cursor-pointer font-medium">
                Completed today ({completedTodayTasks.length})
              </summary>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                {completedTodayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="min-w-0 break-words">{task.title}</span>
                    <button
                      className="shrink-0 text-xs underline"
                      onClick={() =>
                        void handleStatusChange(task.id, TaskStatus.TODO)
                      }
                    >
                      Undo
                    </button>
                  </div>
                ))}
              </div>
              <Link
                href="/review#weekly-review"
                className="mt-2 inline-block text-xs underline"
              >
                Browse older weeks
              </Link>
            </details>
          )}

          {workspace === "tasks" && error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {workspace === "tasks" && !error && schedulingError && (
            <Alert className="mt-4 border-warning/40 bg-warning/10 text-foreground">
              <AlertDescription>
                Your task changes were saved, but Sunnie couldn&apos;t place
                tasks on the calendar. {schedulingError.message}{" "}
                <Link
                  href="/settings#auto-schedule"
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  Review settings
                </Link>
                {" · "}
                <Link
                  href="/settings#accounts"
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  Connect a calendar
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div
          className={`relative z-0 flex min-h-0 flex-1 flex-col p-3 sm:p-6 ${
            workspace === "tasks" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div className="mx-auto flex h-full w-full max-w-[1480px] flex-col">
            {workspace === "tasks" && initialLoading ? (
              <TasksPageSkeleton />
            ) : workspace === "tasks" ? (
              <TaskList
                tasks={tasks}
                onEdit={(task) => {
                  setSelectedTask(task);
                  setOpen(true);
                }}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <TaskCaptureWorkspace
                initialView={workspace === "tune-up" ? "tune-up" : "dump"}
                showViewTabs={false}
                onViewChange={(view) => {
                  selectWorkspace(
                    view === "tune-up" ? "tune-up" : "brain-dump"
                  );
                }}
                onTasksChanged={() => {
                  void Promise.all([fetchTasks(), fetchProjects()]);
                }}
              />
            )}
          </div>
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

        <SunnieDeleteDialog
          open={Boolean(taskPendingDelete)}
          onOpenChange={(open) => {
            if (!open) setTaskPendingDelete(undefined);
          }}
          itemType="task"
          itemName={taskPendingDelete?.title}
          onConfirm={confirmDeleteTask}
        />
      </div>
    </div>
  );
}

function TasksPageSkeleton() {
  return (
    <div aria-label="Loading tasks" className="flex h-full flex-col gap-4">
      <SunnieSkeleton className="h-16 w-full rounded-2xl" />
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="space-y-4 rounded-2xl border border-border/70 bg-card/70 p-4"
          >
            <SunnieSkeleton className="h-5 w-3/4" />
            <SunnieSkeleton className="h-3 w-full" />
            <SunnieSkeleton className="h-3 w-2/3" />
            <div className="flex gap-2 pt-2">
              <SunnieSkeleton className="h-7 w-20 rounded-full" />
              <SunnieSkeleton className="h-7 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkspaceButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof ListTodo;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${
        active
          ? "bg-accent text-accent-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{children}</span>
    </button>
  );
}
