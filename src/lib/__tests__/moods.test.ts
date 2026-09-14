import { isMoodDateKey, parseMoodInput, parseMoodMonth } from "@/lib/moods";

describe("mood check-in validation", () => {
  it("accepts real days and bounded calendar months", () => {
    expect(isMoodDateKey("2028-02-29")).toBe(true);
    expect(isMoodDateKey("2027-02-29")).toBe(false);
    expect(parseMoodMonth("2026-09")).toEqual({
      start: new Date("2026-09-01T00:00:00.000Z"),
      end: new Date("2026-10-01T00:00:00.000Z"),
    });
    expect(parseMoodMonth("2026-13")).toBeNull();
  });

  it("keeps the scale non-freeform and trims private notes", () => {
    expect(
      parseMoodInput({
        date: "2026-09-14",
        phase: "rise",
        mood: 3,
        energy: 2,
        note: "  Taking it gently  ",
      })
    ).toEqual({
      date: "2026-09-14",
      phase: "rise",
      mood: 3,
      energy: 2,
      note: "Taking it gently",
    });
    expect(
      parseMoodInput({ date: "2026-09-14", phase: "rise", mood: 0 })
    ).toBeNull();
    expect(
      parseMoodInput({ date: "2026-09-14", phase: "later", mood: 3 })
    ).toBeNull();
    expect(
      parseMoodInput({
        date: "2026-09-14",
        phase: "unwind",
        mood: null,
      })
    ).toEqual({
      date: "2026-09-14",
      phase: "unwind",
      mood: null,
      energy: null,
      note: "",
    });
  });
});
