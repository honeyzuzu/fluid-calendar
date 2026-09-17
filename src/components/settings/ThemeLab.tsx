"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { Eye, FlaskConical, RotateCcw, Sparkles } from "lucide-react";

import AdminOnly from "@/components/auth/AdminOnly";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getHarmonizedTextColor } from "@/lib/color-contrast";
import { getColorThemeCssVariables } from "@/lib/color-themes";
import {
  BORDER_STYLES,
  CALENDAR_ITEM_APPEARANCES,
  CALENDAR_STYLES,
  CalendarPresentation,
  CalendarStyleId,
  PATTERN_STYLES,
  STICKER_PACKS,
  THEME_LAB_THEMES,
  TYPOGRAPHY_STYLES,
  ThemeLabThemeId,
  VISUAL_TEST_THEME,
  WASHI_PACKS,
  WASHI_PATTERNS,
  getCalendarPresentation,
  getPlannerThemeCssVariables,
  getThemeDomAttributes,
} from "@/lib/planner-themes";

const selectClassName =
  "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm outline-none focus:ring-2 focus:ring-ring";

const motionSymbols = {
  none: [],
  sprout: ["🌱"],
  petals: ["🌸", "✿", "🌸"],
  leaves: ["🍂", "🍁", "🍂"],
  "sun-shimmer": ["☀️", "✦", "☀️"],
  snow: ["❄", "✧", "❄"],
  sparkle: ["✦", "✧", "✦"],
} as const;

