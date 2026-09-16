import { applyFeedColorsToCalendarItems } from "@/lib/calendar-colors";

import { CalendarFeed } from "@/types/calendar";

describe("calendar feed colors", () => {
  it("recolors cached feed events immediately while preserving overrides and other blocks", () => {
    const feeds: CalendarFeed[] = [
      {
        id: "feed-1",
        name: "My calendar",
        type: "GOOGLE",
        enabled: true,
        color: "#9BC7D9",
      },
    ];
    const items = [
      {
        backgroundColor: "#9BC7D9",
        borderColor: "#9BC7D9",
        extendedProps: { feedId: "feed-1" },
      },
      {
        backgroundColor: "#123456",
        borderColor: "#123456",
        extendedProps: { feedId: "feed-1", color: "#123456" },
      },
      {
        backgroundColor: "#abcdef",
        borderColor: "#abcdef",
        extendedProps: { feedId: "tasks", isTask: true },
      },
      {
        backgroundColor: "#fedcba",
        borderColor: "#fedcba",
        extendedProps: { isFriendEvent: true },
      },
    ];

    const recolored = applyFeedColorsToCalendarItems(
      items,
      [{ ...feeds[0], color: "#E9A66F" }],
      "base"
    );

    expect(recolored.map((item) => item.backgroundColor)).toEqual([
      "#E9A66F",
      "#123456",
      "#abcdef",
      "#fedcba",
    ]);
    expect(recolored[0].borderColor).toBe("#E9A66F");
  });
});
