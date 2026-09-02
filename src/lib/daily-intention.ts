export const DAILY_INTENTION_UPDATED_EVENT = "sunnie:daily-intention-updated";
const RECENT_QUOTES_KEY = "sunnie-recent-intention-quotes";
const RECENT_QUOTE_LIMIT = 10;

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
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  {
    text: "Diligence is the mother of good luck.",
    author: "Benjamin Franklin",
  },
  { text: "Dwell in possibility.", author: "Emily Dickinson" },
  {
    text: "Hope is the thing with feathers that perches in the soul.",
    author: "Emily Dickinson",
  },
  {
    text: "Adopt the pace of nature: her secret is patience.",
    author: "Ralph Waldo Emerson",
  },
  {
    text: "Write it on your heart that every day is the best day in the year.",
    author: "Ralph Waldo Emerson",
  },
  {
    text: "The world is but a canvas to our imagination.",
    author: "Henry David Thoreau",
  },
  {
    text: "Go confidently in the direction of your dreams.",
    author: "Henry David Thoreau",
  },
  {
    text: "I am not afraid of storms, for I am learning how to sail my ship.",
    author: "Louisa May Alcott",
  },
  {
    text: "There is no charm equal to tenderness of heart.",
    author: "Jane Austen",
  },
  {
    text: "I am no bird; and no net ensnares me.",
    author: "Charlotte Brontë",
  },
  {
    text: "Wisely and slow; they stumble that run fast.",
    author: "William Shakespeare",
  },
  {
    text: "Our doubts are traitors, and make us lose the good we oft might win.",
    author: "William Shakespeare",
  },
  {
    text: "They can because they think they can.",
    author: "Virgil",
  },
  {
    text: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
  },
  {
    text: "Take rest; a field that has rested gives a bountiful crop.",
    author: "Ovid",
  },
  {
    text: "Nothing in life is to be feared; it is only to be understood.",
    author: "Marie Curie",
  },
  {
    text: "Optimism is the faith that leads to achievement.",
    author: "Helen Keller",
  },
  {
    text: "Alone we can do so little; together we can do so much.",
    author: "Helen Keller",
  },
  {
    text: "If you want to lift yourself up, lift up someone else.",
    author: "Booker T. Washington",
  },
  {
    text: "Act as if what you do makes a difference. It does.",
    author: "William James",
  },
  {
    text: "The best way out is always through.",
    author: "Robert Frost",
  },
  {
    text: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
    author: "Robert Louis Stevenson",
  },
  {
    text: "We are all in the gutter, but some of us are looking at the stars.",
    author: "Oscar Wilde",
  },
  {
    text: "There is only one happiness in this life, to love and be loved.",
    author: "George Sand",
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  { text: "Nothing will work unless you do.", author: "Maya Angelou" },
  {
    text: "Try to be a rainbow in someone's cloud.",
    author: "Maya Angelou",
  },
  {
    text: "You can't cross the sea merely by standing and staring at the water.",
    author: "Rabindranath Tagore",
  },
];

export function formatIntentionQuote(quote: IntentionQuote) {
  return `\u201c${quote.text}\u201d \u2014 ${quote.author}`;
}

export function randomIntentionQuote(
  current = "",
  random: () => number = Math.random
) {
  let recent: string[] = [];
  if (typeof window !== "undefined") {
    try {
      recent = JSON.parse(
        window.localStorage.getItem(RECENT_QUOTES_KEY) || "[]"
      ) as string[];
    } catch {
      recent = [];
    }
  }
  const recentlyUsed = new Set([...recent, current]);
  const fresh = INTENTION_QUOTES.filter(
    (quote) => !recentlyUsed.has(formatIntentionQuote(quote))
  );
  const available = INTENTION_QUOTES.filter(
    (quote) => formatIntentionQuote(quote) !== current
  );
  const choices = fresh.length
    ? fresh
    : available.length
      ? available
      : INTENTION_QUOTES;
  const index = Math.min(
    choices.length - 1,
    Math.floor(random() * choices.length)
  );
  const selected = formatIntentionQuote(choices[index]);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        RECENT_QUOTES_KEY,
        JSON.stringify([...recent, selected].slice(-RECENT_QUOTE_LIMIT))
      );
    } catch {
      // Quotes still work when browser storage is unavailable.
    }
  }
  return selected;
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
