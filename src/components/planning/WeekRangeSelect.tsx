"use client";

import { useMemo } from "react";

import { CalendarRange } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { localDateKey } from "@/lib/daily-intention";
import { shiftWeek, weekKey, weekRangeLabel } from "@/lib/planning-week";
import { cn } from "@/lib/utils";

export function WeekRangeSelect({
  value,
  onChange,
  disabled = false,
  className,
  ariaLabel = "Choose a week",
  pastWeeks = 52,
  futureWeeks = 8,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  pastWeeks?: number;
  futureWeeks?: number;
}) {
  const thisWeek = weekKey(localDateKey(new Date()));
  const options = useMemo(() => {
    const keys = new Set<string>();
    if (value) keys.add(value);
    for (let offset = futureWeeks; offset >= -pastWeeks; offset -= 1) {
      keys.add(shiftWeek(thisWeek, offset));
    }
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [futureWeeks, pastWeeks, thisWeek, value]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "h-11 w-full rounded-xl border-[#dce3c9] bg-[#fffdf5] px-3 text-[#3f432e] shadow-none",
          className
        )}
      >
        <CalendarRange className="mr-2 h-4 w-4 shrink-0 text-[#718e50]" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-[#dce3c9] bg-[#fffdf5]">
        {options.map((key) => {
          const relationship =
            key === thisWeek
              ? "This week · "
              : key === shiftWeek(thisWeek, -1)
                ? "Last week · "
                : key === shiftWeek(thisWeek, 1)
                  ? "Next week · "
                  : "";
          return (
            <SelectItem key={key} value={key} className="py-2.5">
              {relationship}
              {weekRangeLabel(key)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
