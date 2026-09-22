import { type CSSProperties, useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import Image from "next/image";

import { BookOpen, Check, MoonStar, Sunrise } from "lucide-react";

import { ThemeMotifIcon } from "@/components/theme/ThemeMotifIcon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  COLOR_THEMES,
  ColorThemeId,
  getThemeColorSlot,
} from "@/lib/color-themes";
import {
  MOTION_PREFERENCES,
  MotionPreference,
} from "@/lib/display-preferences";
import {
  CalendarStyleId,
  getCalendarStyle,
  getPlannerThemeCssVariables,
  getSunnieTheme,
} from "@/lib/planner-themes";

import { useCalendarUIStore } from "@/store/calendar";
import { useSettingsStore } from "@/store/settings";

import { TimeFormat, WeekStartDay } from "@/types/settings";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function UserSettings() {
  const { data: session } = useSession();
  const { user, updateUserSettings } = useSettingsStore();
  const [selectedColorTheme, setSelectedColorTheme] = useState<ColorThemeId>(
    user.colorTheme || "base"
  );
  const [isApplyingColorTheme, setIsApplyingColorTheme] = useState(false);
  const [colorThemeError, setColorThemeError] = useState<string | null>(null);
  const [selectedCalendarStyle, setSelectedCalendarStyle] =
    useState<CalendarStyleId>(getCalendarStyle(user.calendarStyle));
  const [isApplyingCalendarStyle, setIsApplyingCalendarStyle] = useState(false);
  const [calendarStyleError, setCalendarStyleError] = useState<string | null>(
    null
  );

  useEffect(() => {
    setSelectedColorTheme(user.colorTheme || "base");
  }, [user.colorTheme]);

  useEffect(() => {
    setSelectedCalendarStyle(getCalendarStyle(user.calendarStyle));
  }, [user.calendarStyle]);

  const applyColorTheme = async (nextTheme: ColorThemeId) => {
    if (isApplyingColorTheme || nextTheme === selectedColorTheme) return;
    const previousTheme = user.colorTheme || "base";
    setSelectedColorTheme(nextTheme);
    setIsApplyingColorTheme(true);
    setColorThemeError(null);
    useSettingsStore.setState((state) => ({
      user: { ...state.user, colorTheme: nextTheme },
    }));
    try {
      const response = await fetch("/api/color-theme/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colorTheme: nextTheme }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(result?.error || "Failed to apply planner colorway");
      }

      const calendarUI = useCalendarUIStore.getState();
      useCalendarUIStore.setState({
        friendCalendarColors: Object.fromEntries(
          Object.entries(calendarUI.friendCalendarColors).map(
            ([friendId, color]) => [
              friendId,
              getThemeColorSlot("friends", color) || color,
            ]
          )
        ),
      });
      const settingsIdentity = session?.user?.email || session?.user?.name;
      if (settingsIdentity) {
        window.localStorage.setItem(
          `sunnie-color-theme:${settingsIdentity}`,
          nextTheme
        );
      }
    } catch (error) {
      setSelectedColorTheme(previousTheme);
      useSettingsStore.setState((state) => ({
        user: { ...state.user, colorTheme: previousTheme },
      }));
      setColorThemeError(
        error instanceof Error ? error.message : "Failed to apply colorway"
      );
    } finally {
      setIsApplyingColorTheme(false);
    }
  };

  const applyCalendarStyle = async (nextStyle: CalendarStyleId) => {
    if (isApplyingCalendarStyle || nextStyle === selectedCalendarStyle) return;
    const previousStyle = getCalendarStyle(user.calendarStyle);
    setSelectedCalendarStyle(nextStyle);
    setIsApplyingCalendarStyle(true);
    setCalendarStyleError(null);
    useSettingsStore.setState((state) => ({
      user: { ...state.user, calendarStyle: nextStyle },
    }));
    try {
      const response = await fetch("/api/user-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarStyle: nextStyle }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(result?.error || "Failed to apply calendar style");
      }
      window.dispatchEvent(new Event("sunnie:user-settings-updated"));
    } catch (error) {
      setSelectedCalendarStyle(previousStyle);
      useSettingsStore.setState((state) => ({
        user: { ...state.user, calendarStyle: previousStyle },
      }));
      setCalendarStyleError(
        error instanceof Error
          ? error.message
          : "Failed to apply calendar style"
      );
    } finally {
      setIsApplyingCalendarStyle(false);
    }
  };

  const timeFormats: { value: TimeFormat; label: string }[] = [
    { value: "12h", label: "12-hour" },
    { value: "24h", label: "24-hour" },
  ];

  const weekStarts: { value: WeekStartDay; label: string }[] = [
    { value: "sunday", label: "Sunday" },
    { value: "monday", label: "Monday" },
  ];

  // Comprehensive list of common timezones
  const timeZones = [
    // UTC
    "UTC",
    // North America
    "America/Anchorage",
    "America/Chicago",
    "America/Denver",
    "America/Edmonton",
    "America/Halifax",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/Montreal",
    "America/New_York",
    "America/Phoenix",
    "America/Toronto",
    "America/Vancouver",
    "America/Winnipeg",
    // South America
    "America/Bogota",
    "America/Buenos_Aires",
    "America/Caracas",
    "America/Lima",
    "America/Santiago",
    "America/Sao_Paulo",
    // Europe
    "Europe/Amsterdam",
    "Europe/Athens",
    "Europe/Berlin",
    "Europe/Brussels",
    "Europe/Budapest",
    "Europe/Copenhagen",
    "Europe/Dublin",
    "Europe/Helsinki",
    "Europe/Istanbul",
    "Europe/Lisbon",
    "Europe/London",
    "Europe/Madrid",
    "Europe/Moscow",
    "Europe/Oslo",
    "Europe/Paris",
    "Europe/Prague",
    "Europe/Rome",
    "Europe/Stockholm",
    "Europe/Vienna",
    "Europe/Warsaw",
    "Europe/Zurich",
    // Asia
    "Asia/Bangkok",
    "Asia/Dubai",
    "Asia/Hong_Kong",
    "Asia/Jakarta",
    "Asia/Jerusalem",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Kuala_Lumpur",
    "Asia/Manila",
    "Asia/Riyadh",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Taipei",
    "Asia/Tokyo",
    // Africa
    "Africa/Cairo",
    "Africa/Casablanca",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Africa/Nairobi",
    // Oceania
    "Australia/Adelaide",
    "Australia/Brisbane",
    "Australia/Darwin",
    "Australia/Melbourne",
    "Australia/Perth",
    "Australia/Sydney",
    "Pacific/Auckland",
    "Pacific/Fiji",
    "Pacific/Honolulu",
  ];

  return (
    <SettingsSection
      title="User Settings"
      description="Manage your personal preferences for the calendar application."
    >
      {session?.user && (
        <SettingRow label="Profile" description="Your account information">
          <div className="flex items-center space-x-3">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || ""}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div>
              <div className="font-medium">{session.user.name}</div>
              <div className="text-sm text-muted-foreground">
                {session.user.email}
              </div>
            </div>
          </div>
        </SettingRow>
      )}

      {session?.user?.role === "admin" && (
        <SettingRow
          label="Planner colorway"
          description="Changes Sunnie's overall theme and its coordinated seasonal item palettes."
        >
          <div className="space-y-3">
            <div
              role="radiogroup"
              aria-label="Planner colorway"
              className="grid max-w-2xl gap-3 sm:grid-cols-2"
            >
              {Object.values(COLOR_THEMES).map((theme) => {
                const selected = selectedColorTheme === theme.id;
                const stationery = getSunnieTheme(theme.id);
                return (
                  <button
                    key={theme.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={theme.name}
                    aria-disabled={isApplyingColorTheme}
                    onClick={() => void applyColorTheme(theme.id)}
                    className={`sunnie-theme-choice relative overflow-hidden rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      selected
                        ? "border-primary ring-2 ring-primary/35"
                        : "border-border hover:-translate-y-0.5 hover:shadow-[var(--shadow-paper)]"
                    }`}
                    style={
                      {
                        backgroundColor: theme.core.surface,
                        color: theme.core.ink,
                        borderColor: theme.core.border,
                        ...getPlannerThemeCssVariables(stationery),
                      } as CSSProperties
                    }
                  >
                    <span
                      aria-hidden="true"
                      className="sunnie-theme-choice-preview mb-3 block h-28 overflow-hidden rounded-xl border"
                      style={{
                        borderColor: theme.core.border,
                        backgroundColor: theme.core.canvas,
                      }}
                    >
                      <span
                        className="sunnie-theme-choice-tape"
                        style={{ backgroundColor: theme.core.accent }}
                      />
                      <span
                        className="sunnie-theme-choice-note"
                        style={{
                          backgroundColor: theme.core.surfaceRaised,
                          borderColor: theme.core.border,
                        }}
                      >
                        <span
                          className="sunnie-theme-choice-note-title"
                          style={{ color: theme.core.primary }}
                        >
                          {stationery.visual.stationery.paperName}
                        </span>
                        <span
                          className="sunnie-theme-choice-note-line"
                          style={{ backgroundColor: theme.core.border }}
                        />
                        <span
                          className="sunnie-theme-choice-note-line short"
                          style={{ backgroundColor: theme.core.border }}
                        />
                        <span
                          className="sunnie-theme-choice-note-dot"
                          style={{ backgroundColor: theme.core.warmGlow }}
                        />
                      </span>
                      <span className="sunnie-theme-choice-sticker-one" />
                      <span className="sunnie-theme-choice-sticker-two" />
                    </span>
                    <span
                      className="flex min-h-10 items-start justify-between gap-2 text-sm font-bold"
                      style={{ color: theme.core.ink }}
                    >
                      <span className="inline-flex min-w-0 items-start gap-2">
                        <ThemeMotifIcon
                          motif={theme.motif.intentionIcon}
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="break-words leading-5">
                          {theme.name}
                        </span>
                      </span>
                      {selected && <Check className="h-4 w-4 shrink-0" />}
                    </span>
                    <span
                      className="mt-1 block text-xs"
                      style={{ color: theme.core.inkSoft }}
                    >
                      {stationery.visual.stationery.caption}
                    </span>
                    <span className="mt-3 flex gap-1" aria-hidden="true">
                      {[
                        theme.core.primary,
                        theme.core.accent,
                        theme.core.warmGlow,
                        theme.core.coolGlow,
                      ].map((color, index) => (
                        <span
                          key={index}
                          className="h-2.5 w-9 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex max-w-sm items-start gap-2 text-xs text-muted-foreground">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <ThemeMotifIcon
                  motif={COLOR_THEMES[selectedColorTheme].motif.intentionIcon}
                  className="h-4 w-4"
                  aria-label={
                    COLOR_THEMES[selectedColorTheme].motif.intentionLabel
                  }
                />
              </span>
              <span>
                {COLOR_THEMES[selectedColorTheme].description}
                <span className="mt-0.5 block font-medium text-foreground">
                  Intention motif:{" "}
                  {COLOR_THEMES[selectedColorTheme].motif.intentionLabel}
                </span>
              </span>
            </div>
            <div className="grid max-w-md gap-3 sm:grid-cols-2">
              {Object.entries(COLOR_THEMES[selectedColorTheme].palettes).map(
                ([paletteKey, swatches]) => (
                  <section
                    key={paletteKey}
                    className="rounded-xl border border-border bg-card/70 p-3"
                  >
                    <p className="text-xs font-semibold text-foreground">
                      {
                        COLOR_THEMES[selectedColorTheme].paletteNames[
                          paletteKey as keyof (typeof COLOR_THEMES)[ColorThemeId]["palettes"]
                        ]
                      }
                    </p>
                    <p className="mb-2 text-[10px] capitalize text-muted-foreground">
                      {paletteKey}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {swatches.map((swatch) => (
                        <span
                          key={swatch.id}
                          className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"
                          title={`${swatch.name} ${swatch.value}`}
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-border shadow-sm"
                            style={{ backgroundColor: swatch.value }}
                          />
                          {swatch.name}
                        </span>
                      ))}
                    </div>
                  </section>
                )
              )}
            </div>
            <p className="max-w-sm text-xs text-muted-foreground">
              Choosing a colorway updates Sunnie and every theme-linked color
              immediately. Custom colors stay unchanged.
            </p>
            {colorThemeError && (
              <p className="text-xs font-medium text-destructive" role="alert">
                {colorThemeError}
              </p>
            )}
            {isApplyingColorTheme && (
              <p className="text-xs font-medium text-info" role="status">
                Applying colorway…
              </p>
            )}
          </div>
        </SettingRow>
      )}

      <SettingRow
        label="Calendar style"
        description="Choose the calendar's presentation independently from its colorway."
      >
        <div className="space-y-3">
          <div
            role="radiogroup"
            aria-label="Calendar style"
            className="grid max-w-md grid-cols-2 gap-3"
          >
            {(["classic", "bujo"] as const).map((style) => {
              const selected = selectedCalendarStyle === style;
              return (
                <button
                  key={style}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={isApplyingCalendarStyle}
                  onClick={() => void applyCalendarStyle(style)}
                  className={`rounded-2xl border bg-card p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "border-primary ring-2 ring-primary/35"
                      : "border-border hover:bg-muted/45"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mb-2 grid h-16 grid-cols-4 overflow-hidden rounded-lg border border-border ${
                      style === "bujo" ? "sunnie-theme-surface-pattern" : ""
                    }`}
                  >
                    {Array.from({ length: 8 }, (_, index) => (
                      <span
                        key={index}
                        className="border-b border-r border-border/60"
                      />
                    ))}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {style === "classic" ? "Classic" : "Bujo"}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="max-w-sm text-xs text-muted-foreground">
            {selectedCalendarStyle === "bujo"
              ? `Paper-like ${getSunnieTheme(selectedColorTheme).visual.calendar.bujo.gridStyle.replaceAll("-", " ")} with decorative headings and ${getSunnieTheme(selectedColorTheme).visual.calendar.bujo.eventAppearance} events.`
              : "Sunnie's clean, softly rounded calendar with familiar event cards."}
          </p>
          {calendarStyleError && (
            <p className="text-xs font-medium text-destructive" role="alert">
              {calendarStyleError}
            </p>
          )}
          {isApplyingCalendarStyle && (
            <p className="text-xs font-medium text-info" role="status">
              Applying calendar style…
            </p>
          )}
        </div>
      </SettingRow>

      <SettingRow
        label="Time Format"
        description="Choose how times are displayed"
      >
        <Select
          value={user.timeFormat}
          onValueChange={(value) =>
            updateUserSettings({ timeFormat: value as TimeFormat })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeFormats.map((format) => (
              <SelectItem key={format.value} value={format.value}>
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Motion"
        description="Choose how much interface movement feels comfortable. Your device's reduced-motion setting is always respected."
      >
        <div
          role="radiogroup"
          aria-label="Motion preference"
          className="grid max-w-md grid-cols-3 gap-2"
        >
          {MOTION_PREFERENCES.map((preference) => {
            const selected = user.motionPreference === preference;
            return (
              <button
                key={preference}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() =>
                  updateUserSettings({
                    motionPreference: preference as MotionPreference,
                  })
                }
                className={`rounded-xl border px-2 py-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {preference === "full"
                  ? "Full"
                  : preference === "reduced"
                    ? "Reduced"
                    : "Off"}
              </button>
            );
          })}
        </div>
      </SettingRow>

      <SettingRow
        label="Week Starts On"
        description="Choose which day your week starts on"
      >
        <Select
          value={user.weekStartDay}
          onValueChange={(value) =>
            updateUserSettings({ weekStartDay: value as WeekStartDay })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weekStarts.map((day) => (
              <SelectItem key={day.value} value={day.value}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Time Zone"
        description="Your current time zone setting"
      >
        <Select
          value={user.timeZone}
          onValueChange={(value) => updateUserSettings({ timeZone: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {timeZones.map((zone) => (
              <SelectItem key={zone} value={zone}>
                {zone.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Sleep Hours"
        description="Sunnie will not schedule tasks inside your usual sleep window."
      >
        <div className="grid w-full grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sleep-hours-start" className="text-xs">
              Bedtime
            </Label>
            <Input
              id="sleep-hours-start"
              type="time"
              value={user.sleepHoursStart}
              onChange={(event) =>
                updateUserSettings({
                  sleepHoursStart: event.target.value,
                  sleepHoursConfigured: true,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sleep-hours-end" className="text-xs">
              Wake-up
            </Label>
            <Input
              id="sleep-hours-end"
              type="time"
              value={user.sleepHoursEnd}
              onChange={(event) =>
                updateUserSettings({
                  sleepHoursEnd: event.target.value,
                  sleepHoursConfigured: true,
                })
              }
            />
          </div>
        </div>
      </SettingRow>

      <SettingRow
        label="Daily Rhythm"
        description="Choose when Sunnie gently invites you to begin and close your day. Prompts appear while the app is open."
      >
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <label className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Sunrise className="h-4 w-4 text-primary" /> Daily Rise
            </span>
            <input
              type="checkbox"
              checked={user.dailyRiseEnabled}
              onChange={(event) =>
                updateUserSettings({ dailyRiseEnabled: event.target.checked })
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
          </label>
          {user.dailyRiseEnabled && (
            <Input
              aria-label="Daily Rise time"
              type="time"
              value={user.dailyRiseTime}
              onChange={(event) =>
                updateUserSettings({ dailyRiseTime: event.target.value })
              }
            />
          )}
          <label className="flex items-center justify-between gap-4 border-t border-border/70 pt-4">
            <span className="flex items-center gap-2 text-sm font-medium">
              <MoonStar className="h-4 w-4 text-primary" /> Daily Unwind
            </span>
            <input
              type="checkbox"
              checked={user.dailyUnwindEnabled}
              onChange={(event) =>
                updateUserSettings({ dailyUnwindEnabled: event.target.checked })
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
          </label>
          {user.dailyUnwindEnabled && (
            <Input
              aria-label="Daily Unwind time"
              type="time"
              value={user.dailyUnwindTime}
              onChange={(event) =>
                updateUserSettings({ dailyUnwindTime: event.target.value })
              }
            />
          )}
          <div className="border-t border-border/70 pt-4">
            <Label className="text-xs">Prompt me</Label>
            <Select
              value={user.dailyRitualDays}
              onValueChange={(value) =>
                updateUserSettings({
                  dailyRitualDays: value as "working" | "everyday",
                })
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="working">On my working days</SelectItem>
                <SelectItem value="everyday">Every day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingRow>
    </SettingsSection>
  );
}
