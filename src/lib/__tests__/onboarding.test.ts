import {
  CURRENT_ONBOARDING_VERSION,
  ONBOARDING_STEPS,
  clampOnboardingStep,
} from "@/lib/onboarding";

describe("Sunnie onboarding", () => {
  it("uses a positive version so existing accounts start incomplete", () => {
    expect(CURRENT_ONBOARDING_VERSION).toBeGreaterThan(0);
  });

  it("keeps setup before the page tour and gives every step a quote", () => {
    const firstTourStep = ONBOARDING_STEPS.findIndex(
      (step) => step.layout === "tour"
    );

    expect(firstTourStep).toBeGreaterThan(0);
    expect(
      ONBOARDING_STEPS.slice(0, firstTourStep).every(
        (step) => step.layout === "setup"
      )
    ).toBe(true);
    expect(
      ONBOARDING_STEPS.every(
        (step) => step.quote.text.trim() && step.quote.author.trim()
      )
    ).toBe(true);
    expect(new Set(ONBOARDING_STEPS.map((step) => step.id)).size).toBe(
      ONBOARDING_STEPS.length
    );
  });

  it("keeps restored progress inside the current tour", () => {
    expect(clampOnboardingStep(-10)).toBe(0);
    expect(clampOnboardingStep(Number.NaN)).toBe(0);
    expect(clampOnboardingStep(999)).toBe(ONBOARDING_STEPS.length - 1);
  });
});
