import type { IntentionQuote } from "@/lib/daily-intention";

export const CURRENT_ONBOARDING_VERSION = 2;
export const ONBOARDING_SESSION_KEY = `sunnie:onboarding-v${CURRENT_ONBOARDING_VERSION}-step`;

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href?: string;
  quote: IntentionQuote;
  layout: "setup" | "tour";
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Sunnie!",
    description:
      "Let's make Sunnie feel like yours, then take a tiny tour together.",
    quote: {
      text: "Forever is composed of nows.",
      author: "Emily Dickinson",
    },
    layout: "setup",
  },
  {
    id: "connect",
    title: "Let's connect your calendar",
    description:
      "Connect Google, Apple, or another CalDAV calendar. Add as many accounts as you want.",
    quote: {
      text: "The most effective way to do it is to do it.",
      author: "Amelia Earhart",
    },
    layout: "setup",
  },
  {
    id: "choose-calendars",
    title: "Choose what Sunnie should show",
    description:
      "Keep the calendars you want enabled. You can change this anytime in Settings.",
    quote: {
      text: "For the great doesn't happen through impulse alone, and is a succession of little things that are brought together.",
      author: "Vincent van Gogh",
    },
    layout: "setup",
  },
  {
    id: "sleep-hours",
    title: "Protect your time to rest",
    description:
      "Add your usual bedtime and wake-up time so Sunnie knows when your day should truly be yours.",
    quote: {
      text: "There is a time for many words, and there is also a time for sleep.",
      author: "Homer",
    },
    layout: "setup",
  },
  {
    id: "calendar",
    title: "Your whole schedule, together",
    description:
      "Calendar combines your connected events and scheduled tasks. Tap an empty time or Add event to make something new.",
    href: "/calendar",
    quote: {
      text: "The sun himself is weak when he first rises, and gathers strength and courage as the day gets on.",
      author: "Charles Dickens",
    },
    layout: "tour",
  },
  {
    id: "tasks",
    title: "Tasks hold the useful details",
    description:
      "Add duration, priority, energy, and a preferred time so Sunnie can plan around your real day.",
    href: "/tasks",
    quote: {
      text: "Nothing great was ever achieved without enthusiasm.",
      author: "Ralph Waldo Emerson",
    },
    layout: "tour",
  },
  {
    id: "practice-task",
    title: "Make a task to focus on",
    description:
      "Create one small practice task here. Sunnie will carry it into Focus so you can try the setup, focus, and break timers.",
    href: "/tasks",
    quote: {
      text: "The secret of getting ahead is getting started.",
      author: "Mark Twain",
    },
    layout: "tour",
  },
  {
    id: "focus",
    title: "Now, one thing at a time",
    description:
      "Your practice task is ready. Choose setup, focus, and break lengths together, then start when your space feels calm.",
    href: "/focus",
    quote: {
      text: "The most effective way to do it is to do it.",
      author: "Amelia Earhart",
    },
    layout: "tour",
  },
  {
    id: "brain-dump",
    title: "Empty your head quickly",
    description:
      "Brain Dump turns each thought on its own line into a task. Tune-up helps fill in anything the task is missing.",
    href: "/brain-dump",
    quote: {
      text: "For the great doesn't happen through impulse alone, and is a succession of little things that are brought together.",
      author: "Vincent van Gogh",
    },
    layout: "tour",
  },
  {
    id: "plan",
    title: "Choose the shape of your day",
    description:
      "Plan moves tasks from your backlog into this week and today. Set an intention, then schedule a day or the whole week.",
    href: "/plan",
    quote: {
      text: "Forever is composed of nows.",
      author: "Emily Dickinson",
    },
    layout: "tour",
  },
  {
    id: "friends",
    title: "Plan with your people",
    description:
      "Friends can share busy times or event details. Each person stays in control of what the other can see.",
    href: "/friends",
    quote: {
      text: "If there is no struggle, there is no progress.",
      author: "Frederick Douglass",
    },
    layout: "tour",
  },
];

export const SLEEP_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "sleep-hours",
    title: "A new way to protect your rest",
    description:
      "Tell Sunnie your usual sleep hours. This is a quick, one-time setup and you can change it in Settings anytime.",
    quote: {
      text: "There is a time for many words, and there is also a time for sleep.",
      author: "Homer",
    },
    layout: "setup",
  },
];

export function clampOnboardingStep(
  value: number,
  stepCount = ONBOARDING_STEPS.length
) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(stepCount - 1, Math.max(0, Math.floor(value)));
}
