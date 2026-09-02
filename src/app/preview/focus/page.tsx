"use client";

import { Bell, Check, Pencil, Play, Sun, Volume2 } from "lucide-react";

import { SunnieSun } from "@/components/brand/SunnieSun";

export default function FocusPreviewPage() {
  return (
    <main
      data-discord-preview-ready
      className="min-h-screen bg-[#fff9e8] text-[#4f533e]"
    >
      <header className="border-b border-[#dfe2c8] bg-[#fff9e8]/95 px-8 py-4 shadow-sm">
        <div className="mx-auto flex max-w-[1380px] items-center gap-3">
          <SunnieSun className="h-10 w-10" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c4872d]">
              Sunnie focus
            </p>
            <h1 className="text-xl font-bold">A cozy place to get started</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1380px] gap-6 p-8 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-[#e0ddc5] bg-[#fffdf5] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#89846a]">
            Up next
          </p>
          {["Finish release notes", "Reply to feedback", "Plan tomorrow"].map(
            (task, index) => (
              <div
                key={task}
                className={`mt-3 flex items-center justify-between gap-2 rounded-2xl p-3 text-sm font-semibold ${
                  index === 0
                    ? "bg-[#eef3df] text-[#566344]"
                    : "border border-[#ebe6d2] text-[#777158]"
                }`}
              >
                <span>{task}</span>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#9fb18a] bg-white/70 text-transparent">
                  <Check className="h-3.5 w-3.5" />
                </span>
              </div>
            )
          )}
        </aside>

        <section>
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#a6762a]">
              Current task
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">
              Finish release notes
            </h2>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#dfdab8] bg-[#fffaf0] shadow-[0_8px_0_#e7dfbf]">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5 bg-[linear-gradient(135deg,#fff1bd_0%,#eff4df_100%)] p-6">
              <div className="grid h-24 w-24 place-items-center rounded-[2rem] border-4 border-white bg-[#f7d39a] text-6xl shadow-md">
                🐱
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a6762a]">
                    Focus companion
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold text-[#8c6a27]">
                    <Sun className="h-3 w-3 fill-[#f4c85b] text-[#d29a30]" />7
                    sun drops
                  </span>
                </div>
                <h3 className="mt-1 text-xl font-bold">Miso</h3>
                <p className="mt-1 text-sm text-[#6e7058]">
                  I&apos;ll stay for setup and start focus with you next.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-bold text-[#68684f]">
                <Bell className="h-4 w-4" /> Calm chime on
              </span>
            </div>

            <div className="border-b border-[#e7e0c5] bg-[#fffdf7] px-6 py-4">
              <div className="flex gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-[#eef3df] px-2.5 py-1">
                  Energy: Medium
                </span>
                <span className="rounded-full bg-[#fff0c8] px-2.5 py-1">
                  Urgency: High
                </span>
                <span className="rounded-full bg-[#eee8f6] px-2.5 py-1">
                  Estimate: 25 min
                </span>
              </div>
              <div className="mt-3 rounded-2xl border border-[#e5dfc7] bg-white/70 px-3 py-2.5 text-sm text-[#66634f]">
                <span className="mr-2 text-[10px] font-bold uppercase tracking-wide text-[#9a8b66]">
                  Task note
                </span>
                Summarize the new planning and calendar improvements for
                everyone.
              </div>
            </div>

            <div className="grid gap-7 p-7 lg:grid-cols-[1fr_290px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b17b2b]">
                  Plan your whole round
                </p>
                <h3 className="mt-1 text-xl font-bold">
                  Setup first, then focus starts automatically
                </h3>
                <div className="mt-4 rounded-2xl border border-[#ead9a9] bg-[#fff4cf] px-3 py-2.5 text-center text-sm font-bold text-[#755c2c]">
                  5 min setup → 25 min focus → 5 min break
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Choice label="Setup" value="5 min" />
                  <Choice label="Focus" value="25 min" />
                  <Choice label="Break after" value="5 min" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-semibold">
                  {[
                    "Drink nearby",
                    "Space ready",
                    "Outline subtasks",
                    "Silence distractions",
                  ].map((item, index) => (
                    <span
                      key={item}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 ${index < 2 ? "border-[#bacc99] bg-[#eff4e2] text-[#586447]" : "border-[#e4dec5] bg-white text-[#777158]"}`}
                    >
                      {index < 2 && <Check className="h-3 w-3" />}
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl border border-[#ded8bd] bg-white/80 px-3 py-2 text-sm text-[#66634f]">
                  Draft the feature list
                  <br />
                  Check the friendly wording
                  <br />
                  Post the final summary
                </div>
                <span className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#607249] px-5 py-3 text-sm font-bold text-white shadow-[0_3px_0_#465536]">
                  <Play className="h-4 w-4 fill-current" /> Start setup, then
                  focus
                </span>
              </div>

              <aside className="rounded-3xl border border-[#e1dac0] bg-white/65 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#9a8b66]">
                  After each round
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#6f6b54]">
                  Your subtask outline stays beside the timer. When focus ends,
                  choose what happens to the task.
                </p>
                <div className="mt-5 space-y-2">
                  <span className="flex items-center gap-2 rounded-2xl bg-[#f4c85b] px-4 py-3 text-sm font-bold text-[#56431b]">
                    <Check className="h-4 w-4" /> Complete task · +1 sun drop
                  </span>
                  <span className="flex items-center gap-2 rounded-2xl border border-[#dad3b7] bg-white px-4 py-3 text-sm font-semibold text-[#716b50]">
                    <Pencil className="h-4 w-4" /> Edit task
                  </span>
                </div>
                <div className="mt-5 border-t border-[#e1dac0] pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#9a8b66]">
                    Chime for every timer
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {["Soft sunrise", "Garden bells", "Cozy wooden"].map(
                      (chime, index) => (
                        <span
                          key={chime}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold ${index === 0 ? "border-[#9fb878] bg-[#eff4e2]" : "border-[#e3ddc4] bg-white/70"}`}
                        >
                          {chime}
                          <Volume2 className="h-3.5 w-3.5 text-[#607249]" />
                        </span>
                      )
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Choice({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold text-[#716b50]">{label}</p>
      <span className="block rounded-xl border border-[#9fb878] bg-[#eff4e2] px-3 py-2 text-center text-xs font-bold text-[#566344]">
        {value}
      </span>
    </div>
  );
}
