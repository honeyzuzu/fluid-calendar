"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";

import { ColorThemeId, getColorThemeCssVariables } from "@/lib/color-themes";
import {
  MotionPreference,
  persistDisplayPreferences,
} from "@/lib/display-preferences";
import {
  CalendarStyleId,
  SunnieTheme,
  getCalendarPresentation,
  getCalendarStyle,
  getPlannerThemeCssVariables,
  getSunnieTheme,
  getThemeDomAttributes,
} from "@/lib/planner-themes";

import { useSettingsStore } from "@/store/settings";

import { ThemeMode } from "@/types/settings";

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colorTheme: SunnieTheme<ColorThemeId>;
  setColorTheme: (theme: ColorThemeId) => void;
  calendarStyle: CalendarStyleId;
  setCalendarStyle: (style: CalendarStyleId) => void;
  motionPreference: MotionPreference;
  setMotionPreference: (motion: MotionPreference) => void;
};

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  forcedTheme?: ThemeMode;
  enableSystem?: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeProvider({
  children,
  attribute = "class",
  forcedTheme,
  enableSystem = true,
}: ThemeProviderProps) {
  const { user, updateUserSettings } = useSettingsStore();

  // Use forcedTheme if provided, otherwise use user theme
  const currentTheme = forcedTheme || user.theme;
  const currentColorTheme = getSunnieTheme(user.colorTheme);
  const currentCalendarStyle = getCalendarStyle(user.calendarStyle);
  const calendarPresentation = getCalendarPresentation(
    currentColorTheme,
    currentCalendarStyle
  );

  // Function to apply theme to the DOM
  const applyTheme = useCallback(
    (theme: ThemeMode) => {
      const root = window.document.documentElement;

      // Remove both themes first from class
      root.classList.remove("light", "dark");

      // For data attributes other than class
      if (attribute !== "class") {
        root.removeAttribute(attribute);
      }

      // Handle system preference if enabled
      if (theme === "system" && enableSystem) {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";

        // Always add the class for Tailwind
        if (systemTheme === "dark") {
          root.classList.add("dark");
        }

        // Also set the attribute if different from class
        if (attribute !== "class") {
          root.setAttribute(attribute, systemTheme);
        }
      } else {
        // Apply the theme directly
        if (theme === "dark") {
          root.classList.add("dark");
        }

        // Also set the attribute if different from class
        if (attribute !== "class") {
          root.setAttribute(attribute, theme);
        }
      }
    },
    [attribute, enableSystem]
  );

  // Apply theme when it changes
  useEffect(() => {
    if (forcedTheme) {
      applyTheme(forcedTheme);
    } else {
      applyTheme(user.theme);
    }
  }, [user.theme, forcedTheme, applyTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    Object.assign(
      root.dataset,
      getThemeDomAttributes(currentColorTheme, currentCalendarStyle)
    );
    for (const [property, value] of Object.entries({
      ...getColorThemeCssVariables(currentColorTheme),
      ...getPlannerThemeCssVariables(currentColorTheme),
    })) {
      root.style.setProperty(property, value);
    }
    persistDisplayPreferences({
      colorTheme: currentColorTheme.id,
      calendarStyle: currentCalendarStyle,
      motionPreference: user.motionPreference,
    });
    root.dataset.sunnieMotion = user.motionPreference;
  }, [
    calendarPresentation,
    currentCalendarStyle,
    currentColorTheme,
    user.motionPreference,
  ]);

  // Listen for system theme changes if system preference is enabled
  useEffect(() => {
    if (
      forcedTheme ||
      !enableSystem ||
      (forcedTheme ? forcedTheme : user.theme) !== "system"
    )
      return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [user.theme, forcedTheme, enableSystem, applyTheme]);

  const setTheme = (theme: ThemeMode) => {
    // Always update the user settings
    updateUserSettings({ theme });

    // If forcedTheme is set, we don't apply the theme change directly
    // as the forcedTheme will override it in the UI
    if (!forcedTheme) {
      applyTheme(theme);
    }
  };

  const setColorTheme = (theme: ColorThemeId) => {
    updateUserSettings({ colorTheme: theme });
  };

  const setCalendarStyle = (style: CalendarStyleId) => {
    updateUserSettings({ calendarStyle: style });
  };

  const setMotionPreference = (motionPreference: MotionPreference) => {
    updateUserSettings({ motionPreference });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        setTheme,
        colorTheme: currentColorTheme,
        setColorTheme,
        calendarStyle: currentCalendarStyle,
        setCalendarStyle,
        motionPreference: user.motionPreference,
        setMotionPreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
