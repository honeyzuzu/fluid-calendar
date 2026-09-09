"use client";

import { useId, useState } from "react";

import { WeekRangeSelect } from "@/components/planning/WeekRangeSelect";

import { localDateKey } from "@/lib/daily-intention";
import { shiftWeek, weekKey, weekRangeLabel } from "@/lib/planning-week";

export function WeekPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [custom, setCustom] = useState(false);
  const thisWeek = weekKey(localDateKey(new Date()));
  const nextWeek = shiftWeek(thisWeek, 1);
  const selected =
    custom || (value && value !== thisWeek && value !== nextWeek)
      ? "custom"
      : value;
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        When would you like to work on this?{" "}
        <span className="text-xs font-normal text-muted-foreground">
          Optional
        </span>
      </label>
      <select
        id={id}
        value={selected}
        disabled={disabled}
        className="h-11 w-full min-w-0 rounded-xl border border-[#dce3c9] bg-[#fffdf5] px-3 text-sm text-[#3f432e]"
        onChange={(event) => {
          const choosingCustom = event.target.value === "custom";
          setCustom(choosingCustom);
          if (choosingCustom) {
            if (!value || value === thisWeek || value === nextWeek)
              onChange(shiftWeek(nextWeek, 1));
          } else onChange(event.target.value);
        }}
      >
        <option value="">Backlog — decide later</option>
        <option value={thisWeek}>This week</option>
        <option value={nextWeek}>Next week</option>
        <option value="custom">Choose week</option>
      </select>
      {selected === "custom" && value && (
        <WeekRangeSelect
          ariaLabel="Choose a planned week"
          disabled={disabled}
          value={value}
          onChange={onChange}
          className="w-full min-w-0"
        />
      )}
      <p className="text-xs text-muted-foreground">
        {value
          ? `${weekRangeLabel(value)}. Your deadline stays separate.`
          : "No week needed. Choose one whenever you’re ready."}
      </p>
    </div>
  );
}
