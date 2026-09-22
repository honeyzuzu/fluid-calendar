import { useEffect } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCalendarStore } from "@/store/calendar";
import { useSettingsStore } from "@/store/settings";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function CalendarSettings() {
  const { calendar, updateCalendarSettings, user, updateUserSettings } =
    useSettingsStore();
  const { feeds, loadFromDatabase } = useCalendarStore();
  const enabledFeeds = feeds.filter((feed) => feed.enabled);

  // Load feeds when component mounts
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

  return (
    <SettingsSection
      title="Calendar view"
      description="Choose where new events go and how your calendar displays time."
    >
      <SettingRow
        label="Default calendar"
        description="New events use this calendar unless you choose another."
      >
        <div className="space-y-2">
          <Select
            value={calendar.defaultCalendarId || "none"}
            disabled={enabledFeeds.length === 0}
            onValueChange={(value) =>
              updateCalendarSettings({
                defaultCalendarId: value === "none" ? "" : value,
              })
            }
          >
            <SelectTrigger aria-label="Default calendar">
              <SelectValue placeholder="Select a default calendar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                Choose when creating an event
              </SelectItem>
              {enabledFeeds.map((feed) => (
                <SelectItem key={feed.id} value={feed.id}>
                  {feed.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {enabledFeeds.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No calendar is connected yet.{" "}
              <a
                href="#accounts"
                className="font-semibold text-primary underline underline-offset-2"
              >
                Connect a calendar
              </a>{" "}
              to choose a default.
            </p>
          )}
        </div>
      </SettingRow>

      <SettingRow
        label="Week starts on"
        description="Choose the first column in week and month views."
      >
        <Select
          value={user.weekStartDay}
          onValueChange={(value) =>
            updateUserSettings({
              weekStartDay: value as "monday" | "sunday",
            })
          }
        >
          <SelectTrigger aria-label="Calendar week starts on">
            <SelectValue placeholder="Select start day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sunday">Sunday</SelectItem>
            <SelectItem value="monday">Monday</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Calendar display hours"
        description="Shade your usual hours on Calendar. Task scheduling has its own availability."
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-working-hours"
              checked={calendar.workingHours.enabled}
              onCheckedChange={(checked) =>
                updateCalendarSettings({
                  workingHours: {
                    ...calendar.workingHours,
                    enabled: checked === true,
                  },
                })
              }
            />
            <Label htmlFor="show-working-hours">Show working hours</Label>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="calendar-hours-start">From</Label>
              <Input
                id="calendar-hours-start"
                type="time"
                value={calendar.workingHours.start}
                onChange={(e) =>
                  updateCalendarSettings({
                    workingHours: {
                      ...calendar.workingHours,
                      start: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="calendar-hours-end">To</Label>
              <Input
                id="calendar-hours-end"
                type="time"
                value={calendar.workingHours.end}
                onChange={(e) =>
                  updateCalendarSettings({
                    workingHours: {
                      ...calendar.workingHours,
                      end: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Days to shade</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {workingDays.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={calendar.workingHours.days.includes(day.value)}
                    onCheckedChange={(checked) => {
                      const days = checked
                        ? [...calendar.workingHours.days, day.value]
                        : calendar.workingHours.days.filter(
                            (d) => d !== day.value
                          );
                      updateCalendarSettings({
                        workingHours: {
                          ...calendar.workingHours,
                          days,
                        },
                      });
                    }}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <a
            href="#auto-schedule"
            className="inline-block text-sm font-semibold text-primary underline underline-offset-2"
          >
            Change task scheduling hours
          </a>
        </div>
      </SettingRow>
    </SettingsSection>
  );
}
