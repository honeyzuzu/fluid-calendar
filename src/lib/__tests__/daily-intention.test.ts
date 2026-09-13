import {
  INTENTION_QUOTES,
  dateKeyInTimeZone,
  formatIntentionQuote,
  localDateKey,
  randomIntentionQuote,
} from "@/lib/daily-intention";

describe("daily intention quotes", () => {
  it("keeps a named author with every quote", () => {
    expect(INTENTION_QUOTES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(INTENTION_QUOTES.map(formatIntentionQuote)).size).toBe(
      INTENTION_QUOTES.length
    );
    for (const quote of INTENTION_QUOTES) {
      expect(quote.text.trim()).not.toBe("");
      expect(quote.author.trim()).not.toBe("");
      expect(formatIntentionQuote(quote)).toContain(`— ${quote.author}`);
    }
  });

  it("does not repeat the current quote when another is available", () => {
    const current = formatIntentionQuote(INTENTION_QUOTES[0]);
    expect(randomIntentionQuote(current, () => 0)).not.toBe(current);
  });

  it("formats a browser-local date key", () => {
    expect(localDateKey(new Date(2026, 8, 3, 23, 30))).toBe("2026-09-03");
  });

  it("formats today in the configured account timezone", () => {
    const instant = new Date("2026-09-04T02:30:00.000Z");
    expect(dateKeyInTimeZone(instant, "America/New_York")).toBe("2026-09-03");
    expect(dateKeyInTimeZone(instant, "Asia/Tokyo")).toBe("2026-09-04");
  });
});
