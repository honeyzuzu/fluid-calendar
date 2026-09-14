import {
  getHarmonizedTextColor,
  getReadableTextColor,
  hasReadableContrast,
} from "@/lib/color-contrast";

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

  it("detects borderline foreground pairs before applying theme tokens", () => {
    expect(hasReadableContrast("#FBFAF3", "#647A59")).toBe(false);
    expect(hasReadableContrast("#FFFDF7", "#647A59")).toBe(true);
  });

  it("creates accessible dark swatch-relative text on pale items", () => {
    const foreground = getHarmonizedTextColor("#F9DA94", {
      darkColor: "#3F432E",
      lightColor: "#FFFDF5",
    });

    expect(foreground).not.toBe("#313526");
    expect(hasReadableContrast(foreground, "#F9DA94")).toBe(true);
  });

  it("creates accessible light swatch-relative text on dark items", () => {
    const foreground = getHarmonizedTextColor("#315C4B", {
      darkColor: "#3F432E",
      lightColor: "#FFFDF5",
    });

    expect(foreground).not.toBe("#FFFDF7");
    expect(hasReadableContrast(foreground, "#315C4B")).toBe(true);
  });

  it("darkens an outline swatch against the theme paper", () => {
    const foreground = getHarmonizedTextColor("#FBF9FA", {
      tintColor: "#91B4C4",
      darkColor: "#303746",
      lightColor: "#FBF9FA",
    });

    expect(foreground).not.toBe("#91B4C4");
    expect(hasReadableContrast(foreground, "#FBF9FA")).toBe(true);
  });
});
