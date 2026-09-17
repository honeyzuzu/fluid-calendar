"use client";

import {
  MobileWeekAgenda,
  type MobileWeekItem,
} from "@/components/calendar/MobileWeekAgenda";

import { getMobileWeekDays } from "@/lib/mobile-week";

const selectedDate = new Date("2026-09-17T16:00:00.000Z");
const days = getMobileWeekDays(selectedDate, "America/New_York", "sunday");
const friendBlock = (
  id: string,
  owner: string,
  start: string,
  end: string,
  color: string
): MobileWeekItem => ({
  id: `friend-${id}-${start}`,
  title: "",
  start: new Date(start),
  end: new Date(end),
  allDay: false,
  backgroundColor: color,
  extendedProps: { isFriendEvent: true, friendId: id, friendOwner: owner },
});
const items: MobileWeekItem[] = [
  {
    id: "1",
    title: "Plan the garden and pick up herbs for the weekend",
    start: new Date("2026-09-17T13:00:00.000Z"),
    end: new Date("2026-09-17T14:00:00.000Z"),
    allDay: false,
    backgroundColor: "#8eab79",
    extendedProps: { isTask: true },
  },
  {
    id: "2",
    title: "Catch up with Maya over coffee",
    start: new Date("2026-09-17T14:30:00.000Z"),
    end: new Date("2026-09-17T15:30:00.000Z"),
    allDay: false,
    backgroundColor: "#edac91",
  },
  {
    id: "3",
    title:
      "An afternoon workshop with an especially long event name that should stay readable",
    start: new Date("2026-09-17T16:00:00.000Z"),
    end: new Date("2026-09-17T18:00:00.000Z"),
    allDay: false,
    backgroundColor: "#a2badc",
  },
  {
    id: "4",
    title: "Farmers market",
    start: new Date("2026-09-19T04:00:00.000Z"),
    end: new Date("2026-09-20T04:00:00.000Z"),
    allDay: true,
    backgroundColor: "#e5ba69",
  },
  friendBlock(
    "maya",
    "Maya",
    "2026-09-17T12:00:00Z",
    "2026-09-17T14:00:00Z",
    "#c4a6d4"
  ),
  friendBlock(
    "maya",
    "Maya",
    "2026-09-17T13:30:00Z",
    "2026-09-17T15:00:00Z",
    "#c4a6d4"
  ),
  friendBlock(
    "maya",
    "Maya",
    "2026-09-17T16:00:00Z",
    "2026-09-17T18:00:00Z",
    "#c4a6d4"
  ),
  friendBlock(
    "maya",
    "Maya",
    "2026-09-17T19:00:00Z",
    "2026-09-17T20:00:00Z",
    "#c4a6d4"
  ),
  friendBlock(
    "lee",
    "Lee",
    "2026-09-17T14:00:00Z",
    "2026-09-17T17:00:00Z",
    "#8abbb0"
  ),
  friendBlock(
    "lee",
    "Lee",
    "2026-09-17T18:00:00Z",
    "2026-09-17T21:00:00Z",
    "#8abbb0"
  ),
  friendBlock(
    "maya",
    "Maya",
    "2026-09-18T13:00:00Z",
    "2026-09-18T19:00:00Z",
    "#c4a6d4"
  ),
];

export default function MobileWeekPreview() {
  return (
    <main
      data-discord-preview-ready
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
    >
      <header className="border-b border-border bg-card px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Sunnie Calendar
        </p>
        <h1 className="text-lg font-semibold text-foreground">Sep 13 – 19</h1>
      </header>
      <div className="min-h-0 flex-1">
        <MobileWeekAgenda
          days={days}
          items={items}
          selectedDate={selectedDate}
          timeZone="America/New_York"
          timeFormat="12h"
          onOpenDay={() => undefined}
          onOpenItem={() => undefined}
        />
      </div>
    </main>
  );
}
