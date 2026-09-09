import type { WeeklyReviewData } from "./WeeklyReview";

export const weeklyReviewPreview: WeeklyReviewData = {
  week: "2026-08-31",
  currentWeek: "2026-09-07",
  timeZone: "America/New_York",
  review: {
    goodThings:
      "I made space for a walk with Maya and finished the little things I kept putting off.",
    makeEasier: "Leave a little more breathing room between appointments.",
    nextPriorities: "Finish the photo album. Make time for friends.",
    calendarIds: ["personal"],
    excludedEventIds: [],
    completedAt: null,
  },
  completed: [
    {
      id: "one",
      title: "Send Maya the trip dates",
      completedAt: "2026-09-02T18:00:00Z",
      duration: 15,
      plannedWeekStart: "2026-08-31",
      rolloverCount: 0,
      scheduleLocked: false,
    },
    {
      id: "two",
      title: "Finish homepage illustrations",
      completedAt: "2026-09-04T16:00:00Z",
      duration: 60,
      plannedWeekStart: "2026-08-31",
      rolloverCount: 0,
      scheduleLocked: false,
    },
  ],
  nextCursor: null,
  unfinished: [
    {
      id: "three",
      title: "Organize the photo album",
      completedAt: null,
      duration: 30,
      plannedWeekStart: "2026-09-07",
      rolloverCount: 3,
      scheduleLocked: false,
    },
  ],
  calendars: [
    { id: "personal", name: "Personal", enabled: true, color: "#a8c9a1" },
  ],
  events: [
    {
      id: "walk",
      feedId: "personal",
      title: "Garden walk with Maya",
      start: "2026-09-03T17:00:00Z",
      end: "2026-09-03T18:00:00Z",
      allDay: false,
    },
    {
      id: "dinner",
      feedId: "personal",
      title: "Friday dinner",
      start: "2026-09-04T22:00:00Z",
      end: "2026-09-04T23:30:00Z",
      allDay: false,
    },
  ],
};
