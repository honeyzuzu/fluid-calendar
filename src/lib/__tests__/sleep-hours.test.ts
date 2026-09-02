import { overlapsSleepHours } from "@/lib/sleep-hours";

const overnight = { start: "23:00", end: "07:00", configured: true };

describe("sleep hours", () => {
  it("blocks slots during either side of an overnight sleep window", () => {
    expect(
      overlapsSleepHours(
        new Date(2026, 8, 3, 23, 30),
        new Date(2026, 8, 4, 0, 30),
        overnight
      )
    ).toBe(true);
    expect(
      overlapsSleepHours(
        new Date(2026, 8, 4, 6, 30),
        new Date(2026, 8, 4, 7, 30),
        overnight
      )
    ).toBe(true);
  });

  it("allows slots outside sleep and treats boundaries as available", () => {
    expect(
      overlapsSleepHours(
        new Date(2026, 8, 4, 7, 0),
        new Date(2026, 8, 4, 8, 0),
        overnight
      )
    ).toBe(false);
    expect(
      overlapsSleepHours(
        new Date(2026, 8, 4, 22, 0),
        new Date(2026, 8, 4, 23, 0),
        overnight
      )
    ).toBe(false);
  });

  it("does not enforce defaults before the user configures them", () => {
    expect(
      overlapsSleepHours(
        new Date(2026, 8, 4, 23, 30),
        new Date(2026, 8, 5, 0, 30),
        { ...overnight, configured: false }
      )
    ).toBe(false);
  });

  it("supports daytime sleep windows", () => {
    expect(
      overlapsSleepHours(
        new Date(2026, 8, 4, 13, 0),
        new Date(2026, 8, 4, 14, 0),
        { start: "12:00", end: "16:00", configured: true }
      )
    ).toBe(true);
  });
});
