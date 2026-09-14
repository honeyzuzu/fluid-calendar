import {
  COLOR_THEME_IDS,
  ColorThemeId,
  getColorThemeCssVariables,
  isColorThemeId,
} from "@/lib/color-themes";
import {
  CALENDAR_STYLES,
  CalendarStyleId,
  getCalendarStyle,
  getPlannerThemeCssVariables,
  getSunnieTheme,
  getThemeDomAttributes,
} from "@/lib/planner-themes";

export const DISPLAY_PREFERENCES_STORAGE_KEY = "sunnie-display-preferences:v1";

export const MOTION_PREFERENCES = ["full", "reduced", "off"] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

export type DisplayPreferences = {
  colorTheme: ColorThemeId;
  calendarStyle: CalendarStyleId;
  motionPreference: MotionPreference;
};

const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  colorTheme: "base",
  calendarStyle: "classic",
  motionPreference: "full",
};

export function isMotionPreference(value: unknown): value is MotionPreference {
  return (
    typeof value === "string" &&
    (MOTION_PREFERENCES as readonly string[]).includes(value)
  );
}

function normalizeDisplayPreferences(value: unknown): DisplayPreferences {
  const candidate =
    value && typeof value === "object"
      ? (value as Partial<DisplayPreferences>)
      : {};

  return {
    colorTheme: isColorThemeId(candidate.colorTheme)
      ? candidate.colorTheme
      : DEFAULT_DISPLAY_PREFERENCES.colorTheme,
    calendarStyle: getCalendarStyle(candidate.calendarStyle),
    motionPreference: isMotionPreference(candidate.motionPreference)
      ? candidate.motionPreference
      : DEFAULT_DISPLAY_PREFERENCES.motionPreference,
  };
}

export function readDisplayPreferences(): DisplayPreferences {
  if (typeof window === "undefined") return DEFAULT_DISPLAY_PREFERENCES;

  try {
    return normalizeDisplayPreferences(
      JSON.parse(
        window.localStorage.getItem(DISPLAY_PREFERENCES_STORAGE_KEY) || "{}"
      )
    );
  } catch {
    return DEFAULT_DISPLAY_PREFERENCES;
  }
}

export function persistDisplayPreferences(
  updates: Partial<DisplayPreferences>
): DisplayPreferences {
  const next = normalizeDisplayPreferences({
    ...readDisplayPreferences(),
    ...updates,
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      DISPLAY_PREFERENCES_STORAGE_KEY,
      JSON.stringify(next)
    );
  }

  return next;
}

export function getDisplayPreferenceSnapshot(
  colorTheme: unknown,
  calendarStyle: unknown,
  motionPreference: unknown = "full"
) {
  const theme = getSunnieTheme(colorTheme);
  const style = getCalendarStyle(calendarStyle);
  const motion = isMotionPreference(motionPreference)
    ? motionPreference
    : DEFAULT_DISPLAY_PREFERENCES.motionPreference;

  return {
    attributes: {
      ...getThemeDomAttributes(theme, style),
      sunnieMotion: motion,
    },
    variables: {
      ...getColorThemeCssVariables(theme),
      ...getPlannerThemeCssVariables(theme),
    },
  };
}

export function getDisplayPreferenceHtmlAttributes(
  colorTheme: unknown,
  calendarStyle: unknown,
  motionPreference: unknown = "full"
): Record<string, string> {
  const { attributes } = getDisplayPreferenceSnapshot(
    colorTheme,
    calendarStyle,
    motionPreference
  );

  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [
      `data-${key.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`)}`,
      value,
    ])
  );
}

/**
 * Runs before React hydration so a returning browser paints its saved
 * stationery and Calendar style instead of briefly showing Base/Classic.
 */
export function getDisplayPreferencePrepaintScript() {
  const snapshots = Object.fromEntries(
    COLOR_THEME_IDS.flatMap((themeId) =>
      CALENDAR_STYLES.map((calendarStyle) => [
        `${themeId}:${calendarStyle}`,
        getDisplayPreferenceSnapshot(themeId, calendarStyle),
      ])
    )
  );

  return `(()=>{try{const value=JSON.parse(localStorage.getItem(${JSON.stringify(
    DISPLAY_PREFERENCES_STORAGE_KEY
  )})||"{}");const key=String(value.colorTheme||"base")+":"+String(value.calendarStyle||"classic");const snapshot=${JSON.stringify(
    snapshots
  )}[key];if(!snapshot)return;const root=document.documentElement;for(const [name,item] of Object.entries(snapshot.attributes)){root.dataset[name]=item}for(const [name,item] of Object.entries(snapshot.variables)){root.style.setProperty(name,item)}const motion=["full","reduced","off"].includes(value.motionPreference)?value.motionPreference:"full";root.dataset.sunnieMotion=motion}catch{}})();`;
}
