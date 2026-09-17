import {
  getHarmonizedTextColor,
  hasReadableContrast,
} from "@/lib/color-contrast";
import {
  AUTUMN_GOLDEN_HOUR_THEME,
  BASE_COLOR_THEME,
  COLOR_THEMES,
  COLOR_THEME_CORE_ROLES,
  COLOR_THEME_HEX_COUNT,
  COLOR_THEME_PALETTE_SIZES,
  SPRING_FRESH_AIR_THEME,
  SUMMER_SUN_KISSED_THEME,
  WINTER_CANDLELIGHT_SNOW_THEME,
  getAccessibleControlForeground,
  getColorTheme,
  getColorThemeCssVariables,
  getStableThemeColorSlot,
  getThemeColorSlot,
  isColorThemeId,
  mapThemeLinkedColor,
  resolveThemeLinkedColor,
} from "@/lib/color-themes";

describe("planner colorways", () => {
  it("requires exactly 44 hexes in every theme", () => {
    expect(COLOR_THEME_CORE_ROLES).toHaveLength(14);
    expect(COLOR_THEME_PALETTE_SIZES).toEqual({
      events: 8,
      projects: 6,
      tasks: 6,
      friends: 6,
      statuses: 4,
    });
    expect(COLOR_THEME_HEX_COUNT).toBe(44);
  });

  it("keeps every theme populated with exactly 44 valid hexes", () => {
    for (const theme of Object.values(COLOR_THEMES)) {
      const colors = [
        ...Object.values(theme.core),
        ...Object.values(theme.palettes).flatMap((palette) =>
          palette.map((swatch) => swatch.value)
        ),
      ];

      expect(colors).toHaveLength(COLOR_THEME_HEX_COUNT);
      for (const color of colors) expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("derives accessible theme-aware text for every event and task swatch", () => {
    for (const theme of Object.values(COLOR_THEMES)) {
      for (const swatch of [
        ...theme.palettes.events,
        ...theme.palettes.tasks,
      ]) {
        const foreground = getHarmonizedTextColor(swatch.value, {
          darkColor: theme.core.ink,
          lightColor: theme.core.surfaceRaised,
        });

        if (!hasReadableContrast(foreground, swatch.value)) {
          throw new Error(
            `${theme.id} ${swatch.id}: ${foreground} is not readable on ${swatch.value}`
          );
        }
      }
    }
  });

  it("uses stable unique slot ids inside each mini-palette", () => {
    for (const theme of Object.values(COLOR_THEMES)) {
      for (const [paletteName, palette] of Object.entries(theme.palettes)) {
        expect(palette).toHaveLength(
          COLOR_THEME_PALETTE_SIZES[
            paletteName as keyof typeof COLOR_THEME_PALETTE_SIZES
          ]
        );
        const ids = palette.map((swatch) => swatch.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it("publishes a visible collection name for every mini-palette", () => {
    for (const theme of Object.values(COLOR_THEMES)) {
      expect(Object.keys(theme.paletteNames).sort()).toEqual(
        Object.keys(COLOR_THEME_PALETTE_SIZES).sort()
      );
      for (const name of Object.values(theme.paletteNames)) {
        expect(name.trim().length).toBeGreaterThan(0);
      }
    }
    expect(AUTUMN_GOLDEN_HOUR_THEME.paletteNames.events).toBe("Apple Picking");
    expect(SPRING_FRESH_AIR_THEME.paletteNames.projects).toBe("Garden Party");
  });

  it("falls back safely to Base and produces both legacy and Sunnie tokens", () => {
    expect(isColorThemeId("base")).toBe(true);
    expect(isColorThemeId("autumn-golden-hour")).toBe(true);
    expect(isColorThemeId("missing")).toBe(false);
    expect(getColorTheme("missing")).toBe(BASE_COLOR_THEME);

    const variables = getColorThemeCssVariables(BASE_COLOR_THEME);
    expect(variables["--background"]).toMatch(/^\d+ \d+% \d+%$/);
    expect(variables["--sunnie-canvas"]).toBe("#F7F1E4");
    expect(variables["--sunnie-primary"]).toBe("#61734F");
    expect(variables["--sunnie-task-1"]).toBe("#F7BEB5");
    expect(variables["--sunnie-task-1-foreground"]).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it("registers the owner-supplied Autumn palette", () => {
    expect(COLOR_THEMES["autumn-golden-hour"]).toBe(AUTUMN_GOLDEN_HOUR_THEME);
    expect(AUTUMN_GOLDEN_HOUR_THEME.core.primary).toBe("#755A47");
    expect(AUTUMN_GOLDEN_HOUR_THEME.motif.intentionIcon).toBe("autumn-leaf");
    expect(AUTUMN_GOLDEN_HOUR_THEME.palettes.events[3]).toMatchObject({
      name: "Blue Jean",
      value: "#667D8A",
    });
    expect(AUTUMN_GOLDEN_HOUR_THEME.palettes.tasks[4]).toMatchObject({
      name: "Dusky Plum",
      value: "#A18691",
    });
  });

  it("registers the owner-supplied Spring palette", () => {
    expect(COLOR_THEMES["spring-fresh-air"]).toBe(SPRING_FRESH_AIR_THEME);
    expect(SPRING_FRESH_AIR_THEME.core.primary).toBe("#805E72");
    expect(SPRING_FRESH_AIR_THEME.motif.intentionIcon).toBe("flower");
    expect(SPRING_FRESH_AIR_THEME.palettes.events[0]).toMatchObject({
      name: "Raincoat",
      value: "#E1B94F",
    });
    expect(SPRING_FRESH_AIR_THEME.palettes.friends[0]).toMatchObject({
      name: "Strawberry Jam",
      value: "#CE7E7E",
    });
  });

  it("registers the owner-supplied Summer palette", () => {
    expect(COLOR_THEMES["summer-sun-kissed"]).toBe(SUMMER_SUN_KISSED_THEME);
    expect(SUMMER_SUN_KISSED_THEME.core.primary).toBe("#4F786F");
    expect(SUMMER_SUN_KISSED_THEME.motif.intentionIcon).toBe("sun");
    expect(SUMMER_SUN_KISSED_THEME.palettes.events[0]).toMatchObject({
      name: "Strawberry",
      value: "#D94F45",
    });
    expect(SUMMER_SUN_KISSED_THEME.palettes.tasks[0]).toMatchObject({
      name: "Seafoam",
      value: "#A9D4C8",
    });
  });

  it("registers the owner-supplied Winter palette", () => {
    expect(COLOR_THEMES["winter-candlelight-snow"]).toBe(
      WINTER_CANDLELIGHT_SNOW_THEME
    );
    expect(WINTER_CANDLELIGHT_SNOW_THEME.core.primary).toBe("#4B676B");
    expect(WINTER_CANDLELIGHT_SNOW_THEME.motif.intentionIcon).toBe("snowflake");
    expect(WINTER_CANDLELIGHT_SNOW_THEME.palettes.events[7]).toMatchObject({
      name: "Golden Window",
      value: "#D5AE68",
    });
    expect(WINTER_CANDLELIGHT_SNOW_THEME.palettes.projects[5]).toMatchObject({
      name: "Sugar Plum",
      value: "#96788F",
    });
  });

  it("maps palette-linked colors by stable slot and preserves custom colors", () => {
    expect(mapThemeLinkedColor("events", "#9BC7D9", "autumn-golden-hour")).toBe(
      "#8FA05A"
    );
    expect(mapThemeLinkedColor("events", "#3b82f6", "spring-fresh-air")).toBe(
      "#719DB5"
    );
    expect(mapThemeLinkedColor("projects", "#D5DD8D", "spring-fresh-air")).toBe(
      "#9DAE8A"
    );
    expect(
      mapThemeLinkedColor("friends", "#CE7E7E", "winter-candlelight-snow")
    ).toBe("#9A7968");
    expect(mapThemeLinkedColor("events", "#123456", "summer-sun-kissed")).toBe(
      "#123456"
    );
  });

  it("resolves linked slots in the active theme while preserving custom hexes", () => {
    expect(getThemeColorSlot("events", "#9bc7d9")).toBe("event-1");
    expect(
      resolveThemeLinkedColor(
        "events",
        "event-1",
        "#123456",
        "winter-candlelight-snow"
      )
    ).toBe("#91B4C4");
    expect(
      resolveThemeLinkedColor(
        "events",
        null,
        "#123456",
        "winter-candlelight-snow"
      )
    ).toBe("#123456");
    expect(getStableThemeColorSlot("events", "calendar-a")).toMatch(
      /^event-[1-8]$/
    );
    expect(getStableThemeColorSlot("events", "calendar-a")).toBe(
      getStableThemeColorSlot("events", "calendar-a")
    );
  });

  it("exports every semantic status token", () => {
    const variables = getColorThemeCssVariables(SUMMER_SUN_KISSED_THEME);
    expect(variables["--success"]).toBeDefined();
    expect(variables["--info"]).toBeDefined();
    expect(variables["--sunnie-status-success"]).toBe("#60845E");
    expect(variables["--sunnie-status-info"]).toBe("#5F91A8");
  });

  it("keeps every refreshed primary control readable", () => {
    for (const theme of Object.values(COLOR_THEMES)) {
      expect(
        hasReadableContrast(
          getAccessibleControlForeground(
            theme.core.onPrimary,
            theme.core.primary
          ),
          theme.core.primary
        )
      ).toBe(true);
    }
  });
});
