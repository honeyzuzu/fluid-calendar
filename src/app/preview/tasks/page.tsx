import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Circle,
  Folder,
  GripVertical,
  Plus,
  Search,
  Sparkles,
  Sun,
} from "lucide-react";

const tasks = [
  {
    title: "Finish release notes",
    description: "Summarize the new Focus and calendar improvements.",
    energy: "Medium energy",
    due: "Today",
    project: "Sunnie Planner",
    color: "bg-[#fff0c8] text-[#70572a]",
  },
  {
    title: "Reply to Maya about dinner",
    description: "Confirm Friday and send the restaurant options.",
    energy: "Low energy",
    due: "Today",
    project: "Personal",
    color: "bg-[#e5f1df] text-[#526546]",
  },
  {
    title: "Review calendar sync",
    description: "Check the latest Google and Apple imported events.",
    energy: "High energy",
    due: "Tomorrow",
    project: "Sunnie Planner",
    color: "bg-[#f7d8d1] text-[#75433a]",
  },
  {
    title: "Plan next week",
    description: "Choose the important tasks and leave some open time.",
    energy: "Medium energy",
    due: "Friday",
    project: "Personal",
    color: "bg-[#e7e0f3] text-[#5c4e73]",
  },
  {
    title: "Book dentist appointment",
    description: "Call after lunch and add it to the shared calendar.",
    energy: "Low energy",
    due: "Sep 8",
    project: "No project",
    color: "bg-[#e5f1df] text-[#526546]",
  },
  {
    title: "Organize trip ideas",
    description: "Move the best links into one short list for everyone.",
    energy: "Medium energy",
    due: "Sep 10",
    project: "Friends",
    color: "bg-[#fff0c8] text-[#70572a]",
  },
];

const projects = [
  { name: "Sunnie Planner", count: 3, color: "#F4D27D" },
  { name: "Personal", count: 2, color: "#BDD39A" },
  { name: "Friends", count: 1, color: "#DFA7A7" },
];

export default function TasksPreviewPage() {
  return (
    <main
      data-discord-preview-ready
      className="flex min-h-screen bg-[#fff9e8] text-[#414530]"
    >
      <aside className="hidden w-56 shrink-0 border-r border-[#dfe2c8] bg-[#fffdf5] p-4 lg:block">
        <div className="flex items-center gap-2.5 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f4c85b] shadow-[0_3px_0_#d99e33]">
            <Sun className="h-5 w-5" />
          </span>
          Sunnie
        </div>
        <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
          Projects
        </p>
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#eef3df] px-3 py-2.5 text-sm font-semibold text-[#566344]">
          <Folder className="h-4 w-4" /> All tasks
        </div>
        <div className="mt-3 space-y-2">
          {projects.map((project) => (
            <div
              key={project.name}
              className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-3 text-sm font-semibold text-[#414530] shadow-sm"
              style={{ backgroundColor: project.color }}
            >
              <Folder className="h-4 w-4 text-black/40" />
              <span className="min-w-0 flex-1 truncate">{project.name}</span>
              <span className="text-xs text-black/40">{project.count}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-dashed border-[#c8c9a9] bg-white/50 px-3 py-2 text-[11px] leading-relaxed text-black/45">
          Drag any task onto a project tile to move it.
        </p>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-[#dfe2c8] bg-[#fffdf5]/80 px-6 py-5">
          <div className="mx-auto flex max-w-[1480px] items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d0902f]">
                Little things, lovingly planned
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Tasks</h1>
              <p className="mt-1 text-xs text-black/43">
                A calm, readable workspace at every screen size.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl bg-[#f8edcc] px-4 py-2.5 text-sm font-bold text-[#66552e]">
                <Sparkles className="h-4 w-4" /> Auto-schedule tasks
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-[#64734a] px-4 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_#465331]">
                <Plus className="h-4 w-4" /> Create task
              </span>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1480px] p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-[#e3dfc8] bg-[#fffdf7]/90 p-3 shadow-sm">
            {["All statuses", "All energy", "All times"].map((filter) => (
              <span
                key={filter}
                className="inline-flex items-center gap-2 rounded-xl border border-[#ded9c2] bg-white px-3 py-2 text-xs font-semibold text-black/55"
              >
                {filter} <ChevronDown className="h-3.5 w-3.5" />
              </span>
            ))}
            <span className="flex min-w-56 flex-1 items-center gap-2 rounded-xl border border-[#ded9c2] bg-white px-3 py-2 text-xs text-black/35">
              <Search className="h-3.5 w-3.5" /> Search tasks...
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-black/50">
              <Circle className="h-4 w-4" /> Hide upcoming
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => (
              <article
                key={task.title}
                className="rounded-2xl border border-[#e4dfc9] bg-[#fffdf7] p-4 shadow-[0_2px_7px_rgba(72,70,48,0.07)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-1.5">
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-black/25" />
                    <h2 className="font-bold">{task.title}</h2>
                  </div>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#879c66]" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-black/45">
                  {task.description}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  <span className={`rounded-full px-2.5 py-1 ${task.color}`}>
                    {task.energy}
                  </span>
                  <span className="inline-flex items-center gap-1 text-black/42">
                    <CalendarClock className="h-3.5 w-3.5" /> {task.due}
                  </span>
                  <span className="ml-auto text-black/38">{task.project}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
