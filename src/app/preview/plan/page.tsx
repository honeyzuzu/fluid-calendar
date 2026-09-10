"use client";

import { useState } from "react";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Leaf,
  ListChecks,
  Plus,
  Sparkles,
  Sun,
  X,
} from "lucide-react";

import { WeeklyReview } from "@/components/planning/WeeklyReview";
import { weeklyReviewPreview } from "@/components/planning/weekly-review-preview";

type PreviewTask = {
  id: number;
  title: string;
  duration: number;
  project?: string;
  time?: string;
  done?: boolean;
};

const weeklyTasks = [
  { id: 1, title: "Finish homepage illustrations" },
  { id: 2, title: "Review calendar sync" },
  { id: 3, title: "Plan Friday dinner" },
  { id: 4, title: "Send Maya the trip dates" },
];

const backlogTasks = [
  "Book dentist appointment",
  "Organize photo album",
  "Outline September goals",
  "Order birthday card",
];

const initialDayTasks: PreviewTask[] = [
  {
    id: 1,
    title: "Finish homepage illustrations",
    duration: 60,
    project: "Sunnie Planner",
    time: "9:30 AM",
  },
  {
    id: 2,
    title: "Review calendar sync",
    duration: 45,
    project: "Sunnie Planner",
    time: "1:15 PM",
  },
  { id: 3, title: "Plan Friday dinner", duration: 30, project: "Personal" },
];

