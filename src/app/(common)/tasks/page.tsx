"use client";

import { useEffect, useState } from "react";

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

import { useAutoSchedule } from "@/hooks/use-auto-schedule";

import { useProjectStore } from "@/store/project";
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
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task>();
  const [initialProjectId, setInitialProjectId] = useState<
    string | null | undefined
  >(undefined);
  const handleAutoSchedule = useAutoSchedule();

  // Fetch tasks and tags on mount
  useEffect(() => {
    let active = true;
    void Promise.all([fetchTasks(), fetchTags(), fetchProjects()]).finally(
      () => {
        if (active) setInitialLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, [fetchTasks, fetchTags, fetchProjects]);

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

  const handleInlineEdit = async (task: Task) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, tags, createdAt, updatedAt, project, ...updates } = task;
    try {
      await updateTask(id, updates);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task", {
        description: "Please try again later.",
      });
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
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Little things, lovingly planned
                </p>
                <h1 className="text-2xl font-bold tracking-[-0.04em] text-foreground">
                  Tasks
                </h1>
                {workspace === "tasks" && (
                  <>
                    <Link
                      href="/plan#weekly-review"
                      className="text-xs font-medium text-primary underline"
                    >
                      Weekly review & completed history
                    </Link>
                    <p
                      id="auto-schedule-description"
                      className="mt-1 max-w-xl text-xs text-muted-foreground"
                    >
                      Auto-schedule fits unfinished tasks into free time during
                      the next 7 days. New tasks are included by default.
                      <Link
                        href="/settings#auto-schedule"
                        className="ml-1 font-medium text-primary hover:underline"
                      >
                        Adjust its rules.
                      </Link>
                    </p>
                  </>
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
                  My tasks
                </WorkspaceButton>
                <WorkspaceButton
                  active={workspace === "brain-dump"}
                  onClick={() => selectWorkspace("brain-dump")}
                  icon={Brain}
                >
                  Brain dump
                </WorkspaceButton>
                <WorkspaceButton
                  active={workspace === "tune-up"}
                  onClick={() => selectWorkspace("tune-up")}
                  icon={WandSparkles}
                >
                  Tune-up
                </WorkspaceButton>
              </div>
            </div>
            {workspace === "tasks" && (
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <div className="group relative min-w-0 flex-1 sm:flex-none">
                  <Button
                    variant="secondary"
                    onClick={handleAutoSchedule}
                    aria-describedby="auto-schedule-description auto-schedule-tooltip"
                    className="w-full sm:w-auto"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span className="sm:hidden">Auto-schedule</span>
                    <span className="hidden sm:inline">
                      Auto-schedule tasks
                    </span>
                  </Button>
                  <AutoScheduleTooltip id="auto-schedule-tooltip" />
                </div>
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

          {workspace === "tasks" && <MobileProjectPicker />}
          {workspace === "tasks" && (
            <details className="mx-auto mt-3 w-full max-w-[1480px] rounded-xl border border-border bg-muted px-3 py-2 text-sm">
              <summary className="cursor-pointer font-medium">
                Completed today (
                {
                  tasks.filter(
                    (task) =>
                      task.status === TaskStatus.COMPLETED &&
                      (!activeProject ||
                        (activeProject.id === "no-project"
                          ? !task.projectId
                          : task.projectId === activeProject.id))
                  ).length
                }
                )
              </summary>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                {tasks
                  .filter(
                    (task) =>
                      task.status === TaskStatus.COMPLETED &&
                      (!activeProject ||
                        (activeProject.id === "no-project"
                          ? !task.projectId
                          : task.projectId === activeProject.id))
                  )
                  .map((task) => (
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
                href="/plan#weekly-review"
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
                {schedulingError.message}{" "}
                <Link
                  href="/settings#auto-schedule"
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  Review settings
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
                onInlineEdit={handleInlineEdit}
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