export function ThemeLab() {
  const [themeId, setThemeId] = useState<ThemeLabThemeId>(VISUAL_TEST_THEME.id);
  const [calendarStyle, setCalendarStyle] = useState<CalendarStyleId>("bujo");
  const selectedTheme = THEME_LAB_THEMES[themeId];
  const [presentation, setPresentation] = useState<CalendarPresentation>(() =>
    getCalendarPresentation(VISUAL_TEST_THEME, "bujo")
  );

  const previewTheme = useMemo(
    () => ({
      ...selectedTheme,
      visual: {
        ...selectedTheme.visual,
        calendar: {
          ...selectedTheme.visual.calendar,
          [calendarStyle]: presentation,
        },
      },
    }),
    [calendarStyle, presentation, selectedTheme]
  );
  const previewAttributes = useMemo(
    () => getThemeDomAttributes(previewTheme, calendarStyle),
    [calendarStyle, previewTheme]
  );
  const previewVariables = useMemo(
    () =>
      ({
        ...getColorThemeCssVariables(previewTheme),
        ...getPlannerThemeCssVariables(previewTheme),
      }) as CSSProperties,
    [previewTheme]
  );

  useEffect(() => {
    const root = window.document.documentElement;
    const previous = Object.fromEntries(
      Object.keys(previewAttributes).map((key) => [
        key,
        root.dataset[key] ?? null,
      ])
    );
    Object.assign(root.dataset, previewAttributes);

    return () => {
      for (const [key, value] of Object.entries(previous)) {
        if (value === null) delete root.dataset[key];
        else root.dataset[key] = value;
      }
    };
  }, [previewAttributes]);

  const chooseTheme = (nextThemeId: ThemeLabThemeId) => {
    const nextTheme = THEME_LAB_THEMES[nextThemeId];
    setThemeId(nextThemeId);
    setPresentation(getCalendarPresentation(nextTheme, calendarStyle));
  };

  const chooseCalendarStyle = (nextStyle: CalendarStyleId) => {
    setCalendarStyle(nextStyle);
    setPresentation(getCalendarPresentation(selectedTheme, nextStyle));
  };

  const resetPreset = () => {
    setPresentation(getCalendarPresentation(selectedTheme, calendarStyle));
  };

  const updatePresentation = <Key extends keyof CalendarPresentation>(
    key: Key,
    value: CalendarPresentation[Key]
  ) => setPresentation((current) => ({ ...current, [key]: value }));

  const presetPresentation = getCalendarPresentation(
    selectedTheme,
    calendarStyle
  );
  const isCustomized = Object.entries(presentation).some(
    ([key, value]) =>
      presetPresentation[key as keyof CalendarPresentation] !== value
  );

  return (
    <AdminOnly
      fallback={
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Administrator access is required to use Theme Lab.
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-6" data-testid="admin-theme-lab">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  <FlaskConical className="h-4 w-4" /> Admin preview
                </div>
                <CardTitle>Theme Lab</CardTitle>
                <CardDescription className="mt-2 max-w-2xl">
                  Try built-in and experimental visual primitives against fake
                  calendar data. Nothing here is saved to your account.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetPreset}
                disabled={!isCustomized}
              >
                <RotateCcw className="h-4 w-4" /> Reset preset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <LabSelect
              label="Theme pack"
              value={themeId}
              onChange={(value) => chooseTheme(value as ThemeLabThemeId)}
              options={Object.values(THEME_LAB_THEMES).map((theme) => ({
                value: theme.id,
                label:
                  theme.id === VISUAL_TEST_THEME.id
                    ? `${theme.name} (lab only)`
                    : theme.name,
              }))}
            />
            <LabSelect
              label="Calendar style"
              value={calendarStyle}
              onChange={(value) =>
                chooseCalendarStyle(value as CalendarStyleId)
              }
              options={CALENDAR_STYLES.map((style) => ({
                value: style,
                label: style === "bujo" ? "Bujo" : "Classic",
              }))}
            />
            <LabSelect
              label="Paper grid"
              value={presentation.gridStyle}
              onChange={(value) =>
                updatePresentation(
                  "gridStyle",
                  value as CalendarPresentation["gridStyle"]
                )
              }
              options={[
                "soft",
                ...PATTERN_STYLES.filter((p) => p !== "none"),
              ].map(optionFromValue)}
            />
            <LabSelect
              label="Grid border"
              value={presentation.borderStyle}
              onChange={(value) =>
                updatePresentation(
                  "borderStyle",
                  value as CalendarPresentation["borderStyle"]
                )
              }
              options={BORDER_STYLES.map(optionFromValue)}
            />
            <LabSelect
              label="Event design"
              value={presentation.eventAppearance}
              onChange={(value) =>
                updatePresentation(
                  "eventAppearance",
                  value as CalendarPresentation["eventAppearance"]
                )
              }
              options={CALENDAR_ITEM_APPEARANCES.map(optionFromValue)}
            />
            <LabSelect
              label="Task design"
              value={presentation.taskAppearance}
              onChange={(value) =>
                updatePresentation(
                  "taskAppearance",
                  value as CalendarPresentation["taskAppearance"]
                )
              }
              options={CALENDAR_ITEM_APPEARANCES.map(optionFromValue)}
            />
            <LabSelect
              label="All-day design"
              value={presentation.allDayAppearance}
              onChange={(value) =>
                updatePresentation(
                  "allDayAppearance",
                  value as CalendarPresentation["allDayAppearance"]
                )
              }
              options={CALENDAR_ITEM_APPEARANCES.map(optionFromValue)}
            />
            <LabSelect
              label="Calendar type"
              value={presentation.typography}
              onChange={(value) =>
                updatePresentation(
                  "typography",
                  value as CalendarPresentation["typography"]
                )
              }
              options={TYPOGRAPHY_STYLES.map(optionFromValue)}
            />
            <LabSelect
              label="Washi pattern"
              value={presentation.washiPattern}
              onChange={(value) =>
                updatePresentation(
                  "washiPattern",
                  value as CalendarPresentation["washiPattern"]
                )
              }
              options={WASHI_PATTERNS.map(optionFromValue)}
            />
          </CardContent>
        </Card>

        <section
          className="overflow-hidden rounded-3xl border border-[var(--sunnie-border)] bg-[var(--sunnie-canvas)] text-[var(--sunnie-ink)] shadow-xl"
          style={previewVariables}
          aria-label={`${selectedTheme.name} ${calendarStyle} preview`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sunnie-border)] bg-[var(--sunnie-surface)] px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--sunnie-ink-soft)]">
                {selectedTheme.family} theme
              </p>
              <h2 className="mt-1 text-xl font-bold">{selectedTheme.name}</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <PreviewBadge>{calendarStyle}</PreviewBadge>
              <PreviewBadge>{presentation.gridStyle}</PreviewBadge>
              {isCustomized && <PreviewBadge>custom mix</PreviewBadge>}
            </div>
          </div>

          <div className="grid gap-5 p-3 sm:p-5 xl:grid-cols-[minmax(0,1fr)_230px]">
            <FakeCalendar theme={selectedTheme} presentation={presentation} />
            <aside className="sunnie-theme-surface-pattern space-y-4 rounded-2xl border border-[var(--sunnie-border)] bg-[var(--sunnie-surface-raised)] p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[var(--sunnie-primary)]" />
                <h3 className="font-bold">Pack details</h3>
              </div>
              <p className="text-xs leading-5 text-[var(--sunnie-ink-soft)]">
                {selectedTheme.description}
              </p>
              <SwatchRow
                label={selectedTheme.paletteNames.events}
                colors={selectedTheme.palettes.events.map((item) => item.value)}
              />
              <SwatchRow
                label={selectedTheme.paletteNames.tasks}
                colors={selectedTheme.palettes.tasks.map((item) => item.value)}
              />
              <div className="rounded-xl bg-[var(--sunnie-surface-muted)] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--sunnie-ink-soft)]">
                  Motion: {selectedTheme.visual.motion.activation}
                </p>
                <div className="mt-2 flex min-h-8 items-center gap-3 text-xl">
                  {motionSymbols[selectedTheme.visual.motion.activation]
                    .length ? (
                    motionSymbols[selectedTheme.visual.motion.activation].map(
                      (symbol, index) => (
                        <span
                          key={`${symbol}-${index}`}
                          className="motion-safe:animate-pulse"
                          style={{ animationDelay: `${index * 180}ms` }}
                        >
                          {symbol}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-xs text-[var(--sunnie-ink-muted)]">
                      No ambient motion
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-[var(--sunnie-border)] p-3 text-xs text-[var(--sunnie-ink-soft)]">
                <Sparkles className="mb-2 h-4 w-4" />
                <p>Sticker pack: {getStickerPackLabel(selectedTheme)}</p>
                {selectedTheme.visual.assets.stickerPack && (
                  <div className="mt-2 flex gap-2 text-2xl" aria-hidden="true">
                    {STICKER_PACKS[
                      selectedTheme.visual.assets.stickerPack
                    ].stickers.map((sticker) => (
                      <span
                        key={sticker.id}
                        className="inline-block -rotate-6 motion-safe:hover:rotate-6 motion-safe:hover:scale-110"
                      >
                        {sticker.preview}
                      </span>
                    ))}
                  </div>
                )}
                {selectedTheme.visual.assets.washiPack && (
                  <p className="mt-3 border-t border-[var(--sunnie-border)] pt-3">
                    Washi:{" "}
                    {WASHI_PACKS[selectedTheme.visual.assets.washiPack].join(
                      " · "
                    )}
                  </p>
                )}
              </div>
              <div className="sunnie-theme-accent-edge rounded-xl bg-[var(--sunnie-accent)] px-3 py-2 text-xs font-semibold text-[var(--sunnie-on-accent)]">
                {selectedTheme.visual.signatureDetails.join(" · ")}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </AdminOnly>
  );
}

function FakeCalendar({
  theme,
  presentation,
}: {
  theme: (typeof THEME_LAB_THEMES)[ThemeLabThemeId];
  presentation: CalendarPresentation;
}) {
  const event = theme.palettes.events[1].value;
  const allDay = theme.palettes.events[5].value;
  const task = theme.palettes.tasks[2].value;
  const itemTextColor = (
    itemColor: string,
    appearance: CalendarPresentation["eventAppearance"]
  ) =>
    getHarmonizedTextColor(
      appearance === "outline" ? theme.core.surfaceRaised : itemColor,
      {
        tintColor: itemColor,
        darkColor: theme.core.ink,
        lightColor: theme.core.surfaceRaised,
      }
    );

  return (
    <div className="sunnie-calendar-frame min-h-[520px] overflow-hidden rounded-2xl border border-[var(--sunnie-border)] bg-[var(--sunnie-surface)] shadow-lg">
      <div className="fc fc-theme-standard h-full min-h-[520px] p-3 sm:p-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[var(--sunnie-ink-soft)]">
              September 14–18
            </p>
            <h3 className="text-lg font-bold">A week in Sunnie</h3>
          </div>
          <span className="rounded-xl bg-[var(--sunnie-accent)] px-3 py-1.5 text-xs font-bold text-[var(--sunnie-on-accent)]">
            Today
          </span>
        </div>

        <div className="mb-3 grid grid-cols-[52px_repeat(5,minmax(64px,1fr))] overflow-x-auto rounded-xl border border-[var(--sunnie-border)] bg-[var(--sunnie-surface)]">
          <div className="p-2" />
          {["Mon 14", "Tue 15", "Wed 16", "Thu 17", "Fri 18"].map((day) => (
            <div
              key={day}
              className="fc-col-header-cell theme-lab-grid-cell border-l border-[var(--sunnie-border)] p-2 text-center text-xs font-bold"
            >
              <span className="fc-col-header-cell-cushion">{day}</span>
            </div>
          ))}
          <div className="theme-lab-grid-cell border-t border-[var(--sunnie-border)] p-2 text-[10px] text-[var(--sunnie-ink-muted)]">
            all-day
          </div>
          <div className="theme-lab-grid-cell col-span-5 border-l border-t border-[var(--sunnie-border)] p-1.5">
            <div
              className="fc-event calendar-event calendar-event-all-day relative px-2 py-1 text-xs font-semibold"
              style={{
                backgroundColor: allDay,
                borderColor: allDay,
                color: itemTextColor(allDay, presentation.allDayAppearance),
              }}
            >
              <div className="fc-event-main">Garden picnic</div>
            </div>
          </div>
        </div>

        <div className="relative grid min-h-[380px] grid-cols-[52px_repeat(5,minmax(64px,1fr))] grid-rows-6 overflow-x-auto rounded-xl border border-[var(--sunnie-border)]">
          {["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM"].map(
            (hour, index) => (
              <div
                key={hour}
                className="theme-lab-grid-cell border-t border-[var(--sunnie-border)] p-1 text-right text-[10px] text-[var(--sunnie-ink-muted)]"
                style={{ gridColumn: 1, gridRow: index + 1 }}
              >
                {hour}
              </div>
            )
          )}
          {Array.from({ length: 30 }, (_, index) => (
            <div
              key={index}
              className="theme-lab-grid-cell border-l border-t border-[var(--sunnie-border)]"
              style={{
                gridColumn: (index % 5) + 2,
                gridRow: Math.floor(index / 5) + 1,
              }}
            />
          ))}
          <div
            className="fc-event calendar-event relative z-10 m-1 px-2 py-1 text-xs font-semibold"
            style={{
              gridColumn: 3,
              gridRow: "2 / span 2",
              backgroundColor: event,
              borderColor: event,
              color: itemTextColor(event, presentation.eventAppearance),
            }}
          >
            <div className="fc-event-main">Coffee with Maya</div>
          </div>
          <div
            className="fc-event calendar-task relative z-10 m-1 px-2 py-1 text-xs font-semibold"
            style={{
              gridColumn: 5,
              gridRow: "4 / span 2",
              backgroundColor: task,
              borderColor: task,
            }}
          >
            <div
              className="fc-event-main"
              style={{
                color: itemTextColor(task, presentation.taskAppearance),
              }}
            >
              Plan the weekend
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
      <span>{label}</span>
      <select
        className={selectClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PreviewBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--sunnie-surface-muted)] px-3 py-1.5 capitalize text-[var(--sunnie-ink-soft)]">
      {children}
    </span>
  );
}

function SwatchRow({ label, colors }: { label: string; colors: string[] }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--sunnie-ink-soft)]">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color) => (
          <span
            key={color}
            className="h-6 w-6 rounded-full border border-border shadow-sm"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}

function getStickerPackLabel(
  theme: (typeof THEME_LAB_THEMES)[ThemeLabThemeId]
) {
  const stickerPack = theme.visual.assets.stickerPack;
  return stickerPack ? STICKER_PACKS[stickerPack].label : "None";
}

function optionFromValue(value: string) {
  return {
    value,
    label: value
      .split("-")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" "),
  };
}
