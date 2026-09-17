"use client";

import { type CSSProperties, useEffect, useState } from "react";

import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";

import { getHarmonizedTextColor } from "@/lib/color-contrast";
import {
  COLOR_THEME_IDS,
  type ColorThemeId,
  getColorThemeCssVariables,
} from "@/lib/color-themes";
import {
  SUNNIE_THEMES,
  getPlannerThemeCssVariables,
  getThemeDomAttributes,
} from "@/lib/planner-themes";

/** A fixture with real FullCalendar cells and no account or calendar data. */
export default function BujoComponentsPreview() {
  const [selected, setSelected] = useState<ColorThemeId>("autumn-golden-hour");
  const [view, setView] = useState<"timeGridWeek" | "dayGridMonth">(
    "timeGridWeek"
  );
  const theme = SUNNIE_THEMES[selected];

  useEffect(() => {
    const root = document.documentElement;
    const attributes = getThemeDomAttributes(theme, "bujo");
    const variables = {
      ...getColorThemeCssVariables(theme),
      ...getPlannerThemeCssVariables(theme),
    };
    const previousAttributes = Object.fromEntries(
      Object.keys(attributes).map((key) => [key, root.dataset[key]])
    );
    const previousVariables = Object.fromEntries(
      Object.keys(variables).map((key) => [
        key,
        root.style.getPropertyValue(key),
      ])
    );
    const frame = requestAnimationFrame(() => {
      Object.assign(root.dataset, attributes);
      for (const [key, value] of Object.entries(variables)) {
        root.style.setProperty(key, value);
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      for (const [key, value] of Object.entries(previousAttributes)) {
        if (value === undefined) delete root.dataset[key];
        else root.dataset[key] = value;
      }
      for (const [key, value] of Object.entries(previousVariables)) {
        if (value) root.style.setProperty(key, value);
        else root.style.removeProperty(key);
      }
    };
  }, [theme]);

  const eventAppearance = theme.visual.calendar.bujo.eventAppearance;
  const taskAppearance = theme.visual.calendar.bujo.taskAppearance;
  const itemText = (color: string, appearance: string) =>
    getHarmonizedTextColor(
      ["outline", "ticket", "scalloped", "marker"].includes(appearance)
        ? theme.core.surfaceRaised
        : color,
      {
        tintColor: color,
        darkColor: theme.core.ink,
        lightColor: theme.core.surfaceRaised,
      }
    );
  const events = [
    {
      title: "Farmers market",
      start: "2026-09-14",
      allDay: true,
      backgroundColor: theme.palettes.events[0].value,
      borderColor: theme.palettes.events[0].value,
      textColor: itemText(
        theme.palettes.events[0].value,
        theme.visual.calendar.bujo.allDayAppearance
      ),
      classNames: ["calendar-event", "calendar-event-all-day"],
    },
    ...[15, 16, 17, 18].map((day, index) => ({
      title: index === 2 ? "Coffee with Maya" : "Standup",
      start: `2026-09-${day}T09:00:00`,
      end: `2026-09-${day}T09:45:00`,
      backgroundColor: theme.palettes.events[index + 1].value,
      borderColor: theme.palettes.events[index + 1].value,
      textColor: itemText(
        theme.palettes.events[index + 1].value,
        eventAppearance
      ),
      classNames: ["calendar-event"],
    })),
    {
      title: "Sketch new plans",
      start: "2026-09-17T11:00:00",
      end: "2026-09-17T12:30:00",
      backgroundColor: theme.palettes.tasks[0].value,
      borderColor: theme.palettes.tasks[0].value,
      textColor: itemText(theme.palettes.tasks[0].value, taskAppearance),
      classNames: ["calendar-task", "calendar-task-color-1"],
    },
  ];

  return (
    <main
      className="min-h-screen px-4 py-7 sm:px-7"
      style={
        {
          ...getColorThemeCssVariables(theme),
          ...getPlannerThemeCssVariables(theme),
          backgroundColor: theme.core.canvas,
          color: theme.core.ink,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-7xl">
        <p
          className="text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: theme.core.primary }}
        >
          Sunnie Bujo material preview
        </p>
        <h1 className="sunnie-display-heading mt-1 text-3xl sm:text-4xl">
          Dots, quiet columns, playful labels.
        </h1>
        <p
          className="mt-2 max-w-2xl text-sm"
          style={{ color: theme.core.inkSoft }}
        >
          This is real calendar markup with sample events. Switch themes and
          views to inspect the paper and item shapes.
        </p>
        <div className="my-5 flex flex-wrap gap-2">
          {COLOR_THEME_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={selected === id}
              onClick={() => setSelected(id)}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor:
                  selected === id ? theme.core.accent : theme.core.surface,
                borderColor: theme.core.border,
              }}
            >
              {SUNNIE_THEMES[id].name}
            </button>
          ))}
          <div className="ml-auto flex gap-1">
            {(["timeGridWeek", "dayGridMonth"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{
                  backgroundColor:
                    view === option ? theme.core.accent : theme.core.surface,
                  borderColor: theme.core.border,
                }}
              >
                {option === "timeGridWeek" ? "Week" : "Month"}
              </button>
            ))}
          </div>
        </div>
        <div
          className="sunnie-calendar-frame overflow-x-auto"
          style={{ backgroundColor: theme.core.surface }}
        >
          <div className="min-w-[720px]">
            <FullCalendar
              key={`${selected}-${view}`}
              plugins={[timeGridPlugin, dayGridPlugin]}
              initialView={view}
              initialDate="2026-09-14"
              headerToolbar={false}
              height={view === "timeGridWeek" ? 680 : 740}
              slotMinTime="08:00:00"
              slotMaxTime="17:00:00"
              slotDuration="01:00:00"
              dayHeaderFormat={
                view === "dayGridMonth"
                  ? { weekday: "short" }
                  : { weekday: "short", day: "numeric" }
              }
              events={events}
              eventContent={(eventInfo) => (
                <div className="flex min-w-0 items-center gap-1 overflow-hidden px-1.5 py-0.5 text-[11px] font-medium">
                  <span aria-hidden="true" className="shrink-0 opacity-70">
                    ✦
                  </span>
                  <span className="truncate">{eventInfo.event.title}</span>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
