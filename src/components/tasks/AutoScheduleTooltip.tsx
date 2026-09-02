import { cn } from "@/lib/utils";

interface AutoScheduleTooltipProps {
  id: string;
  align?: "left" | "right";
}

export function AutoScheduleTooltip({
  id,
  align = "right",
}: AutoScheduleTooltipProps) {
  return (
    <div
      id={id}
      role="tooltip"
      className={cn(
        "pointer-events-none absolute top-full z-[100] mt-2 w-80 max-w-[calc(100vw-2rem)] whitespace-normal rounded-xl border border-[#d5d9bd] bg-[#fffdf5] p-4 text-left text-sm leading-6 text-[#4d513b] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
        align === "right" ? "right-0" : "left-0"
      )}
    >
      New tasks join Auto-schedule automatically. Turn it off inside a task to
      opt that task out. Sunnie avoids conflicts, stays inside your working
      hours, and uses duration, priority, energy, and preferred time to choose a
      spot.
    </div>
  );
}
