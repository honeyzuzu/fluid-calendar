"use client";

import { useMemo } from "react";

import { CalendarRange } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
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
  pastWeeks = 104,
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
  const { currentAndPast, upcoming } = useMemo(() => {
    const past = Array.from({ length: pastWeeks + 1 }, (_, index) =>
      shiftWeek(thisWeek, -index)
    );
    const future = Array.from({ length: futureWeeks }, (_, index) =>
      shiftWeek(thisWeek, index + 1)
    );
    if (value && !past.includes(value) && !future.includes(value)) {
      if (value < thisWeek) past.push(value);
      else future.push(value);
    }
    return { currentAndPast: past, upcoming: future };
  }, [futureWeeks, pastWeeks, thisWeek, value]);

  const item = (key: string) => {
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
  };

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
        <SelectGroup>
          <SelectLabel className="text-[#718e50]">
            Current and past weeks
          </SelectLabel>
          {currentAndPast.map(item)}
        </SelectGroup>
        <SelectSeparator className="bg-[#dce3c9]" />
        <SelectGroup>
          <SelectLabel className="text-[#b5784b]">Upcoming weeks</SelectLabel>
          {upcoming.map(item)}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
