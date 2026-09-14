import {
  SUNNIE_EVENT_COLOR_GROUPS,
  SUNNIE_PASTEL_COLORS,
  getCalendarDisplayColor,
} from "@/lib/calendar-colors";
import { BASE_COLOR_THEME } from "@/lib/color-themes";

describe("calendar event colors", () => {
  it("resolves feed and custom event colors correctly", () => {
    const feeds = [
      {
        id: "feed-1",
        name: "Calendar",
        type: "GOOGLE" as const,
        enabled: true,
        color: "#9BC7D9",
        colorSlot: "event-1",
      },
    ];
    expect(
      getCalendarDisplayColor(
        { feedId: "feed-1", color: null, colorSlot: null },
        feeds,
        "autumn-golden-hour"
      )
    ).toBe("#8FA05A");
    expect(
      getCalendarDisplayColor(
        { feedId: "feed-1", color: "#123456", colorSlot: null },
        feeds,
        "autumn-golden-hour"
      )
    ).toBe("#123456");
  });
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