export default function PlanningPreviewPage() {
  const [dayTasks, setDayTasks] = useState(initialDayTasks);

  const toggleTask = (id: number) => {
    setDayTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  return (
    <main
      data-discord-preview-ready
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff0c8_0,_#fff9e8_32rem,_#f6f7e9_75rem)] text-[#3f432e]"
    >
      <header className="border-b border-[#dce5c8] bg-[#fffdf4]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.025em]">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f4c85b] text-[#5a4819] shadow-[0_3px_0_#d99e33]">
                <Sun className="h-5 w-5" />
              </span>
              Sunnie Planner
            </div>
            <nav className="hidden items-center gap-1 text-sm text-black/50 md:flex">
              {[
                ["Plan", true],
                ["Calendar", false],
                ["Tasks", false],
                ["Focus", false],
              ].map(([label, active]) => (
                <span
                  key={String(label)}
                  className={`rounded-xl px-3 py-2 font-medium ${active ? "bg-[#edf2df] text-[#52613f]" : ""}`}
                >
                  {label}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[#dce5c8] bg-white/70 px-3 py-1.5 text-xs text-[#60704a] sm:block">
              ● Calendars synced
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d9cdf2] text-sm font-semibold text-[#51416e] ring-2 ring-white">
              Q
            </span>
          </div>
        </div>
      </header>

      <aside className="border-b border-[#e4dfbd] bg-[#fff4c9] px-5 py-2 text-[#5c5537] lg:px-8">
        <div className="mx-auto flex max-w-[1480px] items-center gap-2.5 text-sm">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#dcebc7] text-[#55703c] shadow-[0_2px_0_#b9d09b]">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-semibold">Today&apos;s intention</span>
          <span className="text-black/55">
            Finish the important things, then leave room for friends.
          </span>
        </div>
      </aside>

      <section className="mx-auto flex max-w-[1480px] flex-col px-5 py-7 lg:px-8">
        <div className="relative order-1 mb-6 flex flex-col justify-between gap-6 overflow-hidden rounded-[2rem] border border-[#ead7a5] bg-gradient-to-br from-[#fff7d6] via-[#ffe7b5] to-[#f4c783] p-5 shadow-[0_18px_45px_rgba(139,105,45,0.12)] sm:p-7 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#a95736]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/55 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Daily planning
              </span>
            </div>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-[#42381f] sm:text-5xl">
              Shape a day that feels like yours.
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#6f6040]">
              <span className="rounded-full bg-white/60 px-3 py-1.5 font-medium">
                Sunday, September 6
              </span>
              <span className="rounded-full bg-white/35 px-3 py-1.5">
                2 hours 15 minutes planned
              </span>
            </div>
          </div>
          <div className="relative flex flex-col gap-3 sm:items-end">
            <div className="flex items-center gap-2 rounded-2xl bg-white/55 p-1.5 shadow-sm">
              <PreviewIconButton label="Previous day">
                <ChevronLeft className="h-4 w-4" />
              </PreviewIconButton>
              <span className="rounded-xl px-4 py-2 text-sm font-semibold">
                Today
              </span>
              <PreviewIconButton label="Next day">
                <ChevronRight className="h-4 w-4" />
              </PreviewIconButton>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="flex items-center justify-center gap-2 rounded-xl bg-[#f2b847] px-4 py-2.5 text-xs font-semibold text-[#4b3b18] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" /> Schedule day
              </span>
              <span className="flex items-center justify-center gap-2 rounded-xl bg-[#667c4d] px-4 py-2.5 text-xs font-semibold text-white shadow-sm">
                <CalendarDays className="h-3.5 w-3.5" /> Schedule week
              </span>
            </div>
          </div>
        </div>

        <section className="order-2 mb-5 overflow-hidden rounded-3xl border border-[#dfe3c7] bg-white/70 p-5 shadow-[0_12px_35px_rgba(80,86,55,0.07)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8b6d27]">
                <Leaf className="h-4 w-4" /> Your daily landing pad
              </div>
              <h2 className="mt-1 text-lg font-semibold">
                A gentle rhythm for the day.
              </h2>
            </div>
            <div className="flex min-w-[240px] items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/70">
                <div className="h-full w-2/3 rounded-full bg-[#7e965c]" />
              </div>
              <span className="text-xs font-bold text-[#63724d]">2 of 3</span>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              {
                Icon: Leaf,
                label: "Set intention",
                detail: "Done",
                done: true,
              },
              {
                Icon: ListChecks,
                label: "Choose today’s tasks",
                detail: "3 selected",
                done: true,
              },
              {
                Icon: Clock3,
                label: "Make time for them",
                detail: "1 needs a time",
                done: false,
              },
            ].map(({ Icon, label, detail, done }) => (
              <div
                key={String(label)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${done ? "border-[#cbd9ac] bg-white/75" : "border-[#e2cc88] bg-[#fff9e4]"}`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef3df] text-[#617448]">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-xs font-bold">{label}</span>
                  <span className="text-[10px] text-black/45">{detail}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="order-4 mt-5 rounded-3xl border border-[#e2d9bd] bg-gradient-to-br from-white/85 to-[#fff5d9] p-5 shadow-[0_14px_35px_rgba(113,91,50,0.08)]">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b16b43]">
                Zoom out
              </p>
              <h2 className="mt-1 text-xl font-semibold">Shape the week</h2>
              <p className="mt-1 text-xs text-black/42">
                Sep 6 – Sep 12. Move tasks from Backlog → This week → a day.
              </p>
            </div>
            <span className="text-xs font-medium text-[#65764d]">
              4 tasks this week
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="order-2 rounded-2xl border border-[#d9e3c7] bg-[#eef3e3] p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/40">
                This week
              </p>
              <div className="grid gap-1 sm:grid-cols-2">
                {weeklyTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="flex min-w-0 items-center rounded-lg bg-white/75 px-3 py-2 text-xs"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5 shrink-0 text-[#d0902f]" />
                    <span className="min-w-0 flex-1 truncate">
                      {task.title}
                    </span>
                    <span className="ml-2 shrink-0 text-black/35">
                      {index < 3 ? "In day" : "Add to day"}
                    </span>
                    <X className="ml-2 h-3.5 w-3.5 text-black/20" />
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 rounded-2xl border border-[#f0ddaa] bg-[#fff4d5] p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/40">
                Backlog
              </p>
              <div className="grid gap-1 sm:grid-cols-2">
                {backlogTasks.map((task) => (
                  <div
                    key={task}
                    className="flex min-w-0 items-center rounded-lg bg-white/75 px-3 py-2 text-xs"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5 shrink-0 text-[#7b8e5d]" />
                    <span className="min-w-0 flex-1 truncate">{task}</span>
                    <span className="ml-2 shrink-0 text-black/35">
                      Add to week
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="order-3 grid gap-5 xl:grid-cols-2">
          <section className="order-2 overflow-hidden rounded-3xl border border-[#e0d8c3] bg-white/80 shadow-[0_12px_30px_rgba(81,70,46,0.07)]">
            <div className="border-b border-black/[0.055] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c26343]">
                Choose
              </p>
              <h2 className="mt-1 text-xl font-semibold">Today&apos;s tasks</h2>
              <p className="mt-1 text-xs text-black/42">
                Tasks selected for Sunday.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black/30">
                  Add a task for today
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9ae43] text-[#493916] shadow-[0_3px_0_#c88d2b]">
                  <Plus className="h-4 w-4" />
                </span>
              </div>
            </div>
            <div className="space-y-2 p-3">
              {dayTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-black/[0.055] bg-white p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${task.done ? "border-[#84a75e] bg-[#84a75e] text-white" : "border-black/20"}`}
                    >
                      {task.done && <Check className="h-3 w-3" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${task.done ? "text-black/35 line-through" : ""}`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-black/40">
                        <Clock3 className="h-3 w-3" /> {task.duration}m
                        {task.project && ` · ${task.project}`}
                        <span className="ml-auto rounded-md bg-[#f8f6f1] px-2 py-1">
                          {task.time ?? "Choose time"}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="order-3 rounded-3xl border border-[#d8dfc8] bg-gradient-to-b from-[#f8faef] to-white/85 p-5 shadow-[0_12px_30px_rgba(81,90,56,0.07)]">
            <div className="mb-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718e50]">
                <CalendarDays className="h-4 w-4" /> Give it time
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Today&apos;s timeline
              </h2>
            </div>
            <div className="space-y-2">
              <TimelineItem
                color="#d9cdf2"
                time="8:30 – 9:00"
                title="Team catch-up"
                type="Google Calendar"
              />
              <TimelineItem
                color="#ffd8ca"
                time="9:30 – 10:30"
                title="Finish homepage illustrations"
                type="Focus block"
              />
              <TimelineItem
                color="#c9e3db"
                time="11:00 – 12:00"
                title="Lunch with Maya"
                type="Apple Calendar"
              />
              <TimelineItem
                color="#ffd8ca"
                time="1:15 – 2:00"
                title="Review calendar sync"
                type="Focus block"
              />
              <div className="grid min-h-[82px] place-items-center rounded-xl border border-dashed border-black/10 text-center text-xs text-black/35">
                Open time for something sunny ☀
              </div>
            </div>
          </section>

          <aside className="order-1 space-y-5 xl:col-span-2 xl:grid xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-5 xl:space-y-0">
            <section className="rounded-3xl border border-[#cddcaf] bg-gradient-to-br from-[#f3f7e8] via-[#eaf2dc] to-[#dce9c8] p-6 text-[#4f6039] shadow-[0_8px_0_#c8d8aa]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#718650]">
                <Leaf className="h-4 w-4" /> Today&apos;s intention is set
              </div>
              <p className="mt-4 min-h-[72px] text-base font-medium leading-relaxed text-[#435032]">
                Finish the important things, then leave room for friends.
              </p>
              <span className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#687d4c] underline decoration-[#a9bd88] underline-offset-4">
                Change intention
              </span>
            </section>
            <div className="flex w-full items-center justify-between rounded-3xl bg-gradient-to-br from-[#ffd86f] to-[#f2b847] px-5 py-5 text-[#4b3b18] shadow-sm xl:h-full">
              <span>
                <span className="block text-sm font-semibold">
                  Finish planning
                </span>
                <span className="mt-0.5 block text-[10px] text-black/40">
                  Saved to your account
                </span>
              </span>
              <Check className="h-5 w-5" />
            </div>
          </aside>
        </div>
        <div className="order-5">
          <WeeklyReview preview={weeklyReviewPreview} />
        </div>
      </section>
    </main>
  );
}

function PreviewIconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-black/[0.07] bg-white/70"
    >
      {children}
    </span>
  );
}

function TimelineItem({
  color,
  time,
  title,
  type,
}: {
  color: string;
  time: string;
  title: string;
  type: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-black/[0.055] bg-white p-3">
      <span
        className="h-10 w-1 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-[11px] text-black/40">
          {time} · {type}
        </p>
      </div>
    </article>
  );
}
