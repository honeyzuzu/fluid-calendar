import {
  FOCUS_PETS,
  formatFocusTime,
  nextPhaseAfterTimer,
  petMessage,
} from "@/lib/focus-session";

describe("focus sessions", () => {
  it("formats countdowns without allowing negative time", () => {
    expect(formatFocusTime(1500)).toBe("25:00");
    expect(formatFocusTime(61)).toBe("01:01");
    expect(formatFocusTime(-4)).toBe("00:00");
  });

  it("moves through setup, focus, and break phases", () => {
    expect(nextPhaseAfterTimer("setup")).toBe("focus-ready");
    expect(nextPhaseAfterTimer("focus")).toBe("break-ready");
    expect(nextPhaseAfterTimer("break")).toBe("complete");
  });

  it("gives every pet a distinct, encouraging identity", () => {
    expect(FOCUS_PETS.length).toBeGreaterThanOrEqual(5);
    expect(new Set(FOCUS_PETS.map((pet) => pet.id)).size).toBe(
      FOCUS_PETS.length
    );
    for (const pet of FOCUS_PETS) {
      expect(pet.name).not.toBe("");
      expect(pet.encouragement).not.toBe("");
      expect(petMessage("focus", pet, false)).not.toBe("");
    }
  });
});
