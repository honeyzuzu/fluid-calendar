"use client";

import { type CSSProperties, useState } from "react";

import { Check, Leaf, Sparkles } from "lucide-react";

import { getReadableTextColor } from "@/lib/color-contrast";
import {
  COLOR_THEME_IDS,
  type ColorThemeId,
  getColorThemeCssVariables,
} from "@/lib/color-themes";
import {
  SUNNIE_THEMES,
  getPlannerThemeCssVariables,
} from "@/lib/planner-themes";

const MATERIALS = [
  { id: "paint-swipe", label: "Paint swipe", detail: "soft brushed edges" },
  { id: "scalloped", label: "Scalloped", detail: "tiny cut-paper edge" },
  { id: "ticket", label: "Ticket", detail: "little side notches" },
  { id: "ribbon", label: "Ribbon", detail: "folded V end" },
  { id: "stitched", label: "Stitched", detail: "threaded outline" },
  { id: "marker", label: "Marker note", detail: "a color swipe below" },
] as const;

/** A public, data-free proof of the same stationery primitives used in Plan. */
export default function StationeryPreview() {
  const [selected, setSelected] = useState<ColorThemeId>("base");
  const theme = SUNNIE_THEMES[selected];
  const themeStyle = {
    ...getColorThemeCssVariables(theme),
    ...getPlannerThemeCssVariables(theme),
    backgroundColor: theme.core.canvas,
    color: theme.core.ink,
  } as CSSProperties;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8" style={themeStyle}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: theme.core.primary }}
            >
              Sunnie stationery studio
            </p>
            <h1 className="sunnie-display-heading mt-1 text-3xl sm:text-4xl">
              Five little worlds to plan in.
            </h1>
          </div>
          <p className="max-w-sm text-sm" style={{ color: theme.core.inkSoft }}>
            Switch a colorway to see its paper, illustrations, and accents
            together.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Colorway preview"
          className="mb-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
        >
          {COLOR_THEME_IDS.map((id) => {
            const option = SUNNIE_THEMES[id];
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected === id}
                onClick={() => setSelected(id)}
                className="rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: option.core.surface,
                  borderColor:
                    selected === id ? option.core.primary : option.core.border,
                  color: option.core.ink,
                }}
              >
                <span className="mb-2 flex gap-1" aria-hidden="true">
                  {[
                    option.core.primary,
                    option.core.accent,
                    option.core.warmGlow,
                    option.core.coolGlow,
                  ].map((color, index) => (
                    <span
                      key={index}
                      className="h-3 flex-1 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                <span className="flex items-center justify-between text-sm font-semibold">
                  {option.name}{" "}
                  {selected === id && <Check className="h-4 w-4" />}
                </span>
                <span className="mt-1 block text-xs opacity-70">
                  {option.visual.stationery.paperName}
                </span>
              </button>
            );
          })}
        </div>

        <header className="sunnie-plan-hero relative mb-8 overflow-hidden rounded-[2rem] border p-6 sm:p-8">
          <span aria-hidden="true" className="sunnie-plan-sticker-one" />
          <span aria-hidden="true" className="sunnie-plan-sticker-two" />
          <div className="relative max-w-xl">
            <span
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em]"
              style={{
                backgroundColor: theme.core.accent,
                color: theme.core.onAccent,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />{" "}
              {theme.visual.stationery.caption}
            </span>
            <h2 className="sunnie-display-heading text-4xl leading-tight sm:text-5xl">
              Shape a day that feels like yours.
            </h2>
            <p className="mt-4 text-sm" style={{ color: theme.core.inkSoft }}>
              A little room for plans, a little room for wonder.
            </p>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-[1.3fr_0.7fr]">
          <section className="sunnie-paper-panel rounded-3xl border p-6">
            <p
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em]"
              style={{ color: theme.core.primary }}
            >
              <Leaf className="h-4 w-4" /> Your daily landing pad
            </p>
            <h2 className="mt-2 text-2xl">A gentle rhythm for the day.</h2>
            <p className="mt-2 text-sm" style={{ color: theme.core.inkSoft }}>
              A few small things can make the whole day feel lighter.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                "Set an intention",
                "Choose today’s tasks",
                "Make time for them",
              ].map((label, index) => (
                <div
                  key={label}
                  className="rounded-2xl border p-4 text-sm font-semibold"
                  style={{
                    backgroundColor:
                      index === 1
                        ? theme.core.surfaceMuted
                        : theme.core.surfaceRaised,
                    borderColor: theme.core.border,
                  }}
                >
                  <span
                    className="mb-3 block text-xs"
                    style={{ color: theme.core.primary }}
                  >
                    0{index + 1}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </section>
          <section className="sunnie-paper-panel rounded-3xl border p-6">
            <p
              className="text-xs font-bold uppercase tracking-[0.13em]"
              style={{ color: theme.core.primary }}
            >
              Little details
            </p>
            <h2 className="mt-2 text-2xl">The fun is in the pieces.</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {theme.palettes.events.slice(0, 6).map((swatch) => (
                <span
                  key={swatch.id}
                  className="rounded-lg border px-3 py-2 text-xs font-semibold"
                  style={{
                    backgroundColor: swatch.value,
                    borderColor: theme.core.border,
                    color: getReadableTextColor(swatch.value),
                  }}
                >
                  {swatch.name}
                </span>
              ))}
            </div>
            <p className="mt-5 text-xs" style={{ color: theme.core.inkSoft }}>
              {theme.visual.signatureDetails.join(" · ")}
            </p>
          </section>
        </div>
        <section className="sunnie-paper-panel mt-6 rounded-3xl border p-6">
          <p
            className="text-xs font-bold uppercase tracking-[0.13em]"
            style={{ color: theme.core.primary }}
          >
            Calendar pieces
          </p>
          <h2 className="mt-2 text-2xl">More than one kind of label.</h2>
          <p className="mt-2 text-sm" style={{ color: theme.core.inkSoft }}>
            Each shape keeps its own edge and material. {theme.name} uses{" "}
            {theme.visual.calendar.bujo.eventAppearance.replaceAll("-", " ")}{" "}
            for Bujo events.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {MATERIALS.map((material, index) => {
              const color = theme.palettes.events[index].value;
              const active =
                theme.visual.calendar.bujo.eventAppearance === material.id;
              return (
                <div
                  key={material.id}
                  className="rounded-2xl border p-3"
                  style={{
                    backgroundColor: theme.core.surfaceRaised,
                    borderColor: active
                      ? theme.core.primary
                      : theme.core.border,
                  }}
                >
                  <div
                    className={`fc-event sunnie-material--${material.id} relative flex min-h-12 items-center`}
                    style={{
                      backgroundColor: color,
                      color: getReadableTextColor(
                        ["scalloped", "ticket", "marker"].includes(material.id)
                          ? theme.core.surfaceRaised
                          : color
                      ),
                    }}
                  >
                    <span className="fc-event-main px-3 py-2 text-xs font-semibold">
                      Coffee with Maya
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold">
                    {material.label}
                    {active ? " · in this theme" : ""}
                  </p>
                  <p
                    className="mt-0.5 text-[11px]"
                    style={{ color: theme.core.inkSoft }}
                  >
                    {material.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
