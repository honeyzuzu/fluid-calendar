"use client";

import { type ReactNode, useState } from "react";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";

import { getTaskDropUpdate } from "@/lib/task-dnd";

import { useProjectStore } from "@/store/project";
import { useTaskStore } from "@/store/task";

import { Task } from "@/types/task";

import { BoardTaskOverlay } from "../tasks/BoardView/BoardTask";

interface DndProviderProps {
  children: ReactNode;
}

export function DndProvider({ children }: DndProviderProps) {
  const { updateTask } = useTaskStore();
  const { fetchProjects } = useProjectStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "task") {
      setActiveTask(event.active.data.current.task as Task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!active || !over) return;

    if (active.data.current?.type !== "task") return;

    const update = getTaskDropUpdate(
      String(over.id),
      over.data.current as Parameters<typeof getTaskDropUpdate>[1]
    );
    if (!update) return;

    await updateTask(String(active.id), update);
    if ("projectId" in update) await fetchProjects();
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragCancel={() => setActiveTask(null)}
      onDragEnd={handleDragEnd}
    >
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <DragOverlay zIndex={10000} dropAnimation={{ duration: 220 }}>
            {activeTask ? <BoardTaskOverlay task={activeTask} /> : null}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}
