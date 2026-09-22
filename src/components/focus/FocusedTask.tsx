"use client";

import { useState } from "react";

import Link from "next/link";

import { Clock3, Sparkles } from "lucide-react";

import { TaskModal } from "@/components/tasks/TaskModal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { useFocusModeStore } from "@/store/focusMode";
import { useTaskStore } from "@/store/task";

import { NewTask, Task } from "@/types/task";

import { FocusSession } from "./FocusSession";

interface FocusedTaskProps {
  task: Task | null;
  hasOpenTasks: boolean;
  onChooseTask: () => void;
  onSessionActiveChange: (active: boolean) => void;
}

export function FocusedTask({
  task,
  hasOpenTasks,
  onChooseTask,
  onSessionActiveChange,
}: FocusedTaskProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const completeCurrentTask = useFocusModeStore(
    (state) => state.completeCurrentTask
  );
  const { updateTask, tags, createTag } = useTaskStore();

  if (!task) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
        <div className="relative grid h-28 w-28 place-items-center rounded-[2.25rem] border border-border bg-accent/70 shadow-[var(--shadow-paper)]">
          <span className="text-5xl" aria-hidden="true">
            🐱
          </span>
          <Sparkles className="absolute -right-2 -top-2 h-7 w-7 text-primary" />
        </div>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          A gentle focus ritual
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl">
          Choose a task to begin
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {hasOpenTasks
            ? "Pick a task from the queue, settle in with a short setup, then focus beside your companion."
            : "Add a task to begin. Then settle in with a short setup and focus beside your companion."}{" "}
          Sunnie will protect the timer and remind you to take a real break.
        </p>
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-card/75 px-4 py-3 text-xs font-semibold text-secondary-foreground">
          <Clock3 className="h-4 w-4 text-primary" /> Setup → focus → break
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {hasOpenTasks && (
            <button
              type="button"
              onClick={onChooseTask}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Browse tasks
            </button>
          )}
          <Link
            href="/tasks"
            className={
              hasOpenTasks
                ? "rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-secondary-foreground"
                : "rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm"
            }
          >
            Add a task
          </Link>
        </div>
      </div>
    );
  }

  const handleEditTask = async (taskData: NewTask) => {
    await updateTask(task.id, taskData);
    setIsEditModalOpen(false);
  };

  return (
    <Card className="mx-auto flex h-full w-full max-w-5xl flex-col border-border bg-card p-4 shadow-[var(--shadow-paper)] sm:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
          Current task
        </p>
        <h2 className="task-title mt-1 text-2xl font-bold text-foreground sm:text-3xl">
          {task.title}
        </h2>
        {task.tags && task.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {task.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="px-2 py-0.5"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : undefined,
                  color: tag.color,
                  borderColor: tag.color ? `${tag.color}40` : undefined,
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <FocusSession
        key={task.id}
        taskId={task.id}
        taskTitle={task.title}
        taskDescription={task.description}
        taskEnergy={task.energyLevel}
        taskPriority={task.priority}
        estimatedMinutes={task.duration}
        onCompleteTask={completeCurrentTask}
        onEditTask={() => setIsEditModalOpen(true)}
        onSessionActiveChange={onSessionActiveChange}
      />

      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditTask}
        task={task}
        tags={tags}
        onCreateTag={(name, color) => createTag({ name, color: color || "" })}
      />
    </Card>
  );
}
