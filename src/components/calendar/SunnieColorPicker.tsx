"use client";

import { useEffect, useState } from "react";

import { Check, Loader2, Plus } from "lucide-react";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";

import { ThemeLinkedPaletteName } from "@/lib/color-themes";
import { MAX_RECENT_COLORS, addRecentColor } from "@/lib/recent-colors";
import { cn } from "@/lib/utils";

const RECENT_COLORS_STORAGE_KEY = "sunnie-recent-custom-colors";

export { SUNNIE_PASTEL_COLORS } from "@/lib/calendar-colors";

interface SunnieColorPickerProps {
  value?: string | null;
  valueSlot?: string | null;
  fallbackColor?: string | null;
  onChange: (
    color: string | null,
    colorSlot: string | null
  ) => void | Promise<void>;
  allowDefault?: boolean;
  defaultLabel?: string;
  className?: string;
  paletteName?: Extract<ThemeLinkedPaletteName, "events" | "tasks">;
}

export function SunnieColorPicker({
  value,
  valueSlot,
  fallbackColor,
  onChange,
  allowDefault = false,
  defaultLabel = "Use calendar color",
  className,
  paletteName = "events",
}: SunnieColorPickerProps) {
  const { colorTheme } = useTheme();
  const paletteColors = colorTheme.palettes[paletteName];
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const displayedColor = value || fallbackColor || paletteColors[0].value;
  const [draftColor, setDraftColor] = useState<string | null>(value ?? null);
  const [draftColorSlot, setDraftColorSlot] = useState<string | null>(
    valueSlot ?? null
  );
  const [customColor, setCustomColor] = useState(displayedColor);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const isDraftPreset =
    !!draftColorSlot ||
    paletteColors.some(
      (color) => color.value.toLowerCase() === draftColor?.toLowerCase()
    );
  const presetValues = paletteColors.map((color) => color.value);
  const hasUnappliedColor =
    (draftColor || "").toLowerCase() !== (value || "").toLowerCase() ||
    draftColorSlot !== (valueSlot ?? null);

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
    setDraftColor(value ?? null);
    setDraftColorSlot(valueSlot ?? null);
    setCustomColor(displayedColor);
  }, [displayedColor, value, valueSlot]);

  const rememberCustomColor = (color: string) => {
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
  };

  const stageColor = (color: string | null, colorSlot: string | null) => {
    setDraftColor(color);
    setDraftColorSlot(colorSlot);
    if (color) setCustomColor(color);
    setApplyError(null);
  };

  const previewCustomColor = (color: string) => {
    setCustomColor(color);
    stageColor(color, null);
  };

  const applyColor = async () => {
    if (!hasUnappliedColor || isApplying) return;

    setIsApplying(true);
    setApplyError(null);
    try {
      await onChange(draftColor, draftColorSlot);
      if (
        draftColor &&
        !draftColorSlot &&
        !presetValues.some(
          (preset) => preset.toLowerCase() === draftColor.toLowerCase()
        )
      ) {
        rememberCustomColor(draftColor);
      }
    } catch (error) {
      setApplyError(
        error instanceof Error ? error.message : "Could not apply that color"
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="rounded-2xl border border-border/70 bg-card/65 p-3"
        aria-label={`${paletteName === "tasks" ? "Task" : "Event"} color presets`}
      >
        <p className="text-sm font-semibold text-foreground">
          {colorTheme.paletteNames[paletteName]}
        </p>
        {paletteName === "tasks" && (
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            Task colors are independent of tags and priority.
          </p>
        )}
        <p
          className={cn(
            "mb-3 text-xs leading-relaxed text-muted-foreground",
            paletteName === "tasks" && "hidden"
          )}
        >
          Event colors · pick a mood. Task colors stay separate.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {paletteColors.map((color) => {
            const selected = draftColorSlot
              ? color.id === draftColorSlot
              : color.value.toLowerCase() === draftColor?.toLowerCase();

            return (
              <button
                key={color.id}
                type="button"
                onClick={() => stageColor(color.value, color.id)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-border/70 px-1 py-2 text-[10px] font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transform-none",
                  selected &&
                    "ring-2 ring-primary ring-offset-2 ring-offset-card"
                )}
                title={color.name}
                aria-label={color.name}
                aria-pressed={selected}
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-full border border-border"
                  style={{ backgroundColor: color.value }}
                >
                  {selected && (
                    <Check className="h-4 w-4 text-white drop-shadow-sm" />
                  )}
                </span>
                <span className="text-foreground">{color.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {recentColors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Recent custom colors
          </p>
          <div className="flex flex-wrap gap-1" aria-label="Recent colors">
            {recentColors.map((color) => {
              const selected =
                !draftColorSlot &&
                color.toLowerCase() === draftColor?.toLowerCase();

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => stageColor(color, null)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    selected ? "border-foreground/70" : "border-background"
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={`Recent color ${color}`}
                  aria-pressed={selected}
                >
                  {selected && <Check className="h-4 w-4 text-foreground" />}
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
              "inline-flex h-9 items-center gap-2 rounded-full border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground",
              draftColor && !isDraftPreset && "ring-2 ring-ring ring-offset-2"
            )}
          >
            <span
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: customColor }}
              aria-hidden="true"
            />
            <Plus className="h-4 w-4" />
            Custom color
          </span>
        </label>

        <Button
          type="button"
          size="sm"
          onClick={() => void applyColor()}
          disabled={!hasUnappliedColor || isApplying}
        >
          {isApplying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Applying…
            </>
          ) : (
            "Apply color"
          )}
        </Button>

        {allowDefault && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => stageColor(null, null)}
            disabled={!draftColor && !draftColorSlot}
          >
            {defaultLabel}
          </Button>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Choose a swatch or custom color, then apply it.
      </p>
      {applyError && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {applyError}
        </p>
      )}
    </div>
  );
}
