import {
  BASE_COLOR_THEME,
  ColorThemeId,
  resolveThemeLinkedColor,
} from "@/lib/color-themes";

import { Project } from "@/types/project";

export const DEFAULT_PROJECT_COLOR =
  BASE_COLOR_THEME.palettes.projects[0].value;

// Projects use their own warm, garden-inspired palette. Keep this separate
// from the cooler calendar-event presets in calendar-colors.ts.
export const SUNNIE_PROJECT_COLORS = BASE_COLOR_THEME.palettes.projects;

export function getProjectDisplayColor(
  project: Pick<Project, "color" | "colorSlot">,
  themeId: ColorThemeId
) {
  return resolveThemeLinkedColor(
    "projects",
    project.colorSlot,
    project.color,
    themeId
  );
}
