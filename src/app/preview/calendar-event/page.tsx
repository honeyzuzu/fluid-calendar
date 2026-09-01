import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Menu,
  Plus,
  Sun,
  X,
} from "lucide-react";

export default function CalendarEventPreviewPage() {
  return (
    <main
      data-discord-preview-ready
      className="relative min-h-screen overflow-hidden bg-[#fff9e8] text-[#3f432e]"
    >
      <header className="flex h-16 items-center justify-between border-b border-[#dce5c8] bg-[#fffdf4] px-7">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5 text-lg font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f4c85b] text-[#5a4819] shadow-[0_3px_0_#d99e33]">
              <Sun className="h-5 w-5" />
            </span>
            Sunnie Planner
          </div>
          <nav className="flex gap-1 text-sm text-black/48">
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

      <section className="flex h-[calc(100vh-4rem)] flex-col opacity-55">
        <div className="flex h-16 items-center gap-3 border-b border-[#dce5c8] bg-white/60 px-5">
          <Menu className="h-5 w-5" />
          <button className="rounded-lg px-3 py-2 text-sm">Today</button>
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <h1 className="text-xl font-semibold">September 3, 2026</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#64734a] px-3 py-2 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" /> Add event
            </span>
            {["Day", "Week", "Month", "Year"].map((item) => (
              <span key={item} className="rounded-lg px-3 py-2 text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="grid flex-1 grid-cols-[70px_repeat(5,1fr)] bg-white/30">
          {Array.from({ length: 30 }, (_, index) => (
            <div
              key={index}
              className="border-b border-r border-black/[0.07]"
            />
          ))}
        </div>
      </section>

      <div className="absolute inset-0 bg-[#3f432e]/28 backdrop-blur-[1px]" />
      <section className="absolute left-1/2 top-1/2 w-[680px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-black/10 bg-[#fffdf8] shadow-[0_28px_90px_rgba(45,48,30,0.28)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-[#fffdf5] px-6 py-5">
          <h2 className="text-xl font-semibold">New Event</h2>
          <X className="h-4 w-4 text-black/45" />
        </div>
        <div className="space-y-4 px-6 py-5">
          <PreviewField label="Title *" value="Lunch with Maya" />
          <PreviewField label="Calendar *" value="Personal calendar" />
          <div className="grid grid-cols-2 gap-4">
            <DateRow label="Start *" date="09/03/2026" time="12:00 PM" />
            <DateRow label="End *" date="09/03/2026" time="1:00 PM" />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#f7f5eb] px-3 py-2 text-xs">
            <span className="mr-1 text-black/45">Quick duration</span>
            {["30m", "1h", "1.5h", "2h"].map((item) => (
              <span
                key={item}
                className="rounded-lg border border-black/[0.07] bg-white px-3 py-1.5 font-semibold text-[#65734c]"
              >
                {item}
              </span>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="h-4 w-4 rounded border border-black/20 bg-white" />{" "}
            All day
          </label>
          <div className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-[#f7f5eb] px-3 py-2.5 text-sm font-semibold text-[#60684a]">
            Color, location, notes &amp; repeat{" "}
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-black/[0.06] bg-[#fffdf5] px-6 py-4">
          <span className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold">
            Cancel
          </span>
          <span className="rounded-lg bg-[#64734a] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_0_#465331]">
            Create
          </span>
        </div>
      </section>
    </main>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm font-semibold">
      <span className="mb-2 block">{label}</span>
      <span className="block rounded-xl border border-[#dce3c9] bg-white px-3 py-2.5 font-normal">
        {value}
      </span>
    </label>
  );
}

function DateRow({
  label,
  date,
  time,
}: {
  label: string;
  date: string;
  time: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="grid grid-cols-[1fr_112px] gap-2">
        <span className="flex items-center gap-2 rounded-xl border border-[#dce3c9] bg-white px-3 py-2.5 text-sm">
          <CalendarDays className="h-4 w-4 text-black/35" />
          {date}
        </span>
        <span className="flex items-center gap-2 rounded-xl border border-[#dce3c9] bg-white px-3 py-2.5 text-sm">
          <Clock3 className="h-4 w-4 text-black/35" />
          {time}
        </span>
      </div>
    </div>
  );
}
