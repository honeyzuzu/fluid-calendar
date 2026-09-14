import { prisma } from "@/lib/prisma";

type TaskRelationsInput = {
  projectId?: unknown;
  tagIds?: unknown;
};

export async function validateTaskRelations(
  userId: string,
  { projectId, tagIds }: TaskRelationsInput
): Promise<string | null> {
  if (
    projectId !== undefined &&
    projectId !== null &&
    typeof projectId !== "string"
  ) {
    return "Choose a valid project";
  }

  if (typeof projectId === "string") {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });
    if (!project) return "Project not found";
  }

  if (tagIds !== undefined) {
    if (!Array.isArray(tagIds) || tagIds.some((id) => typeof id !== "string")) {
      return "Choose valid tags";
    }
    const uniqueTagIds = [...new Set(tagIds as string[])];
    if (uniqueTagIds.length > 0) {
      const ownedTagCount = await prisma.tag.count({
        where: { id: { in: uniqueTagIds }, userId },
      });
      if (ownedTagCount !== uniqueTagIds.length) return "Tag not found";
    }
  }

  return null;
}

const MUTABLE_TASK_FIELDS = [
  "title",
  "description",
  "status",
  "dueDate",
  "startDate",
  "plannedWeekStart",
  "duration",
  "priority",
  "energyLevel",
  "preferredTime",
  "color",
  "colorSlot",
  "isRecurring",
  "recurrenceRule",
  "isAutoScheduled",
  "scheduleLocked",
  "scheduledStart",
  "scheduledEnd",
  "postponedUntil",
] as const;

export type MutableTaskFields = {
  title?: string;
  description?: string | null;
  status?: string;
  dueDate?: string | Date | null;
  startDate?: string | Date | null;
  plannedWeekStart?: string | Date | null;
  duration?: number | null;
  priority?: string | null;
  energyLevel?: string | null;
  preferredTime?: string | null;
  color?: string | null;
  colorSlot?: string | null;
  isRecurring?: boolean;
  recurrenceRule?: string | null;
  isAutoScheduled?: boolean;
  scheduleLocked?: boolean;
  scheduledStart?: string | Date | null;
  scheduledEnd?: string | Date | null;
  postponedUntil?: string | Date | null;
  completedAt?: Date | null;
  rolloverCount?: number;
  rolledFromWeek?: Date | null;
  lastCompletedDate?: Date | null;
  lastScheduled?: Date | null;
};

export function pickMutableTaskFields(body: Record<string, unknown>) {
  const fields: MutableTaskFields = {};
  for (const field of MUTABLE_TASK_FIELDS) {
    if (body[field] !== undefined) {
      Object.assign(fields, { [field]: body[field] });
    }
  }
  return fields;
}
