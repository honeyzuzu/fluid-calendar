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
        id: "event-1",
        backgroundColor: "#9BC7D9",
        borderColor: "#9BC7D9",
        extendedProps: { feedId: "feed-1" },
      },
      {
        id: "event-2",
        backgroundColor: "#123456",
        borderColor: "#123456",
        extendedProps: { feedId: "feed-1", color: "#123456" },
      },
      {
        id: "task-1",
        backgroundColor: "#abcdef",
        borderColor: "#abcdef",
        extendedProps: { feedId: "tasks", isTask: true },
      },
      {
        id: "friend-1",
        backgroundColor: "#fedcba",
        borderColor: "#fedcba",
        extendedProps: { isFriendEvent: true },
      },
    ];

    const recolored = applyFeedColorsToCalendarItems(
      items,
      [{ ...feeds[0], color: "#E9A66F" }],
      "base",
      [
        { id: "event-1", feedId: "feed-1" },
        { id: "event-2", feedId: "feed-1", color: "#123456" },
      ]
    );

    expect(recolored.map((item) => item.backgroundColor)).toEqual([
      "#E9A66F",
      "#123456",
      "#abcdef",
      "#fedcba",
    ]);
    expect(recolored[0].borderColor).toBe("#E9A66F");

    const updatedEvent = applyFeedColorsToCalendarItems(items, feeds, "base", [
      { id: "event-1", feedId: "feed-1", color: "#C98772" },
      { id: "event-2", feedId: "feed-1", color: "#123456" },
    ]);
    expect(updatedEvent[0].backgroundColor).toBe("#C98772");
  });
});
