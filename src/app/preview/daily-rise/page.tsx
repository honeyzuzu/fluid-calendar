"use client";

import { DailyRise } from "@/components/planning/DailyRhythm";

const todayTasks = [
  {
    id: "one",
    title: "Finish homepage illustrations",
    status: "todo",
    duration: 60,
  },
  {
    id: "two",
    title: "Send Maya the trip dates",
    status: "todo",
    duration: 15,
  },
];

export default function DailyRisePreview() {
  return (
    <main data-discord-preview-ready className="min-h-screen bg-[#fff9e8]">
      <DailyRise
        open
        onOpenChange={() => undefined}
        dateLabel="Saturday, September 12"
        initialIntention="Finish the important thing, then leave room for friends."
        todayTasks={todayTasks}
        carryoverTasks={[]}
        availableTasks={[
          {
            id: "three",
            title: "Plan Friday dinner",
            status: "todo",
            duration: 30,
          },
          {
            id: "four",
            title: "Book dentist appointment",
            status: "todo",
            duration: 20,
          },
        ]}
        capacityMessage="3 hours and 10 minutes still open for breaks and surprises."
        busy={false}
        onAddTask={async () => undefined}
        onDurationChange={async () => undefined}
        onSchedule={async () => undefined}
        onFinish={async () => undefined}
      />
    </main>
  );
}
