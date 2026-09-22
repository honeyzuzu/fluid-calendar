import { getCalendarEventTitle } from "@/lib/calendar-event-title";

describe("calendar event display names", () => {
  it("shows busy for an imported event whose provider omitted its title", () => {
    expect(
      getCalendarEventTitle({
        title: "Untitled Event",
        externalEventId: "remote",
      })
    ).toBe("Busy");
  });

  it("shows free when the provider marks a blank-title event transparent", () => {
    expect(
      getCalendarEventTitle({
        title: "Untitled Event",
        externalEventId: "remote",
        isFree: true,
      })
    ).toBe("Free");
  });

  it("prefers a private Sunnie name without changing the provider title", () => {
    const event = {
      title: "Untitled Event",
      externalEventId: "remote",
      titleOverride: "Team check-in",
    };
    expect(getCalendarEventTitle(event)).toBe("Team check-in");
    expect(event.title).toBe("Untitled Event");
  });
});
