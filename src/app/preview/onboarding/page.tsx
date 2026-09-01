"use client";

import { CalendarCheck2, Check, Sparkles } from "lucide-react";

import { SunnieSun } from "@/components/brand/SunnieSun";

const calendars = [
  { name: "Personal", account: "Google Calendar", color: "#f4b8c4" },
  { name: "Family", account: "Apple Calendar", color: "#b9d99d" },
  { name: "Birthdays", account: "Apple Calendar", color: "#b9c9ee" },
  { name: "Work", account: "Google Calendar", color: "#f4cc72" },
];

export default function OnboardingPreviewPage() {
  return (
    <main
      data-discord-preview-ready
      className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f0d6] p-8 text-[#514d38]"
    >
      <div className="absolute -left-20 top-12 h-72 w-72 rounded-full bg-[#f4c85b]/20 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#b8d98b]/25 blur-3xl" />
      <section className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-[#e4dbb7] bg-[#fffaf0] shadow-[0_30px_100px_rgba(55,51,31,0.22)]">
        <header className="border-b border-[#e9e1c2] bg-[#fff3c8]/70 px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SunnieSun className="h-11 w-11" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bf8128]">
                  A sunny start
                </p>
                <h1 className="text-xl font-bold tracking-tight">
                  Choose what Sunnie should show
                </h1>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                <span
                  key={index}
                  className={
                    index === 2
                      ? "h-1.5 w-6 rounded-full bg-[#d89c32]"
                      : index < 2
                        ? "h-1.5 w-2 rounded-full bg-[#9fb878]"
                        : "h-1.5 w-2 rounded-full bg-[#ded8bb]"
                  }
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm text-[#716b50]">
            Keep the calendars you want enabled. You can change this anytime in
            Settings.
          </p>
        </header>

        <div className="p-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#e7dfbf] bg-[#f4f6e9] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#dce8c3] text-[#607249]">
                <CalendarCheck2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">4 calendars found</p>
                <p className="text-xs text-[#777158]">
                  Enabled calendars appear throughout Sunnie.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d4b9] bg-white/70 px-3 py-2 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> All connected
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {calendars.map((calendar) => (
              <div
                key={calendar.name}
                className="flex items-center gap-3 rounded-2xl border border-[#b9c999] bg-[#eff4e2] p-4"
              >
                <span
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: calendar.color }}
                >
                  <Check className="h-4 w-4 text-white drop-shadow" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold">
                    {calendar.name}
                  </span>
                  <span className="block text-[11px] text-[#7b755c]">
                    {calendar.account}
                  </span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#788160]">
                  Shown
                </span>
              </div>
            ))}
          </div>

          <p className="mt-5 border-t border-[#e8dfbc] pt-4 text-xs italic text-[#7a7356]">
            “For the great doesn&apos;t happen through impulse alone, and is a
            succession of little things that are brought together.” — Vincent
            van Gogh
          </p>
        </div>

        <footer className="flex items-center justify-between border-t border-[#e9e1c2] bg-[#fffdf7] px-6 py-4">
          <span className="text-xs font-semibold text-[#716b50]">← Back</span>
          <span className="text-[11px] text-[#847e63]">
            You can change these later.
          </span>
          <span className="rounded-xl bg-[#607249] px-5 py-2.5 text-xs font-bold text-white shadow-[0_3px_0_#465536]">
            Next →
          </span>
        </footer>
      </section>
    </main>
  );
}
