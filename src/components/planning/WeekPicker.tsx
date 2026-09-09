"use client";

import { useId, useState } from "react";

import { localDateKey } from "@/lib/daily-intention";
import { shiftWeek, weekKey } from "@/lib/planning-week";

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
          setCustom(event.target.value === "custom");
          if (event.target.value !== "custom") onChange(event.target.value);
        }}
      >
        <option value="">Backlog — decide later</option>
        <option value={thisWeek}>This week</option>
        <option value={nextWeek}>Next week</option>
        <option value="custom">Choose week</option>
      </select>
      {selected === "custom" && (
        <input
          aria-label="Choose any day in your planned week"
          type="date"
          disabled={disabled}
          value={value}
          onChange={(event) => {
            if (event.target.value) onChange(weekKey(event.target.value));
            else onChange("");
          }}
          className="h-11 w-full min-w-0 rounded-xl border border-[#dce3c9] bg-[#fffdf5] px-3 text-sm"
        />
      )}
      <p className="text-xs text-muted-foreground">
        {value
          ? `Week of ${value}. Your deadline stays separate.`
          : "No week needed. Choose one whenever you’re ready."}
      </p>
    </div>
  );
}
