import {
  FOCUS_PETS,
  SETUP_DURATIONS,
  formatFocusTime,
  nextPhaseAfterTimer,
  petMessage,
  phaseAfterEndingEarly,
  startingPhaseForSetup,
  suggestFocusRhythm,
} from "@/lib/focus-session";

describe("focus sessions", () => {
  it("formats countdowns without allowing negative time", () => {
    expect(formatFocusTime(1500)).toBe("25:00");
    expect(formatFocusTime(61)).toBe("01:01");
    expect(formatFocusTime(-4)).toBe("00:00");
  });

  it("cancels setup and never treats an early focus end as completion", () => {
    expect(phaseAfterEndingEarly("setup")).toBe("setup-ready");
    expect(phaseAfterEndingEarly("focus")).toBe("break-ready");
    expect(phaseAfterEndingEarly("break")).toBe("complete");
  });

  it("moves through setup, focus, and break phases", () => {
    expect(nextPhaseAfterTimer("setup")).toBe("focus");
    expect(nextPhaseAfterTimer("focus")).toBe("break-ready");
    expect(nextPhaseAfterTimer("break")).toBe("complete");
  });

  it("allows setup to be skipped without abandoning the focus round", () => {
    expect(SETUP_DURATIONS).toContain(0);
    expect(startingPhaseForSetup(0)).toBe("focus");
    expect(startingPhaseForSetup(5)).toBe("setup");
  });

  it("suggests a complete rhythm without counting breaks as task time", () => {
    expect(suggestFocusRhythm(60)).toEqual({
      taskMinutes: 60,
      setupMinutes: 5,
      focusMinutes: [25, 30],
      breakMinutes: 5,
      elapsedMinutes: 65,
    });
    expect(suggestFocusRhythm(90)).toEqual({
      taskMinutes: 90,
      setupMinutes: 5,
      focusMinutes: [25, 30, 30],
      breakMinutes: 5,
      elapsedMinutes: 100,
    });
    expect(suggestFocusRhythm(120)?.focusMinutes).toEqual([25, 30, 30, 30]);
    expect(suggestFocusRhythm(180)?.elapsedMinutes).toBe(205);
  });

  it("keeps shorter estimates in one approachable session", () => {
    expect(suggestFocusRhythm(15)?.focusMinutes).toEqual([15]);
    expect(suggestFocusRhythm(30)?.focusMinutes).toEqual([25]);
    expect(suggestFocusRhythm(45)?.focusMinutes).toEqual([40]);
    expect(suggestFocusRhythm(null)).toBeNull();
    expect(suggestFocusRhythm(240)).toBeNull();
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
