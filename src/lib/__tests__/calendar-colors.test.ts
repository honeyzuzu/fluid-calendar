import {
  SUNNIE_EVENT_COLOR_GROUPS,
  SUNNIE_PASTEL_COLORS,
} from "@/lib/calendar-colors";
import { BASE_COLOR_THEME } from "@/lib/color-themes";

describe("calendar event colors", () => {
  it("keeps every preset visually distinct from aesthetic task colors", () => {
    const taskColors = new Set(
      BASE_COLOR_THEME.palettes.tasks.map((color) => color.value.toUpperCase())
    );

    for (const preset of SUNNIE_PASTEL_COLORS) {
      expect(taskColors.has(preset.value.toUpperCase())).toBe(false);
    }
  });

  it("organizes a varied palette into balanced visual groups", () => {
    expect(SUNNIE_EVENT_COLOR_GROUPS).toHaveLength(2);
    expect(
      SUNNIE_EVENT_COLOR_GROUPS.every((group) => group.colors.length === 4)
    ).toBe(true);
    expect(SUNNIE_PASTEL_COLORS).toHaveLength(8);
  });
});
