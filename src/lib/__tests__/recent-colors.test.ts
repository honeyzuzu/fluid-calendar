import { addRecentColor, MAX_RECENT_COLORS } from "../recent-colors";

describe("addRecentColor", () => {
  it("puts the newest custom color first and removes duplicates", () => {
    expect(addRecentColor(["#112233", "#AABBCC"], "#aabbcc")).toEqual([
      "#AABBCC",
      "#112233",
    ]);
  });

  it("does not save built-in palette colors", () => {
    expect(addRecentColor(["#112233"], "#F6D77A", ["#F6D77A"])).toEqual([
      "#112233",
    ]);
  });

  it("keeps only the most recent quick-access colors", () => {
    const colors = Array.from(
      { length: MAX_RECENT_COLORS },
      (_, index) => `#00000${index}`
    );

    expect(addRecentColor(colors, "#ABCDEF")).toHaveLength(MAX_RECENT_COLORS);
    expect(addRecentColor(colors, "#ABCDEF")[0]).toBe("#ABCDEF");
  });
});
