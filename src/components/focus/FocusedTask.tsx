"use client";

import { useState } from "react";

import { TaskModal } from "@/components/tasks/TaskModal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { useFocusModeStore } from "@/store/focusMode";
import { useTaskStore } from "@/store/task";

import { NewTask, Task } from "@/types/task";

import { FocusSession } from "./FocusSession";

interface FocusedTaskProps {
  task: Task | null;
}

export function FocusedTask({ task }: FocusedTaskProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const completeCurrentTask = useFocusModeStore(
    (state) => state.completeCurrentTask
  );
  const { updateTask, fetchTasks, tags, createTag } = useTaskStore();

  if (!task) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground">No task selected</p>
      </div>
    );
  }

  const handleEditTask = async (taskData: NewTask) => {
    await updateTask(task.id, taskData);
    await fetchTasks();
    setIsEditModalOpen(false);
  };

  return (
    <Card className="mx-auto flex h-full w-full max-w-5xl flex-col border-[#dfdab8] bg-[#fffdf7] p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a6762a]">
          Current task
        </p>
        <h2 className="task-title mt-1 text-2xl font-bold text-[#424832] sm:text-3xl">
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
