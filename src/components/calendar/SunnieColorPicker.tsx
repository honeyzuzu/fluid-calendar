import { Check, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

export const SUNNIE_PASTEL_COLORS = [
  { name: "Butter", value: "#F6D77A" },
  { name: "Peach", value: "#F4BFA6" },
  { name: "Blush", value: "#F1AEC2" },
  { name: "Lavender", value: "#CBBBF2" },
  { name: "Sky", value: "#A9D8EE" },
  { name: "Mint", value: "#A9DDB8" },
  { name: "Sage", value: "#BECB91" },
] as const;

interface SunnieColorPickerProps {
  value?: string | null;
  fallbackColor?: string | null;
  onChange: (color: string | null) => void;
  allowDefault?: boolean;
  defaultLabel?: string;
  className?: string;
}

export function SunnieColorPicker({
  value,
  fallbackColor,
  onChange,
  allowDefault = false,
  defaultLabel = "Use calendar color",
  className,
}: SunnieColorPickerProps) {
  const displayedColor = value || fallbackColor || SUNNIE_PASTEL_COLORS[0].value;
  const isPreset = SUNNIE_PASTEL_COLORS.some(
    (color) => color.value.toLowerCase() === value?.toLowerCase()
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-7 gap-1" aria-label="Pastel colors">
        {SUNNIE_PASTEL_COLORS.map((color) => {
          const selected = color.value.toLowerCase() === value?.toLowerCase();

          return (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange(color.value)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                selected ? "border-foreground/70" : "border-background"
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
              aria-label={color.name}
              aria-pressed={selected}
            >
              {selected && <Check className="h-4 w-4 text-stone-700" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative cursor-pointer">
          <span className="sr-only">Choose a custom color</span>
          <input
            type="color"
            value={displayedColor}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Choose a custom color"
          />
          <span
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground",
              value && !isPreset && "ring-2 ring-ring ring-offset-2"
            )}
          >
            <Palette className="h-4 w-4" />
            Custom
          </span>
        </label>

        {allowDefault && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            disabled={!value}
          >
            {defaultLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
