import {
  SUNNIE_EVENT_COLOR_GROUPS,
  SUNNIE_PASTEL_COLORS,
} from "@/lib/calendar-colors";
import { TASK_URGENCY_COLORS } from "@/lib/calendar-task-style";

describe("calendar event colors", () => {
  it("keeps every preset visually distinct from task urgency colors", () => {
    const urgencyColors = new Set(
      Object.values(TASK_URGENCY_COLORS).map((color) => color.toUpperCase())
    );

    for (const preset of SUNNIE_PASTEL_COLORS) {
      expect(urgencyColors.has(preset.value.toUpperCase())).toBe(false);
    }
  });

  it("organizes a varied palette into balanced visual groups", () => {
    expect(SUNNIE_EVENT_COLOR_GROUPS).toHaveLength(3);
    expect(
      SUNNIE_EVENT_COLOR_GROUPS.every((group) => group.colors.length === 4)
    ).toBe(true);
    expect(SUNNIE_PASTEL_COLORS).toHaveLength(12);
  });
});
