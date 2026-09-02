import { getReadableTextColor } from "@/lib/color-contrast";

describe("automatic colored-tile text contrast", () => {
  it("prefers warm white on dark colors", () => {
    expect(getReadableTextColor("#315C4B")).toBe("#FFFDF7");
    expect(getReadableTextColor("#3F4A78")).toBe("#FFFDF7");
  });

  it("switches to soft black when white contrast is too low", () => {
    expect(getReadableTextColor("#F9DA94")).toBe("#313526");
    expect(getReadableTextColor("#A7ACE0")).toBe("#313526");
  });

  it("uses soft black for missing or unsupported colors", () => {
    expect(getReadableTextColor(null)).toBe("#313526");
    expect(getReadableTextColor("var(--muted)")).toBe("#313526");
  });
});
