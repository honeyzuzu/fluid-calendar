import { BASE_COLOR_THEME } from "@/lib/color-themes";

export const DEFAULT_PROJECT_COLOR =
  BASE_COLOR_THEME.palettes.projects[0].value;

// Projects use their own warm, garden-inspired palette. Keep this separate
// from the cooler calendar-event presets in calendar-colors.ts.
export const SUNNIE_PROJECT_COLORS = BASE_COLOR_THEME.palettes.projects;
