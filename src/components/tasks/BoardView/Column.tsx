"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

import { Task, TaskStatus } from "@/types/task";

import { BoardTask } from "./BoardTask";

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const statusColors = {
  [TaskStatus.TODO]: "border-accent/30 bg-accent/10",
  [TaskStatus.IN_PROGRESS]: "border-primary/25 bg-primary/10",
  [TaskStatus.COMPLETED]: "border-success/25 bg-success/10",
};

const statusHeaderColors = {
  [TaskStatus.TODO]: "bg-accent/25 text-accent-foreground",
  [TaskStatus.IN_PROGRESS]: "bg-primary/15 text-primary",
  [TaskStatus.COMPLETED]: "bg-success/15 text-success",
};

// Helper function to format enum values for display
const formatEnumValue = (value: string) => {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function Column({ status, tasks, onEdit, onDelete }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: "status",
      status,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-64 min-w-0 w-full flex-col rounded-xl border bg-background md:min-h-0",
        statusColors[status],
        isOver && "relative z-10 ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="border-b border-border p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-sm font-medium",
                statusHeaderColors[status]
              )}
            >
              {formatEnumValue(status)}
            </span>
            <span className="text-sm text-muted-foreground">
              {tasks.length}
            </span>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {tasks.map((task) => (
            <BoardTask
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
