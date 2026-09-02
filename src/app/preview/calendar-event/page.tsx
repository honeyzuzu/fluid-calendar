import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Menu,
  Palette,
  Plus,
  Sun,
  Trash2,
} from "lucide-react";

import { SUNNIE_EVENT_COLOR_GROUPS } from "@/lib/calendar-colors";

const days = ["Mon 31", "Tue 1", "Wed 2", "Thu 3", "Fri 4"];
const hours = [
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
];

export default function CalendarEventPreviewPage() {
  return (
    <main
      data-discord-preview-ready
      className="min-h-screen overflow-hidden bg-[#fff9e8] text-[#3f432e]"
    >
      <header className="flex h-16 items-center justify-between border-b border-[#dce5c8] bg-[#fffdf4] px-5 lg:px-7">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5 text-lg font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f4c85b] text-[#5a4819] shadow-[0_3px_0_#d99e33]">
              <Sun className="h-5 w-5" />
            </span>
            Sunnie Planner
          </div>
          <nav className="hidden gap-1 text-sm text-black/48 md:flex">
            {[
              "Plan",
              "Calendar",
              "Tasks",
              "Brain Dump",
              "Friends",
              "Focus",
            ].map((item) => (
              <span
                key={item}
                className={`rounded-xl px-3 py-2 font-medium ${item === "Calendar" ? "bg-[#f8e4a1] text-[#77591d]" : ""}`}
              >
                {item}
              </span>
            ))}
          </nav>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d9cdf2] text-sm font-semibold text-[#51416e]">
          Q
        </span>
      </header>

      <section className="flex h-[calc(100vh-4rem)] min-w-[780px] flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-[#dce5c8] bg-white/60 px-5">
          <Menu className="h-5 w-5" />
          <button className="rounded-lg bg-white/80 px-3 py-2 text-sm shadow-sm">
            Today
          </button>
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <h1 className="text-xl font-semibold">August 31 – September 4</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#64734a] px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_0_#465331]">
              <Plus className="h-4 w-4" /> Add event
            </span>
            <span className="rounded-xl bg-[#f8e4a1] px-3 py-2 text-sm font-semibold text-[#77591d]">
              Week
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[#e5e1cc] bg-[#fffdf5] px-5 py-2.5">
          <p className="text-xs text-black/48">
            Short tasks keep their full line height and show the complete name
            on hover.
          </p>
          <div className="flex items-center gap-3 text-[11px] font-medium text-black/48">
            <Legend color="#f7beb5" label="High" />
            <Legend color="#f9da94" label="Medium" />
            <Legend color="#c1e0cb" label="Low" />
            <Legend color="#d9cfee" label="No priority" />
          </div>
        </div>

        <div className="grid grid-cols-[70px_repeat(5,minmax(0,1fr))] border-b border-[#e5e1cc] bg-[#fffdf7]">
          <div />
          {days.map((day, index) => (
            <div
              key={day}
              className={`border-l border-[#e5e1cc] py-3 text-center text-sm font-semibold ${index === 3 ? "bg-[#fff4c9]/55 text-[#795f25]" : ""}`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="relative flex-1 bg-[#fffdf8]">
          <div className="absolute inset-0 grid grid-cols-[70px_repeat(5,minmax(0,1fr))] grid-rows-8">
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b border-[#e8e4d4] pr-2 pt-1 text-right text-[11px] text-black/38"
              >
                {hour}
              </div>
            ))}
            {Array.from({ length: 40 }, (_, index) => (
              <div key={index} className="border-b border-l border-[#e8e4d4]" />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0 grid grid-cols-[70px_repeat(5,minmax(0,1fr))] grid-rows-[repeat(32,minmax(0,1fr))] gap-x-1 px-1">
            <TaskBlock
              className="col-start-2 row-start-4 row-span-1"
              title="Reply to Maya about dinner"
              tone="high"
              compact
            />
            <TaskBlock
              className="col-start-3 row-start-7 row-span-4"
              title="Review calendar sync"
              tone="medium"
            />
            <TaskBlock
              className="col-start-4 row-start-13 row-span-3"
              title="Pick up groceries"
              tone="low"
            />
            <TaskBlock
              className="col-start-5 row-start-18 row-span-4"
              title="Outline September goals"
              tone="none"
            />
            <TaskBlock
              className="col-start-6 row-start-24 row-span-2"
              title="Send weekly recap"
              tone="medium"
            />
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed inset-0 z-20 bg-[#3f432e]/10 backdrop-blur-[1px]" />
      <aside className="fixed left-1/2 top-1/2 z-30 w-[620px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-[#dfdac2] bg-[#fffdf5] shadow-[0_24px_70px_rgba(63,67,46,0.25)]">
        <div className="border-b border-black/[0.06] px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#d0902f]">
            Make it feel like yours
          </p>
          <h2 className="mt-1 text-xl font-bold">Edit event</h2>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <PreviewField label="Title *" value="Dinner with Maya" />
            <PreviewField label="Calendar *" value="Personal calendar" />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Palette className="h-4 w-4 text-[#6d7755]" /> Event color
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-white/65 p-3">
              <p className="mb-3 text-xs text-black/45">
                Pick a mood for this event. Task urgency colors stay separate.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SUNNIE_EVENT_COLOR_GROUPS.map((group) => (
                  <div
                    key={group.name}
                    className="rounded-xl bg-[#f8f6ed] p-2.5"
                  >
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-black/40">
                      {group.name}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {group.colors.map((color, index) => (
                        <span
                          key={color.value}
                          className={`grid aspect-square place-items-center rounded-[10px] border border-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ${group.name === "Sunset & earth" && index === 0 ? "ring-2 ring-[#4f5c3d] ring-offset-2" : ""}`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        >
                          {group.name === "Sunset & earth" && index === 0 && (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-black/[0.06] px-6 py-4">
          <span className="inline-flex items-center gap-2 rounded-xl bg-[#f8ddd2] px-3 py-2 text-sm font-semibold text-[#9b513f]">
            <Trash2 className="h-4 w-4" /> Delete
          </span>
          <div className="flex gap-2">
            <span className="rounded-xl border border-[#ddd8c1] bg-white px-4 py-2 text-sm font-semibold">
              Cancel
            </span>
            <span className="rounded-xl bg-[#64734a] px-4 py-2 text-sm font-semibold text-white">
              Update event
            </span>
          </div>
        </div>
      </aside>
    </main>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-black/55">{label}</p>
      <div className="rounded-xl border border-[#ded9c2] bg-white px-3 py-2.5 text-sm">
        {value}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full border border-black/10"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function TaskBlock({
  className,
  title,
  tone,
  compact = false,
}: {
  className: string;
  title: string;
  tone: "high" | "medium" | "low" | "none";
  compact?: boolean;
}) {
  const colors = {
    high: "border-[#be5b4c]/30 bg-[#f7beb5]/85 text-[#713d35]",
    medium: "border-[#be892f]/30 bg-[#f9da94]/85 text-[#675027]",
    low: "border-[#5c8e69]/25 bg-[#c1e0cb]/85 text-[#3f6147]",
    none: "border-[#77639e]/25 bg-[#d9cfee]/80 text-[#57496f]",
  };

  return (
    <div
      className={`${className} flex min-w-0 items-center overflow-hidden rounded-[10px] border px-1.5 text-[11px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_1px_3px_rgba(72,70,48,0.12)] ${colors[tone]}`}
      title={title}
    >
      <CheckCircle2
        className={`${compact ? "mr-1 h-2.5 w-2.5" : "mr-1.5 h-3.5 w-3.5"} shrink-0 opacity-70`}
      />
      <span className="truncate leading-none">{title}</span>
    </div>
  );
}
