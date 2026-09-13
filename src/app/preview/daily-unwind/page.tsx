"use client";

import { useState } from "react";

import { DailyUnwind } from "@/components/planning/DailyRhythm";

export default function DailyUnwindPreview() {
  const [unfinished, setUnfinished] = useState([
    {
      id: "three",
      title: "Plan Friday dinner",
      status: "todo",
      duration: 30,
    },
  ]);
  return (
    <main data-discord-preview-ready className="min-h-screen bg-[#f4eadf]">
      <DailyUnwind
        open
        onOpenChange={() => undefined}
        completedTasks={[
          {
            id: "one",
            title: "Finish homepage illustrations",
            status: "completed",
            duration: 60,
          },
          {
            id: "two",
            title: "Send Maya the trip dates",
            status: "completed",
            duration: 15,
          },
        ]}
        unfinishedTasks={unfinished}
        endedEvents={[
          {
            id: "event-one",
            title: "Design catch-up",
            start: "2026-09-12T14:00:00Z",
            end: "2026-09-12T14:30:00Z",
            calendarName: "Sunnie Planner",
          },
          {
            id: "event-two",
            title: "Lunch with Maya",
            start: "2026-09-12T16:00:00Z",
            end: "2026-09-12T17:00:00Z",
            calendarName: "Personal",
          },
        ]}
        timeZone="America/New_York"
        initialVibe="soft"
        initialReflection=""
        earliestTaskDate="2026-09-13"
        busy={false}
        onTaskAction={async (task) =>
          setUnfinished((current) =>
            current.filter((item) => item.id !== task.id)
          )
        }
        onFinish={async () => undefined}
      />
    </main>
  );
}
