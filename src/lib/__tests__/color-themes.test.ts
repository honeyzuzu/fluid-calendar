import {
  AUTUMN_GOLDEN_HOUR_THEME,
  BASE_COLOR_THEME,
  COLOR_THEMES,
  COLOR_THEME_CORE_ROLES,
  COLOR_THEME_HEX_COUNT,
  COLOR_THEME_PALETTE_SIZES,
  getColorTheme,
  getColorThemeCssVariables,
  isColorThemeId,
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

  it("falls back safely to Base and produces both legacy and Sunnie tokens", () => {
    expect(isColorThemeId("base")).toBe(true);
    expect(isColorThemeId("autumn-golden-hour")).toBe(true);
    expect(isColorThemeId("missing")).toBe(false);
    expect(getColorTheme("missing")).toBe(BASE_COLOR_THEME);

    const variables = getColorThemeCssVariables(BASE_COLOR_THEME);
    expect(variables["--background"]).toMatch(/^\d+ \d+% \d+%$/);
    expect(variables["--sunnie-canvas"]).toBe("#FFF9E8");
    expect(variables["--sunnie-primary"]).toBe("#64734A");
  });

  it("registers the owner-supplied Autumn palette", () => {
    expect(COLOR_THEMES["autumn-golden-hour"]).toBe(AUTUMN_GOLDEN_HOUR_THEME);
    expect(AUTUMN_GOLDEN_HOUR_THEME.core.primary).toBe("#59634B");
    expect(AUTUMN_GOLDEN_HOUR_THEME.palettes.events[3]).toMatchObject({
      name: "Blue Jean",
      value: "#667D8A",
    });
    expect(AUTUMN_GOLDEN_HOUR_THEME.palettes.tasks[4]).toMatchObject({
      name: "Dusky Plum",
      value: "#A18691",
    });
  });
});
