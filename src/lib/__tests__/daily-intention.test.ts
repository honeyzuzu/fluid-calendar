import {
  INTENTION_QUOTES,
  formatIntentionQuote,
  localDateKey,
  randomIntentionQuote,
} from "@/lib/daily-intention";

describe("daily intention quotes", () => {
  it("keeps a named author with every quote", () => {
    expect(INTENTION_QUOTES.length).toBeGreaterThan(5);
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
});
