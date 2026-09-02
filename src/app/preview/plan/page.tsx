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
      className="min-h-screen bg-[#fff9e8] text-[#3f432e]"
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
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f4c85b] text-[#624b18] shadow-[0_2px_0_#d9a53c]">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-semibold">Today&apos;s intention</span>
          <span className="text-black/55">
            Finish the important things, then leave room for friends.
          </span>
        </div>
      </aside>

      <section className="mx-auto max-w-[1480px] px-5 py-7 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#c65f40]">
              <Sparkles className="h-3.5 w-3.5" /> Daily planning
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Make space for what matters.
            </h1>
            <p className="mt-2 text-sm text-black/45">
              Monday, September 1 · 2 hours 15 minutes planned
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex items-center gap-2">
              <PreviewIconButton label="Previous day">
                <ChevronLeft className="h-4 w-4" />
              </PreviewIconButton>
              <span className="rounded-lg border border-black/[0.07] bg-white/70 px-4 py-2 text-sm font-medium">
                Today
              </span>
              <PreviewIconButton label="Next day">
                <ChevronRight className="h-4 w-4" />
              </PreviewIconButton>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="flex items-center justify-center gap-2 rounded-xl bg-[#f4c85b] px-4 py-2 text-xs font-semibold text-[#4b3b18] shadow-[0_2px_0_#d8a43c]">
                <Sparkles className="h-3.5 w-3.5" /> Schedule day
              </span>
              <span className="flex items-center justify-center gap-2 rounded-xl bg-[#708354] px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_0_#53643e]">
                <CalendarDays className="h-3.5 w-3.5" /> Schedule week
              </span>
            </div>
          </div>
        </div>

        <section className="mb-5 overflow-hidden rounded-3xl border border-[#e7d89f] bg-[linear-gradient(120deg,#fff3bf_0%,#f4f4db_54%,#e8f0d9_100%)] p-5 shadow-[0_7px_0_#e8ddae]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8b6d27]">
                <Leaf className="h-4 w-4" /> Your daily landing pad
              </div>
              <h2 className="mt-1 text-xl font-semibold">
                Shape a calm, realistic day in three little steps.
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

        <section className="rounded-2xl border border-black/[0.065] bg-[#fbfaf7] p-5 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Plan this week</h2>
              <p className="mt-1 text-xs text-black/42">
                Sep 1 – Sep 7. Pick weekly tasks, then add the ones you want to
                a day.
              </p>
            </div>
            <span className="text-xs font-medium text-[#65764d]">
              4 tasks this week
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-[#eef3e3] p-3">
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
            <div className="rounded-xl bg-[#fff4d5] p-3">
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

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(320px,0.85fr)_minmax(430px,1.25fr)_minmax(270px,0.7fr)]">
          <section className="overflow-hidden rounded-2xl border border-black/[0.065] bg-[#fbfaf7] shadow-sm">
            <div className="border-b border-black/[0.055] p-5">
              <h2 className="font-semibold">Today&apos;s list</h2>
              <p className="mt-1 text-xs text-black/42">
                Tasks selected for Monday.
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

          <section className="rounded-2xl border border-black/[0.065] bg-[#fbfaf7] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-black/45" />
              <h2 className="text-sm font-semibold">Today&apos;s timeline</h2>
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

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#cddcaf] bg-[#eef3df] p-5 text-[#4f6039] shadow-[0_8px_0_#c8d8aa]">
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
            <div className="flex w-full items-center justify-between rounded-2xl bg-[#f4c85b] px-5 py-4 text-[#4b3b18]">
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
