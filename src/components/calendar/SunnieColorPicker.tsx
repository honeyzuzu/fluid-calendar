"use client";

import { useEffect, useState } from "react";

import { Check, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";

import { SUNNIE_PASTEL_COLORS } from "@/lib/calendar-colors";
import { MAX_RECENT_COLORS, addRecentColor } from "@/lib/recent-colors";
import { cn } from "@/lib/utils";

const RECENT_COLORS_STORAGE_KEY = "sunnie-recent-custom-colors";

export { SUNNIE_PASTEL_COLORS } from "@/lib/calendar-colors";

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
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const displayedColor =
    value || fallbackColor || SUNNIE_PASTEL_COLORS[0].value;
  const [customColor, setCustomColor] = useState(displayedColor);
  const [hasUnappliedCustomColor, setHasUnappliedCustomColor] = useState(false);
  const isPreset = SUNNIE_PASTEL_COLORS.some(
    (color) => color.value.toLowerCase() === value?.toLowerCase()
  );
  const presetValues = SUNNIE_PASTEL_COLORS.map((color) => color.value);

  useEffect(() => {
    try {
      const savedColors = JSON.parse(
        window.localStorage.getItem(RECENT_COLORS_STORAGE_KEY) || "[]"
      );

      if (Array.isArray(savedColors)) {
        setRecentColors(
          savedColors
            .filter(
              (color): color is string =>
                typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color)
            )
            .slice(0, MAX_RECENT_COLORS)
        );
      }
    } catch {
      setRecentColors([]);
    }
  }, []);

  useEffect(() => {
    setCustomColor(displayedColor);
    setHasUnappliedCustomColor(false);
  }, [displayedColor]);

  const handleCustomColor = (color: string) => {
    setRecentColors((currentColors) => {
      const nextColors = addRecentColor(currentColors, color, presetValues);
      try {
        window.localStorage.setItem(
          RECENT_COLORS_STORAGE_KEY,
          JSON.stringify(nextColors)
        );
      } catch {
        // The picker still works when browser storage is disabled.
      }
      return nextColors;
    });
    onChange(color);
  };

  const previewCustomColor = (color: string) => {
    setCustomColor(color);
    setHasUnappliedCustomColor(
      color.toLowerCase() !== displayedColor.toLowerCase()
    );
  };

  const applyCustomColor = () => {
    handleCustomColor(customColor);
    setHasUnappliedCustomColor(false);
  };

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

      {recentColors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Recent custom colors
          </p>
          <div className="flex flex-wrap gap-1" aria-label="Recent colors">
            {recentColors.map((color) => {
              const selected = color.toLowerCase() === value?.toLowerCase();

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange(color)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    selected ? "border-foreground/70" : "border-background"
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={`Recent color ${color}`}
                  aria-pressed={selected}
                >
                  {selected && <Check className="h-4 w-4 text-stone-700" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative cursor-pointer">
          <span className="sr-only">Choose a custom color</span>
          <input
            type="color"
            value={customColor}
            onChange={(event) => previewCustomColor(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Choose a custom color"
          />
          <span
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground",
              value && !isPreset && "ring-2 ring-ring ring-offset-2"
            )}
          >
            <span
              className="h-4 w-4 rounded-full border border-black/10"
              style={{ backgroundColor: customColor }}
              aria-hidden="true"
            />
            <Palette className="h-4 w-4" />
            Custom
          </span>
        </label>

        <Button
          type="button"
          size="sm"
          onClick={applyCustomColor}
          disabled={!hasUnappliedCustomColor}
        >
          Apply color
        </Button>

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
