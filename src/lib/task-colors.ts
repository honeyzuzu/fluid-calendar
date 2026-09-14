import {
  ColorThemeId,
  getStableThemeColorSlot,
  isThemeColorSlot,
  resolveThemeLinkedColor,
} from "@/lib/color-themes";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isValidTaskColor(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && HEX_COLOR.test(value))
  );
}

export function isValidTaskColorSlot(value: unknown): boolean {
  return (
    value === null || value === undefined || isThemeColorSlot("tasks", value)
  );
}

export function getTaskDisplayColor(
  task: { id: string; color?: string | null; colorSlot?: string | null },
  themeId: ColorThemeId
) {
  return resolveThemeLinkedColor(
    "tasks",
    task.colorSlot ||
      (!task.color ? getStableThemeColorSlot("tasks", task.id) : null),
    task.color,
    themeId
  );
}
