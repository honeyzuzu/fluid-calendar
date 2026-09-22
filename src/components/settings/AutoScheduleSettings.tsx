import { useEffect, useState } from "react";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import {
  formatTime,
  parseSelectedCalendars,
  parseWorkDays,
  stringifySelectedCalendars,
  stringifyWorkDays,
} from "@/lib/autoSchedule";
import { resolveThemeLinkedColor } from "@/lib/color-themes";
import {
  SCHEDULING_PRESETS,
  matchesSchedulingPreset,
} from "@/lib/scheduling-presets";

import { useCalendarStore } from "@/store/calendar";
import { useSettingsStore } from "@/store/settings";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function AutoScheduleSettings() {
  const { autoSchedule, updateAutoScheduleSettings, user } = useSettingsStore();
  const { feeds, loadFromDatabase } = useCalendarStore();
  const googleFeeds = feeds.filter((feed) => feed.type === "GOOGLE");
  const { colorTheme } = useTheme();

  // Load calendar feeds when component mounts
  useEffect(() => {
    loadFromDatabase();
  }, [loadFromDatabase]);

  const workingDays = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const timeOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: formatTime(i, user.timeFormat),
  }));
  const workStartOptions = timeOptions.filter(
    (time) => time.value < autoSchedule.workHourEnd
  );
  const workEndOptions = timeOptions.filter(
    (time) => time.value > autoSchedule.workHourStart
  );

  const selectedCalendars = parseSelectedCalendars(
    autoSchedule.selectedCalendars
  );
  const workDays = parseWorkDays(autoSchedule.workDays);
  const hasEnergyWindows = [
    autoSchedule.highEnergyStart,
    autoSchedule.highEnergyEnd,
    autoSchedule.mediumEnergyStart,
    autoSchedule.mediumEnergyEnd,
    autoSchedule.lowEnergyStart,
    autoSchedule.lowEnergyEnd,
  ].some((value) => value != null);
  const [energyDetailsOpen, setEnergyDetailsOpen] = useState(hasEnergyWindows);

  return (
    <SettingsSection
      title="Scheduling availability"
      description="Choose when Sunnie may place tasks. Calendar events and sleep hours still protect time inside this availability."
    >
      <SettingRow
        label="Availability starting point"
        description="Pick the rhythm closest to yours, then adjust any day or time below. This changes scheduling availability only—not the rest of Sunnie."
      >
        <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
          {SCHEDULING_PRESETS.map((preset) => {
            const selected = matchesSchedulingPreset(autoSchedule, preset);
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  updateAutoScheduleSettings({
                    workDays: stringifyWorkDays(preset.days),
                    workHourStart: preset.startHour,
                    workHourEnd: preset.endHour,
                  })
                }
                className={`rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected
                    ? "border-primary bg-primary/10 text-foreground shadow-sm"
                    : "border-border bg-card text-secondary-foreground hover:border-primary/45 hover:bg-accent/50"
                }`}
              >
                <span className="block text-sm font-semibold">
                  {preset.label}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {preset.days.length === 7 ? "Every day" : "Monday–Friday"}
                  {" · "}
                  {formatTime(preset.startHour, user.timeFormat)}–
                  {formatTime(preset.endHour, user.timeFormat)}
                </span>
              </button>
            );
          })}
        </div>
      </SettingRow>

      <SettingRow
        label="Calendars to check"
        description="Selected calendars protect busy time when Sunnie places tasks."
      >
        <div className="space-y-2">
          {feeds.map((feed) => (
            <div key={feed.id} className="flex items-center space-x-2">
              <Switch
                aria-label={`Check ${feed.name} for scheduling conflicts`}
                checked={selectedCalendars.includes(feed.id)}
                onCheckedChange={(checked) => {
                  const calendars = checked
                    ? [...selectedCalendars, feed.id]
                    : selectedCalendars.filter((id) => id !== feed.id);
                  updateAutoScheduleSettings({
                    selectedCalendars: stringifySelectedCalendars(calendars),
                  });
                }}
              />
              <Label className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: resolveThemeLinkedColor(
                      "events",
                      feed.colorSlot,
                      feed.color,
                      colorTheme.id
                    ),
                  }}
                />
                {feed.name}
              </Label>
            </div>
          ))}
          {feeds.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No calendars connected yet. Sunnie can still use your scheduling
              hours.{" "}
              <a
                href="#accounts"
                className="font-semibold text-primary underline underline-offset-2"
              >
                Connect a calendar
              </a>{" "}
              to protect busy time.
            </div>
          )}
        </div>
      </SettingRow>

      <SettingRow
        label="Scheduling hours"
        description="Auto-scheduled tasks stay completely inside these hours on enabled days"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Select
                value={autoSchedule.workHourStart.toString()}
                onValueChange={(value) =>
                  updateAutoScheduleSettings({
                    workHourStart: parseInt(value),
                  })
                }
              >
                <SelectTrigger aria-label="Scheduling start time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workStartOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value.toString()}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>End Time</Label>
              <Select
                value={autoSchedule.workHourEnd.toString()}
                onValueChange={(value) =>
                  updateAutoScheduleSettings({
                    workHourEnd: parseInt(value),
                  })
                }
              >
                <SelectTrigger aria-label="Scheduling end time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workEndOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value.toString()}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Days Sunnie can schedule tasks</Label>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
              {workingDays.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Switch
                    aria-label={`Schedule tasks on ${day.label}`}
                    checked={workDays.includes(day.value)}
                    onCheckedChange={(checked) => {
                      const days = checked
                        ? [...workDays, day.value]
                        : workDays.filter((d) => d !== day.value);
                      updateAutoScheduleSettings({
                        workDays: stringifyWorkDays(days),
                      });
                    }}
                  />
                  <Label className="text-sm">{day.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingRow>

      <details
        className="rounded-2xl border border-border bg-muted/30 p-4"
        open={energyDetailsOpen}
        onToggle={(event) => setEnergyDetailsOpen(event.currentTarget.open)}
      >
        <summary className="cursor-pointer text-sm font-semibold">
          Energy time preferences{" "}
          <span className="font-normal text-muted-foreground">· Optional</span>
        </summary>
        <div className="mt-5">
          <SettingRow
            label="Energy Level Time Preferences"
            description="Map your energy levels to specific time ranges"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>High Energy Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={autoSchedule.highEnergyStart?.toString() || "none"}
                    onValueChange={(value) =>
                      updateAutoScheduleSettings({
                        highEnergyStart:
                          value === "none" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger aria-label="High energy starts">
                      <SelectValue placeholder="Not Set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not Set</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem
                          key={time.value}
                          value={time.value.toString()}
                        >
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={autoSchedule.highEnergyEnd?.toString() || "none"}
                    onValueChange={(value) =>
                      updateAutoScheduleSettings({
                        highEnergyEnd:
                          value === "none" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger aria-label="High energy ends">
                      <SelectValue placeholder="Not Set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not Set</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem
                          key={time.value}
                          value={time.value.toString()}
                        >
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medium Energy Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={autoSchedule.mediumEnergyStart?.toString() || "none"}
                    onValueChange={(value) =>
                      updateAutoScheduleSettings({
                        mediumEnergyStart:
                          value === "none" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger aria-label="Medium energy starts">
                      <SelectValue placeholder="Not Set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not Set</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem
                          key={time.value}
                          value={time.value.toString()}
                        >
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={autoSchedule.mediumEnergyEnd?.toString() || "none"}
                    onValueChange={(value) =>
                      updateAutoScheduleSettings({
                        mediumEnergyEnd:
                          value === "none" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger aria-label="Medium energy ends">
                      <SelectValue placeholder="Not Set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not Set</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem
                          key={time.value}
                          value={time.value.toString()}
                        >
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Low Energy Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={autoSchedule.lowEnergyStart?.toString() || "none"}
                    onValueChange={(value) =>
                      updateAutoScheduleSettings({
                        lowEnergyStart:
                          value === "none" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger aria-label="Low energy starts">
                      <SelectValue placeholder="Not Set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not Set</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem
                          key={time.value}
                          value={time.value.toString()}
                        >
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={autoSchedule.lowEnergyEnd?.toString() || "none"}
                    onValueChange={(value) =>
                      updateAutoScheduleSettings({
                        lowEnergyEnd: value === "none" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger aria-label="Low energy ends">
                      <SelectValue placeholder="Not Set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not Set</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem
                          key={time.value}
                          value={time.value.toString()}
                        >
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </SettingRow>
        </div>
      </details>

      <SettingRow
        label="Buffer Time"
        description="Minutes to leave between scheduled tasks"
      >
        <div className="space-y-4">
          <Slider
            aria-label="Minutes between scheduled tasks"
            value={[autoSchedule.bufferMinutes]}
            onValueChange={([value]) =>
              updateAutoScheduleSettings({ bufferMinutes: value })
            }
            min={0}
            max={60}
            step={5}
          />
          <div className="text-sm text-muted-foreground">
            Current buffer: {autoSchedule.bufferMinutes} minutes
          </div>
        </div>
      </SettingRow>

      <SettingRow
        label="Project Grouping"
        description="Try to schedule tasks from the same project together"
      >
        <Switch
          aria-label="Group scheduled tasks by project"
          checked={autoSchedule.groupByProject}
          onCheckedChange={(checked) =>
            updateAutoScheduleSettings({ groupByProject: checked })
          }
        />
      </SettingRow>

      <SettingRow
        label="Add task blocks to Google Calendar"
        description="Optionally create events for scheduled tasks in a connected Google calendar."
      >
        <div className="space-y-4">
          <Switch
            aria-label="Add scheduled task blocks to Google Calendar"
            checked={autoSchedule.pushTasksToCalendar || false}
            disabled={
              !autoSchedule.pushTasksToCalendar && googleFeeds.length === 0
            }
            onCheckedChange={(checked) =>
              updateAutoScheduleSettings({
                pushTasksToCalendar: checked,
                // Preserve feed selection when toggling; user can re-enable without reconfiguring
              })
            }
          />

          {autoSchedule.pushTasksToCalendar && (
            <div>
              <Label>Target Calendar</Label>
              <Select
                value={autoSchedule.pushTasksFeedId || ""}
                onValueChange={(value) =>
                  updateAutoScheduleSettings({
                    pushTasksFeedId: value || null,
                  })
                }
              >
                <SelectTrigger aria-label="Target Google calendar for task blocks">
                  <SelectValue placeholder="Select a calendar" />
                </SelectTrigger>
                <SelectContent>
                  {googleFeeds.map((feed) => (
                    <SelectItem key={feed.id} value={feed.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: resolveThemeLinkedColor(
                              "events",
                              feed.colorSlot,
                              feed.color,
                              colorTheme.id
                            ),
                          }}
                        />
                        {feed.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {googleFeeds.length === 0 && (
                <div className="text-sm text-muted-foreground mt-2">
                  No Google calendar is connected. Choose one in{" "}
                  <a
                    href="#accounts"
                    className="font-semibold text-primary underline underline-offset-2"
                  >
                    Calendar accounts
                  </a>
                  .
                </div>
              )}
            </div>
          )}
          {googleFeeds.length === 0 && !autoSchedule.pushTasksToCalendar && (
            <p className="text-sm text-muted-foreground">
              <a
                href="#accounts"
                className="font-semibold text-primary underline underline-offset-2"
              >
                Connect Google Calendar
              </a>{" "}
              to turn this on.
            </p>
          )}
        </div>
      </SettingRow>
    </SettingsSection>
  );
}
