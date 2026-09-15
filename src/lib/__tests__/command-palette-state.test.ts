import { shouldShowCommandEmptyState } from "@/lib/command-palette-state";

describe("command palette empty state", () => {
  it("does not contradict zero-query recommendations", () => {
    expect(shouldShowCommandEmptyState("", 0)).toBe(false);
    expect(shouldShowCommandEmptyState("   ", 0)).toBe(false);
  });

  it("appears only after a non-empty search has no matches", () => {
    expect(shouldShowCommandEmptyState("missing", 0)).toBe(true);
    expect(shouldShowCommandEmptyState("calendar", 1)).toBe(false);
  });
});
