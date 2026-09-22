import { create } from "zustand";
import { persist } from "zustand/middleware";

import { isSaasEnabled } from "@/lib/config";
import { awardSunDrops, completionEarnsSunDrop } from "@/lib/focus-rewards";

import {
  NewTag,
  NewTask,
  Tag,
  Task,
  TaskFilters,
  UpdateTask,
} from "@/types/task";

interface TaskState {
  tasks: Task[];
  tags: Tag[];
  filters: TaskFilters;
  loading: boolean;
  error: Error | null;
  schedulingError: Error | null;

  // Task actions
  fetchTasks: (options?: { ignoreFilters?: boolean }) => Promise<void>;
  createTask: (task: NewTask) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTask) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TaskFilters>) => void;

  // Tag actions
  fetchTags: () => Promise<void>;
  createTag: (tag: NewTag) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<NewTag>) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;

  // Project actions
  assignToProject: (taskId: string, projectId: string | null) => Promise<Task>;
  bulkAssignToProject: (
    taskIds: string[],
    projectId: string | null
  ) => Promise<void>;

  // Auto-scheduling actions
  scheduleAllTasks: (preserveExisting?: boolean) => Promise<Task[]>;
  triggerScheduleAllTasks: () => Promise<void>;
}

const taskMutationVersions = new Map<string, number>();
let taskRescheduleTimer: ReturnType<typeof setTimeout> | undefined;

function beginTaskMutation(taskId: string) {
  const version = (taskMutationVersions.get(taskId) ?? 0) + 1;
  taskMutationVersions.set(taskId, version);
  return version;
}

function isLatestTaskMutation(taskId: string, version: number) {
  return taskMutationVersions.get(taskId) === version;
}

function queueTaskReschedule(getState: () => TaskState) {
  if (taskRescheduleTimer) clearTimeout(taskRescheduleTimer);
  taskRescheduleTimer = setTimeout(() => {
    taskRescheduleTimer = undefined;
    void getState()
      .triggerScheduleAllTasks()
      .catch(() => undefined);
  }, 200);
}

