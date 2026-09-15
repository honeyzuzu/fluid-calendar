import { z } from "zod";

import { ProjectStatus } from "@/types/project";

const optionalTrimmedText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => value || undefined);

export const projectCreateSchema = z.object({
  name: z
    .string({ required_error: "Project name is required" })
    .trim()
    .min(1, "Project name is required")
    .max(120, "Project name must be 120 characters or fewer"),
  description: optionalTrimmedText(2_000),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "Choose a valid project color")
    .optional(),
  colorSlot: z
    .string()
    .regex(/^project-[1-6]$/, "Choose a valid project color")
    .nullable()
    .optional(),
  status: z
    .enum([ProjectStatus.ACTIVE, ProjectStatus.ARCHIVED])
    .default(ProjectStatus.ACTIVE),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
