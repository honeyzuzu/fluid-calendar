export const DAILY_INTENTION_UPDATED_EVENT = "sunnie:daily-intention-updated";

export type IntentionQuote = {
  text: string;
  author: string;
};

export const INTENTION_QUOTES: IntentionQuote[] = [
  { text: "Forever is composed of nows.", author: "Emily Dickinson" },
  {
    text: "Nothing great was ever achieved without enthusiasm.",
    author: "Ralph Waldo Emerson",
  },
  {
    text: "For the great doesn't happen through impulse alone, and is a succession of little things that are brought together.",
    author: "Vincent van Gogh",
  },
  {
    text: "The most effective way to do it is to do it.",
    author: "Amelia Earhart",
  },
  {
    text: "If there is no struggle, there is no progress.",
    author: "Frederick Douglass",
  },
  {
    text: "The sun himself is weak when he first rises, and gathers strength and courage as the day gets on.",
    author: "Charles Dickens",
  },
];

export function formatIntentionQuote(quote: IntentionQuote) {
  return `\u201c${quote.text}\u201d \u2014 ${quote.author}`;
}

export function randomIntentionQuote(
  current = "",
  random: () => number = Math.random
) {
  const available = INTENTION_QUOTES.filter(
    (quote) => formatIntentionQuote(quote) !== current
  );
  const choices = available.length ? available : INTENTION_QUOTES;
  const index = Math.min(
    choices.length - 1,
    Math.floor(random() * choices.length)
  );
  return formatIntentionQuote(choices[index]);
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