function applyOptimisticTaskUpdate(
  task: Task,
  updates: UpdateTask,
  tags: Tag[]
): Task {
  const { tagIds, ...taskUpdates } = updates;

  return {
    ...task,
    ...taskUpdates,
    tags: tagIds ? tags.filter((tag) => tagIds.includes(tag.id)) : task.tags,
    updatedAt: new Date(),
  };
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      tags: [],
      filters: {},
      loading: false,
      error: null,
      schedulingError: null,

      // Task actions
      fetchTasks: async (options) => {
        set({ loading: true, error: null });
        try {
          const filters: TaskFilters = options?.ignoreFilters
            ? {}
            : get().filters;
          const params = new URLSearchParams();

          if (filters.status?.length) {
            filters.status.forEach((s) => params.append("status", s));
          }
          if (filters.tagIds?.length) {
            filters.tagIds.forEach((id) => params.append("tagIds", id));
          }
          if (filters.projectId) {
            params.append("projectId", filters.projectId);
          }
          if (filters.search) {
            params.append("search", filters.search);
          }
          if (filters.energyLevel?.length) {
            filters.energyLevel.forEach((level) =>
              params.append("energyLevel", level)
            );
          }
          if (filters.timePreference?.length) {
            filters.timePreference.forEach((pref) =>
              params.append("timePreference", pref)
            );
          }

          const response = await fetch(`/api/tasks?${params.toString()}`);
          if (!response.ok) throw new Error("Failed to fetch tasks");
          const tasks = await response.json();
          set({ tasks });
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ loading: false });
        }
      },

      createTask: async (task: NewTask) => {
        set({ error: null });
        try {
          const response = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task),
          });
          if (!response.ok) throw new Error("Failed to create task");
          const newTask = await response.json();
          set((state) => ({ tasks: [...state.tasks, newTask] }));
          if (task.isAutoScheduled !== false) queueTaskReschedule(get);
          return newTask;
        } catch (error) {
          set({ error: error as Error });
          throw error;
        }
      },

      updateTask: async (id: string, updates: UpdateTask) => {
        const previousTask = get().tasks.find((task) => task.id === id);
        const previousStatus = previousTask?.status;
        const earnsSunDrop = completionEarnsSunDrop(
          previousStatus,
          updates.status
        );
        const mutationVersion = beginTaskMutation(id);

        set((state) => ({
          error: null,
          tasks: state.tasks.map((task) =>
            task.id === id
              ? applyOptimisticTaskUpdate(task, updates, state.tags)
              : task
          ),
        }));

        try {
          const response = await fetch(`/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update task: ${errorText}`);
          }

          const updatedTask = await response.json();
          if (isLatestTaskMutation(id, mutationVersion)) {
            set((state) => ({
              tasks: state.tasks.map((task) =>
                task.id === id ? updatedTask : task
              ),
            }));
            if (earnsSunDrop) void awardSunDrops(1);
          }
          queueTaskReschedule(get);
          return updatedTask;
        } catch (error) {
          set((state) => ({
            error: error as Error,
            tasks:
              previousTask && isLatestTaskMutation(id, mutationVersion)
                ? state.tasks.map((task) =>
                    task.id === id ? previousTask : task
                  )
                : state.tasks,
          }));
          throw error;
        }
      },

      deleteTask: async (id: string) => {
        const previousTasks = get().tasks;
        const previousTask = previousTasks.find((task) => task.id === id);
        const previousIndex = previousTasks.findIndex((task) => task.id === id);
        set((state) => ({
          error: null,
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
        try {
          const response = await fetch(`/api/tasks/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Failed to delete task");
          queueTaskReschedule(get);
        } catch (error) {
          set((state) => {
            if (!previousTask || state.tasks.some((task) => task.id === id)) {
              return { error: error as Error };
            }
            const tasks = [...state.tasks];
            tasks.splice(Math.max(0, previousIndex), 0, previousTask);
            return { error: error as Error, tasks };
          });
          throw error;
        }
      },

      setFilters: (filters: Partial<TaskFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      // Tag actions
      fetchTags: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch("/api/tags");
          if (!response.ok) throw new Error("Failed to fetch tags");
          const tags = await response.json();
          set({ tags });
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ loading: false });
        }
      },

      createTag: async (tag: NewTag) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch("/api/tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tag),
          });
          if (!response.ok) throw new Error("Failed to create tag");
          const newTag = await response.json();
          set((state) => ({ tags: [...state.tags, newTag] }));
          return newTag;
        } catch (error) {
          set({ error: error as Error });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      updateTag: async (id: string, updates: Partial<NewTag>) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/tags/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error("Failed to update tag");
          const updatedTag = await response.json();
          set((state) => ({
            tags: state.tags.map((tag) => (tag.id === id ? updatedTag : tag)),
          }));
          return updatedTag;
        } catch (error) {
          set({ error: error as Error });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      deleteTag: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/tags/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Failed to delete tag");
          set((state) => ({
            tags: state.tags.filter((tag) => tag.id !== id),
          }));
        } catch (error) {
          set({ error: error as Error });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      assignToProject: async (taskId: string, projectId: string | null) => {
        return get().updateTask(taskId, { projectId });
      },

      bulkAssignToProject: async (
        taskIds: string[],
        projectId: string | null
      ) => {
        const taskIdSet = new Set(taskIds);
        const previousTasks = get().tasks;
        set((state) => ({
          error: null,
          tasks: state.tasks.map((task) =>
            taskIdSet.has(task.id) ? { ...task, projectId } : task
          ),
        }));
        try {
          const responses = await Promise.all(
            taskIds.map(async (taskId) => {
              const response = await fetch(`/api/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId }),
              });
              if (!response.ok) {
                throw new Error("Failed to assign one or more tasks");
              }
              return (await response.json()) as Task;
            })
          );

          const updatedById = new Map(
            responses.map((task) => [task.id, task] as const)
          );
          set((state) => ({
            tasks: state.tasks.map((task) => updatedById.get(task.id) ?? task),
          }));
          queueTaskReschedule(get);
        } catch (error) {
          const previousById = new Map(
            previousTasks
              .filter((task) => taskIdSet.has(task.id))
              .map((task) => [task.id, task] as const)
          );
          set((state) => ({
            error: error as Error,
            tasks: state.tasks.map((task) => previousById.get(task.id) ?? task),
          }));
          void get().fetchTasks();
          throw error;
        }
      },

      triggerScheduleAllTasks: async () => {
        set({ loading: true, schedulingError: null });
        try {
          // For open source version, call scheduleAllTasks directly
          if (!isSaasEnabled) {
            await get().scheduleAllTasks(true);
            return;
          }

          // For SAAS version, use the background job queue
          const jobResponse = await fetch("/api/tasks/schedule-all/queue", {
            method: "POST",
          });

          if (!jobResponse.ok) {
            throw new Error("Failed to queue task scheduling job");
          }

          // Set up SSE connection if not already connected
          if (
            !window.taskScheduleSSE ||
            window.taskScheduleSSE.readyState === 2
          ) {
            const setupSSE = () => {
              // Close existing connection if it exists but is in a closed state
              if (window.taskScheduleSSE) {
                window.taskScheduleSSE.close();
              }

              const eventSource = new EventSource("/api/sse");

              eventSource.onmessage = (event) => {
                try {
                  const data = JSON.parse(event.data);
                  if (data.type === "TASK_SCHEDULE_COMPLETE") {
                    get().fetchTasks();
                    // Dispatch a custom event for the NotificationProvider
                    window.dispatchEvent(
                      new CustomEvent("task-schedule-complete", {
                        detail: data,
                      })
                    );
                  }
                } catch (error) {
                  console.error(
                    "Error parsing SSE message in task store:",
                    error
                  );
                }
              };

              eventSource.onerror = () => {
                console.error("SSE connection error");
                eventSource.close();
                // Try to reconnect after a delay
                setTimeout(setupSSE, 5000);
              };

              window.taskScheduleSSE = eventSource;
            };

            setupSSE();
          }
        } catch (error) {
          set({ schedulingError: error as Error });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Auto-scheduling actions
      scheduleAllTasks: async (preserveExisting = false) => {
        set({ loading: true, schedulingError: null });
        try {
          const response = await fetch("/api/tasks/schedule-all", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preserveExisting }),
          });
          if (!response.ok) {
            const data = (await response.json().catch(() => null)) as {
              error?: unknown;
            } | null;
            throw new Error(
              typeof data?.error === "string"
                ? data.error
                : "Sunnie couldn't schedule these tasks. Your task changes are safe; review Auto-Schedule settings and try again."
            );
          }
          const updatedTasks = await response.json();

          // Get current tasks from store
          const currentTasks = get().tasks;

          // Create a map of updated tasks by ID for efficient lookup
          const updatedTasksMap = new Map(
            updatedTasks.map((task: Task) => [task.id, task])
          );

          // Merge updated tasks with existing tasks
          const mergedTasks = currentTasks.map((task) =>
            updatedTasksMap.has(task.id) ? updatedTasksMap.get(task.id)! : task
          ) as Task[];

          set({ tasks: mergedTasks });
          return updatedTasks;
        } catch (error) {
          set({ schedulingError: error as Error });
          throw error;
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "task-data-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        tags: state.tags,
      }),
    }
  )
);
