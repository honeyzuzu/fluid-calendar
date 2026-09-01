"use client";

import { Bell, Check, Coffee, Pause, Play, Sun } from "lucide-react";

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

      <div className="mx-auto grid max-w-[1380px] gap-6 p-8 lg:grid-cols-[260px_1fr_220px]">
        <aside className="rounded-3xl border border-[#e0ddc5] bg-[#fffdf5] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#89846a]">
            Up next
          </p>
          {["Finish release notes", "Reply to feedback", "Plan tomorrow"].map(
            (task, index) => (
              <div
                key={task}
                className={`mt-3 rounded-2xl p-3 text-sm font-semibold ${
                  index === 0
                    ? "bg-[#eef3df] text-[#566344]"
                    : "border border-[#ebe6d2] text-[#777158]"
                }`}
              >
                {task}
              </div>
            )
          )}
        </aside>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#a6762a]">
                Current task
              </p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">
                Finish release notes
              </h2>
            </div>
            <span className="rounded-full bg-[#eef3df] px-3 py-1.5 text-xs font-bold text-[#64734f]">
              25 minutes
            </span>
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
                  One cozy step at a time.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-bold text-[#68684f]">
                <Bell className="h-4 w-4" /> Calm chime on
              </span>
            </div>

            <div className="grid gap-8 p-7 lg:grid-cols-[1fr_240px] lg:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b17b2b]">
                  Gentle timer
                </p>
                <h3 className="mt-1 text-xl font-bold">
                  Focusing on release notes
                </h3>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    ["Drink nearby", true],
                    ["Space ready", true],
                    ["Subtasks outlined", true],
                    ["Distractions silenced", false],
                  ].map(([label, checked]) => (
                    <span
                      key={String(label)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-semibold ${
                        checked
                          ? "border-[#bacc99] bg-[#eff4e2] text-[#586447]"
                          : "border-[#e4dec5] bg-white text-[#777158]"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                      {label}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex gap-2">
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-[#607249] px-5 py-3 text-sm font-bold text-white shadow-[0_3px_0_#465536]">
                    <Pause className="h-4 w-4 fill-current" /> Pause
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-[#dad3b7] px-5 py-3 text-sm font-semibold text-[#716b50]">
                    <Coffee className="h-4 w-4" /> 5-minute break next
                  </span>
                </div>
              </div>
              <div
                className="grid h-52 w-52 place-items-center rounded-full p-3 shadow-inner"
                style={{
                  background: "conic-gradient(#e0ad43 42%, #ece7d1 42% 100%)",
                }}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-[#fffdf7]">
                  <span className="font-mono text-5xl font-bold tracking-tight">
                    14:32
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-[#e0ddc5] bg-[#f8f3dc] p-4">
          <p className="text-sm font-bold">Quick actions</p>
          <div className="mt-4 space-y-2">
            <span className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5 text-xs font-semibold">
              <Check className="h-4 w-4 text-[#718958]" /> Complete task
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5 text-xs font-semibold">
              <Play className="h-4 w-4 text-[#718958]" /> Another round
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}
