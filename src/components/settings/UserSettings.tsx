import { useSession } from "next-auth/react";
import Image from "next/image";

import { MoonStar, Palette, Sunrise } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { COLOR_THEMES, ColorThemeId } from "@/lib/color-themes";

import { useSettingsStore } from "@/store/settings";

import { TimeFormat, WeekStartDay } from "@/types/settings";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function UserSettings() {
  const { data: session } = useSession();
  const { user, updateUserSettings } = useSettingsStore();

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

      <SettingRow
        label="Planner colorway"
        description="Changes Sunnie's overall theme and its coordinated item palettes. Two more colorways are being designed."
      >
        <div className="space-y-2">
          <Select
            value={user.colorTheme || "base"}
            onValueChange={(value) =>
              updateUserSettings({ colorTheme: value as ColorThemeId })
            }
          >
            <SelectTrigger aria-label="Planner colorway">
              <Palette className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(COLOR_THEMES).map((theme) => (
                <SelectItem key={theme.id} value={theme.id}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1.5" aria-label="Current colorway preview">
            {COLOR_THEMES[user.colorTheme || "base"].palettes.events
              .slice(0, 6)
              .map((swatch) => (
                <span
                  key={swatch.id}
                  className="h-5 w-5 rounded-full border border-black/10 shadow-sm"
                  style={{ backgroundColor: swatch.value }}
                  title={swatch.name}
                />
              ))}
          </div>
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
        <div className="space-y-4 rounded-2xl border border-[#dce3c9] bg-[#fffdf5] p-4">
          <label className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Sunrise className="h-4 w-4 text-[#d99d32]" /> Daily Rise
            </span>
            <input
              type="checkbox"
              checked={user.dailyRiseEnabled}
              onChange={(event) =>
                updateUserSettings({ dailyRiseEnabled: event.target.checked })
              }
              className="h-4 w-4 rounded border-[#cbd5b8] text-[#7f9b5d] focus:ring-[#b6c994]"
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
          <label className="flex items-center justify-between gap-4 border-t border-black/[0.055] pt-4">
            <span className="flex items-center gap-2 text-sm font-medium">
              <MoonStar className="h-4 w-4 text-[#8069a8]" /> Daily Unwind
            </span>
            <input
              type="checkbox"
              checked={user.dailyUnwindEnabled}
              onChange={(event) =>
                updateUserSettings({ dailyUnwindEnabled: event.target.checked })
              }
              className="h-4 w-4 rounded border-[#cbd5b8] text-[#7f9b5d] focus:ring-[#b6c994]"
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
          <div className="border-t border-black/[0.055] pt-4">
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
