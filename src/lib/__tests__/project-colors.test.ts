import { SUNNIE_PASTEL_COLORS } from "@/lib/calendar-colors";
import {
  DEFAULT_PROJECT_COLOR,
  SUNNIE_PROJECT_COLORS,
} from "@/lib/project-colors";

describe("project colors", () => {
  it("provides unique presets and uses one as the default", () => {
    const colors = SUNNIE_PROJECT_COLORS.map(({ value }) => value);

    expect(new Set(colors).size).toBe(colors.length);
    expect(colors).toContain(DEFAULT_PROJECT_COLOR);
  });

  it("does not reuse calendar event preset colors", () => {
    const eventColors = new Set(
      SUNNIE_PASTEL_COLORS.map(({ value }) => value.toUpperCase())
    );

    for (const { value } of SUNNIE_PROJECT_COLORS) {
      expect(eventColors.has(value.toUpperCase())).toBe(false);
    }
  });
});
