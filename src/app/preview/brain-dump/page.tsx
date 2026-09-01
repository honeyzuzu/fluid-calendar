"use client";

import { useState } from "react";

import {
  Brain,
  Check,
  Clock3,
  Inbox,
  Sparkles,
  Sun,
  WandSparkles,
} from "lucide-react";

const sampleDump = `Book dentist appointment
Reply to Maya about Saturday
Outline September goals
Pick up cat food`;

export default function BrainDumpPreviewPage() {
  const [view, setView] = useState<"dump" | "tune-up">("dump");

  return (
    <main
      data-discord-preview-ready
      className="min-h-screen bg-[#fff9e8] text-[#3f432e]"
    >
      <header className="border-b border-[#dce5c8] bg-[#fffdf4]/95">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 text-lg font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f4c85b] text-[#5a4819] shadow-[0_3px_0_#d99e33]">
                <Sun className="h-5 w-5" />
              </span>
              Sunnie Planner
            </div>
            <nav className="hidden items-center gap-1 text-sm text-black/50 md:flex">
              {[
                "Plan",
                "Calendar",
                "Tasks",
                "Brain Dump",
                "Friends",
                "Focus",
              ].map((label) => (
                <span
                  key={label}
                  className={`rounded-xl px-3 py-2 font-medium ${label === "Brain Dump" ? "bg-[#f8e4a1] text-[#77591d]" : ""}`}
                >
                  {label}
                </span>
              ))}
            </nav>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d9cdf2] text-sm font-semibold text-[#51416e] ring-2 ring-white">
            Q
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-[1120px] px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d0902f]">
              <Brain className="h-4 w-4" /> Clear your head
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em]">
              Brain Dump
            </h1>
            <p className="mt-2 text-sm text-black/48">
              Catch every loose thought, then help Sunnie plan it well.
            </p>
          </div>
          <span className="rounded-full bg-[#eef3df] px-4 py-2 text-xs font-semibold text-[#617047]">
            Private · predictable · no AI needed
          </span>
        </div>

        <div className="mb-5 inline-grid min-w-[430px] grid-cols-2 rounded-2xl border border-black/[0.06] bg-white/60 p-1.5 shadow-sm">
          <PreviewTab
            active={view === "dump"}
            onClick={() => setView("dump")}
            icon={Inbox}
            label="Quick dump"
          />
          <PreviewTab
            active={view === "tune-up"}
            onClick={() => setView("tune-up")}
            icon={WandSparkles}
            label="Task tune-up"
          />
        </div>

        {view === "dump" ? (
          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <section className="rounded-3xl border border-black/[0.065] bg-white/80 p-6 shadow-sm">
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    What&apos;s on your mind?
                  </h2>
                  <p className="mt-1 text-xs text-black/42">
                    One thought per line. Bullets work too.
                  </p>
                </div>
                <span className="h-fit rounded-full bg-[#eef3df] px-3 py-1 text-xs font-semibold text-[#617047]">
                  4 tasks
                </span>
              </div>
              <div className="mt-5 min-h-[330px] whitespace-pre-line rounded-2xl border border-[#dde4c9] bg-[#fffdf5] p-5 text-base leading-9">
                {sampleDump}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-black/35">
                  Draft saved in this browser
                </span>
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#64734a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#465331]">
                  <Sparkles className="h-4 w-4" /> Create 4 tasks
                </button>
              </div>
            </section>
            <aside className="space-y-4">
              <section className="rounded-2xl border border-black/[0.06] bg-[#fff3cc] p-5 shadow-sm">
                <h2 className="font-semibold">No AI needed yet</h2>
                <p className="mt-2 text-sm leading-6 text-black/52">
                  Each line becomes a task exactly as written, keeping Sunnie
                  fast, private, and free.
                </p>
              </section>
              <section className="rounded-2xl border border-black/[0.06] bg-white/70 p-5 shadow-sm">
                <h2 className="font-semibold">Then tune them up</h2>
                <p className="mt-2 text-sm leading-6 text-black/52">
                  Cycle through every unfinished task to add time, priority,
                  status, and energy.
                </p>
              </section>
            </aside>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-black/[0.065] bg-white/80 shadow-xl">
            <div className="bg-[#fff3cc] px-7 py-4 text-xs font-semibold text-black/45">
              Task 1 of 6 · 6 need details
            </div>
            <div className="p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#84a75e]">
                Tell Sunnie about this task
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                Book dentist appointment
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-5">
                {[
                  "Status · To do",
                  "Time estimate · 30 min",
                  "Priority · Medium",
                  "Energy · Low",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-[#dce3c9] bg-[#fffdf5] px-4 py-3 text-sm font-medium"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <span className="inline-flex items-center gap-2 rounded-xl bg-[#64734a] px-5 py-2.5 text-sm font-semibold text-white">
                  <Check className="h-4 w-4" /> Save &amp; next
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function PreviewTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Clock3;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${active ? "bg-[#f8e4a1] text-[#77591d] shadow-sm" : "text-[#687052]"}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
