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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
    loading,
    error,
    fetchTasks,
    fetchTags,
    createTask,
    updateTask,
    deleteTask,
    createTag,
  } = useTaskStore();
  const { fetchProjects, activeProject } = useProjectStore();
  const { isOpen, setOpen } = useTaskModalStore();

  const [workspace, setWorkspace] = useState<TasksWorkspace>("tasks");
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task>();
  const [initialProjectId, setInitialProjectId] = useState<
    string | null | undefined
  >(undefined);
  const handleAutoSchedule = useAutoSchedule();

  // Fetch tasks and tags on mount
  useEffect(() => {
    fetchTasks();
    fetchTags();
    fetchProjects();
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
    setTaskPendingDelete(tasks.find((task) => task.id === taskId));
  };

  const confirmDeleteTask = async () => {
    if (!taskPendingDelete) return;

    await deleteTask(taskPendingDelete.id);
    await Promise.all([fetchTasks(), fetchProjects()]);
    setTaskPendingDelete(undefined);
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

  return (
    <div className="flex h-full w-full min-w-0 overflow-x-clip bg-[#fff9e8]">
      {workspace === "tasks" && <ProjectSidebar />}
      <div className="flex min-w-0 flex-1 flex-col" data-task-page>
        <div className="relative z-30 overflow-visible border-b border-[#dfe2c8] bg-[#fffdf5]/75 px-3 py-3 backdrop-blur-sm sm:px-6 sm:py-4">
          <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-col items-start gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d0902f]">
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
                className="grid w-full grid-cols-3 gap-1 rounded-xl border border-black/[0.06] bg-white/60 p-1 sm:w-auto"
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
            <details className="mx-auto mt-3 w-full max-w-[1480px] rounded-xl border border-[#dce3c9] bg-[#f3f6e9] px-3 py-2 text-sm">
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
        </div>

        <div
          className={`relative z-0 flex min-h-0 flex-1 flex-col p-3 sm:p-6 ${
            workspace === "tasks" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div className="mx-auto flex h-full w-full max-w-[1480px] flex-col">
            {workspace === "tasks" ? (
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
          ? "bg-[#f8e4a1] text-[#77591d] shadow-sm"
          : "text-[#687052] hover:bg-[#eef3df]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{children}</span>
    </button>
  );
}
