import { getDueDateShortcuts } from "@/lib/due-date-shortcuts";

describe("Task Tune-up due-date shortcuts", () => {
  it("builds upcoming calendar choices from the account date", () => {
    const choices = getDueDateShortcuts(
      new Date("2026-09-16T16:00:00.000Z"),
      "America/New_York"
    );
    const dates = Object.fromEntries(
      choices.map((choice) => [choice.id, choice.date])
    );

    expect(dates).toEqual({
      today: "2026-09-16",
      tomorrow: "2026-09-17",
      "this-weekend": "2026-09-20",
      "next-week": "2026-09-27",
      monday: "2026-09-21",
      tuesday: "2026-09-22",
      wednesday: "2026-09-23",
      thursday: "2026-09-17",
      friday: "2026-09-18",
    });
  });

  it("uses the saved timezone when the same instant spans two dates", () => {
    const instant = new Date("2026-09-21T02:00:00.000Z");
    const newYork = getDueDateShortcuts(instant, "America/New_York");
    const tokyo = getDueDateShortcuts(instant, "Asia/Tokyo");

    expect(newYork[0].date).toBe("2026-09-20");
    expect(tokyo[0].date).toBe("2026-09-21");
  });

  it("keeps this weekend on today when today is Sunday", () => {
    const choices = getDueDateShortcuts(
      new Date("2026-09-20T16:00:00.000Z"),
      "America/New_York"
    );

    expect(choices.find((choice) => choice.id === "this-weekend")?.date).toBe(
      "2026-09-20"
    );
    expect(choices.find((choice) => choice.id === "next-week")?.date).toBe(
      "2026-09-27"
    );
  });
});
