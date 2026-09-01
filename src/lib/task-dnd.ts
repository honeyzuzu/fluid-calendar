import { TaskStatus, UpdateTask } from "@/types/task";

interface DropData {
  type?: string;
  project?: { id: string } | null;
  status?: TaskStatus;
}

export function getTaskDropUpdate(
  overId: string,
  overData?: DropData
): UpdateTask | null {
  if (overData?.type === "project") {
    return {
      projectId: overId === "remove-project" ? null : overId,
    };
  }

  const status = overData?.status ?? (overId as TaskStatus);
  if (
    overData?.type === "status" ||
    Object.values(TaskStatus).includes(status)
  ) {
    return { status };
  }

  return null;
}
