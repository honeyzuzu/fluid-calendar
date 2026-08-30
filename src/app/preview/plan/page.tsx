"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  GripVertical,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

type PlanningTask = {
  id: number;
  title: string;
  project: string;
  estimate: number;
  color: string;
  done?: boolean;
};

const initialTasks: PlanningTask[] = [
  { id: 1, title: "Finish homepage direction", project: "Friend Planner", estimate: 90, color: "bg-violet-500" },
  { id: 2, title: "Review calendar sync edge cases", project: "Friend Planner", estimate: 45, color: "bg-sky-500" },
  { id: 3, title: "Plan Friday dinner", project: "Personal", estimate: 20, color: "bg-amber-500" },
];

const inboxTasks = [
  ["Send Maya the trip dates", "Personal", "15m"],
  ["Outline weekly priorities", "Friend Planner", "30m"],
  ["Book dentist appointment", "Personal", "10m"],
];

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export default function PlanningPreviewPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [planningFinished, setPlanningFinished] = useState(false);
  const plannedMinutes = useMemo(
    () => tasks.reduce((total, task) => total + task.estimate, 0),
    [tasks]
  );

  const toggleTask = (id: number) => {
    setTasks((current) =>
      current.map((task) => task.id === id ? { ...task, done: !task.done } : task)
    );
  };

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#292823]">
      <header className="border-b border-black/5 bg-[#fbfaf7]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 font-semibold tracking-[-0.02em]">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#ef7651] text-white shadow-sm shadow-orange-900/10">
                <Sparkles className="h-4 w-4" />
              </span>
              Daylight
            </div>
            <nav className="hidden items-center gap-1 text-sm text-black/50 md:flex">
              {['Plan', 'Calendar', 'Tasks', 'Focus'].map((label) => (
                <button
                  key={label}
                  className={`rounded-lg px-3 py-2 font-medium transition ${label === 'Plan' ? 'bg-black/[0.055] text-black/80' : 'hover:bg-black/[0.04] hover:text-black/80'}`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-black/[0.07] bg-white/70 px-3 py-1.5 text-xs text-black/55 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Calendars synced
            </div>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-[#d7c6f2] text-sm font-semibold text-violet-950 ring-2 ring-white">Q</button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1480px] px-5 py-7 lg:px-8 lg:py-9">
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#c65f40]">
              <span className="h-px w-5 bg-[#db866d]" /> Daily planning · step 2 of 3
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Make space for what matters.</h1>
            <p className="mt-2 text-sm text-black/48">Thursday, August 30 · You have 4h 10m of focus time available.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-black/[0.07] bg-white/65 transition hover:bg-white"><ChevronLeft className="h-4 w-4" /></button>
            <button className="rounded-lg border border-black/[0.07] bg-white/65 px-3.5 py-2 text-sm font-medium transition hover:bg-white">Today</button>
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-black/[0.07] bg-white/65 transition hover:bg-white"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.82fr)_minmax(470px,1.45fr)_minmax(280px,0.75fr)]">
          <aside className="overflow-hidden rounded-2xl border border-black/[0.065] bg-[#fbfaf7] shadow-[0_12px_35px_rgba(50,45,35,0.045)]">
            <div className="border-b border-black/[0.055] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold tracking-[-0.02em]">Today&apos;s list</h2>
                  <p className="mt-1 text-xs text-black/42">Choose a realistic workload.</p>
                </div>
                <button className="grid h-8 w-8 place-items-center rounded-lg bg-black/[0.045] transition hover:bg-black/[0.08]"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="mt-5 rounded-xl bg-[#f0ede5] p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-black/55">Planned focus</span>
                  <span className="font-semibold">{formatMinutes(plannedMinutes)} / 4h 10m</span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
                  <div className="h-full rounded-full bg-[#ef7651] transition-all duration-500" style={{ width: `${Math.min((plannedMinutes / 250) * 100, 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="space-y-2 p-3">
              {tasks.map((task) => (
                <article key={task.id} className="group flex items-start gap-2.5 rounded-xl border border-transparent p-3 transition duration-200 hover:border-black/[0.06] hover:bg-white hover:shadow-sm">
                  <GripVertical className="mt-1 h-4 w-4 cursor-grab text-black/20 opacity-0 transition group-hover:opacity-100" />
                  <button
                    onClick={() => toggleTask(task.id)}
                    aria-label={`Mark ${task.title} ${task.done ? 'unfinished' : 'complete'}`}
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${task.done ? 'border-[#ef7651] bg-[#ef7651] text-white' : 'border-black/20 bg-white hover:border-[#ef7651]'}`}
                  >
                    {task.done && <Check className="h-3 w-3" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${task.done ? 'text-black/35 line-through' : ''}`}>{task.title}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-black/40">
                      <span className={`h-1.5 w-1.5 rounded-full ${task.color}`} />
                      <span>{task.project}</span><span>·</span><Clock3 className="h-3 w-3" /><span>{formatMinutes(task.estimate)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t border-black/[0.055] p-4">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/35">Inbox</p>
              {inboxTasks.map(([title, project, estimate]) => (
                <button key={title} className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-black/[0.035]">
                  <Plus className="h-3.5 w-3.5 text-black/25 transition group-hover:text-[#ef7651]" />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">{title}</span>
                  <span className="text-[10px] text-black/30">{project} · {estimate}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="overflow-hidden rounded-2xl border border-black/[0.065] bg-[#fbfaf7] shadow-[0_12px_35px_rgba(50,45,35,0.045)]">
            <div className="flex items-center justify-between border-b border-black/[0.055] px-5 py-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-black/45" />
                <div><h2 className="text-sm font-semibold">Thursday&apos;s timeline</h2><p className="text-[11px] text-black/38">Drag tasks here to make time for them</p></div>
              </div>
              <button className="rounded-lg bg-black/[0.045] px-3 py-1.5 text-xs font-medium transition hover:bg-black/[0.075]">Day view</button>
            </div>
            <div className="relative min-h-[650px] px-5 py-5 sm:px-7">
              {["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"].map((time) => (
                <div key={time} className="flex h-[62px] gap-4"><span className="w-11 -translate-y-2 text-right text-[10px] text-black/30">{time}</span><div className="flex-1 border-t border-black/[0.055]" /></div>
              ))}
              <TimeBlock className="top-[35px] h-[50px] border-[#b7a4d8]/50 bg-[#e8def7] text-violet-950" title="Team standup" detail="8:30 – 9:00 · Google Calendar" />
              <TimeBlock className="top-[108px] h-[92px] border-[#f1a98f]/50 bg-[#ffe1d6] text-[#713825]" title="Finish homepage direction" detail="9:30 – 11:00 · Focus block" badge="90m" />
              <TimeBlock className="top-[221px] h-[48px] border-emerald-200 bg-emerald-50 text-emerald-900" title="Lunch & reset" detail="" icon={<Coffee className="h-3.5 w-3.5" />} />
              <TimeBlock className="top-[327px] h-[64px] border-sky-200 bg-sky-50 text-sky-950" title="Review calendar sync edge cases" detail="1:15 – 2:00 · Focus block" />
              <div className="absolute left-[72px] right-5 top-[430px] flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ef7651] ring-4 ring-[#ef7651]/10" /><span className="h-px flex-1 bg-[#ef7651]/55" /><span className="text-[9px] font-semibold text-[#cf5f3c]">NOW 2:43</span></div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-black/[0.065] bg-[#fbfaf7] p-5 shadow-[0_12px_35px_rgba(50,45,35,0.045)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-black/42" /><h2 className="text-sm font-semibold">Friends today</h2></div>
                <button className="text-[11px] font-medium text-[#ca6040]">View together</button>
              </div>
              <div className="mt-5 space-y-4">
                {[["M", "Maya", "Free after 4:30", "bg-[#d9cdf2]"], ["J", "Jon", "Busy until 3:00", "bg-[#c9e3db]"], ["A", "Alex", "2 open hours", "bg-[#f1d2b8]"]].map(([initial, name, status, color]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${color}`}>{initial}</span>
                    <div className="min-w-0 flex-1"><p className="text-xs font-semibold">{name}</p><p className="mt-0.5 text-[10px] text-black/40">{status}</p></div>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-black/[0.065] bg-[#2f302b] p-5 text-white shadow-[0_16px_40px_rgba(35,34,29,0.14)]">
              <div className="flex items-center gap-2 text-xs font-medium text-white/55"><Sparkles className="h-3.5 w-3.5 text-[#f7a78c]" />Daily intention</div>
              <p className="mt-4 text-lg font-medium leading-snug tracking-[-0.025em]">Ship one clear direction, then leave room for people.</p>
              <button className="mt-5 text-xs font-medium text-[#f4a187] transition hover:text-[#ffc0ad]">Edit intention</button>
            </section>
            <button
              onClick={() => setPlanningFinished((value) => !value)}
              className={`group flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-white shadow-sm transition duration-300 ${planningFinished ? 'bg-emerald-600' : 'bg-[#ef7651] hover:-translate-y-0.5 hover:bg-[#e96c47] hover:shadow-lg'}`}
            >
              <span><span className="block text-sm font-semibold">{planningFinished ? "Your day is planned" : "Finish planning"}</span><span className="mt-0.5 block text-[10px] text-white/70">{planningFinished ? "You can adjust it anytime" : "Start with your first focus block"}</span></span>
              {planningFinished ? <Check className="h-5 w-5" /> : <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />}
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}

function TimeBlock({ className, title, detail, badge, icon }: { className: string; title: string; detail: string; badge?: string; icon?: React.ReactNode }) {
  return (
    <div className={`absolute left-[84px] right-7 rounded-xl border px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div><div className="flex items-center gap-2">{icon}<p className="text-xs font-semibold">{title}</p></div>{detail && <p className="mt-1 text-[10px] opacity-55">{detail}</p>}</div>
        {badge && <span className="rounded-md bg-white/55 px-1.5 py-1 text-[9px] font-semibold opacity-70">{badge}</span>}
      </div>
    </div>
  );
}
