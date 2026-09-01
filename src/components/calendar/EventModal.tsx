"use client";

import { useEffect, useRef, useState } from "react";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { CalendarDays, ChevronDown, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { validateCalendarEventDraft } from "@/lib/calendar-event-form";
import { formatToLocalISOString, newDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

import { useCalendarStore } from "@/store/calendar";
import { useSettingsStore } from "@/store/settings";

import { CalendarEvent } from "@/types/calendar";

import { SunnieColorPicker } from "./SunnieColorPicker";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Partial<CalendarEvent>;
  defaultDate?: Date;
  defaultEndDate?: Date;
}

// Google Calendar recurrence rules
const FREQUENCIES = {
  NONE: "NONE",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const;

type Frequency = (typeof FREQUENCIES)[keyof typeof FREQUENCIES];

// RRule weekday codes
const WEEKDAYS = {
  SU: "Sunday",
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
} as const;

// Helper function to parse recurrence rule
function parseRecurrenceRule(rule?: string) {
  if (!rule) return { freq: FREQUENCIES.NONE, interval: 1, byDay: [] };

  // Remove RRULE: prefix and any array wrapper
  rule = rule.replace(/^\[?"?RRULE:/i, "").replace(/"?\]?$/, "");

  const parts = rule.split(";");
  const result = {
    freq: FREQUENCIES.NONE as Frequency,
    interval: 1,
    byDay: [] as string[],
  };

  parts.forEach((part) => {
    const [key, value] = part.split("=");
    switch (key) {
      case "FREQ":
        result.freq = value as Frequency;
        break;
      case "INTERVAL":
        result.interval = parseInt(value, 10);
        break;
      case "BYDAY":
        result.byDay = value.split(",");
        break;
    }
  });

  return result;
}

// Helper function to build recurrence rule
function buildRecurrenceRule(freq: string, interval: number, byDay: string[]) {
  if (freq === FREQUENCIES.NONE) return "";

  const parts = [];

  // Add frequency
  if (Object.values(FREQUENCIES).includes(freq as Frequency)) {
    parts.push(`FREQ=${freq}`);
  }

  // Add interval if greater than 1
  if (interval > 1) {
    parts.push(`INTERVAL=${interval}`);
  }

  // Add BYDAY for weekly recurrence
  if (freq === FREQUENCIES.WEEKLY && byDay.length > 0) {
    // byDay should already be in RRule format (MO, TU, etc.)
    console.log("Building RRule with weekdays:", byDay);
    parts.push(`BYDAY=${byDay.join(",")}`);
  }

  const rule = parts.join(";");
  console.log("Built RRule:", rule);
  return rule;
}

function localDateParts(value: Date) {
  const [date, time = ""] = formatToLocalISOString(value).split("T");
  return { date, time: time.slice(0, 5) };
}

function localDateFromParts(date: string, time: string, allDay: boolean) {
  return newDate(`${date}T${allDay ? "00:00" : time}`);
}

export function EventModal({
  isOpen,
  onClose,
  event,
  defaultDate,
  defaultEndDate,
}: EventModalProps) {
  const { feeds, addEvent, updateEvent, removeEvent } = useCalendarStore();
  const { calendar } = useSettingsStore();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const [editMode, setEditMode] = useState<"single" | "series">();
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");
  const initialStartDate = event?.start
    ? newDate(event.start)
    : defaultDate
      ? newDate(defaultDate)
      : newDate();
  const initialEndDate = event?.end
    ? newDate(event.end)
    : defaultEndDate
      ? newDate(defaultEndDate)
      : newDate(Date.now() + 3600000);
  const [startDay, setStartDay] = useState(
    () => localDateParts(initialStartDate).date
  );
  const [startTime, setStartTime] = useState(
    () => localDateParts(initialStartDate).time
  );
  const [endDay, setEndDay] = useState(
    () => localDateParts(initialEndDate).date
  );
  const [endTime, setEndTime] = useState(
    () => localDateParts(initialEndDate).time
  );
  const [selectedFeedId, setSelectedFeedId] = useState<string>(
    event?.feedId || calendar.defaultCalendarId || ""
  );
  const [isAllDay, setIsAllDay] = useState(event?.allDay || false);
  const [isRecurring, setIsRecurring] = useState(event?.isRecurring || false);
  const [color, setColor] = useState(event?.color || "");
  const [recurrenceFreq, setRecurrenceFreq] = useState("");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceByDay, setRecurrenceByDay] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(
    Boolean(event?.location || event?.description || event?.isRecurring)
  );

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(event?.title || "");
      setDescription(event?.description || "");
      setLocation(event?.location || "");
      const nextStart = event?.start
        ? newDate(event.start)
        : defaultDate
          ? newDate(defaultDate)
          : newDate();
      const nextEnd = event?.end
        ? newDate(event.end)
        : defaultEndDate
          ? newDate(defaultEndDate)
          : newDate(Date.now() + 3600000);
      const nextStartParts = localDateParts(nextStart);
      const nextEndParts = localDateParts(nextEnd);
      setStartDay(nextStartParts.date);
      setStartTime(nextStartParts.time);
      setEndDay(nextEndParts.date);
      setEndTime(nextEndParts.time);
      setSelectedFeedId(event?.feedId || calendar.defaultCalendarId || "");
      setIsAllDay(event?.allDay || false);
      setIsRecurring(event?.isRecurring || false);
      setColor(event?.color || "");
      const { freq, interval, byDay } = parseRecurrenceRule(
        event?.recurrenceRule
      );
      setRecurrenceFreq(freq || "");
      setRecurrenceInterval(interval);
      setRecurrenceByDay(byDay);
      setEditMode(undefined);
      setShowRecurrenceDialog(false);
      setFormError(null);
      setShowDetails(
        Boolean(event?.location || event?.description || event?.isRecurring)
      );

      // Focus the title input
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [
    isOpen,
    event,
    defaultDate,
    defaultEndDate,
    feeds,
    calendar.defaultCalendarId,
  ]);

  // Show recurrence dialog when editing a recurring event
  useEffect(() => {
    if (isOpen && event?.isRecurring && !editMode && !showRecurrenceDialog) {
      //todo: we need to handle editing series vs single, for now forcing to always edit series
      // setShowRecurrenceDialog(true);
      setEditMode("series");
    }
  }, [isOpen, event?.isRecurring, editMode, showRecurrenceDialog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateCalendarEventDraft({
      title,
      calendarId: selectedFeedId,
      startDay,
      startTime,
      endDay,
      endTime,
      allDay: isAllDay,
    });
    if (validationError) {
      setFormError(validationError);
      if (!title.trim()) titleInputRef.current?.focus();
      return;
    }

    const nextStartDate = localDateFromParts(startDay, startTime, isAllDay);
    const nextEndDate = localDateFromParts(endDay, endTime, isAllDay);
    if (
      Number.isNaN(nextStartDate.getTime()) ||
      Number.isNaN(nextEndDate.getTime())
    ) {
      setFormError("Choose a valid start and end date and time.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      const feed = feeds.find((f) => f.id === selectedFeedId);
      if (!feed) {
        setFormError(
          "That calendar is no longer available. Choose another calendar."
        );
        return;
      }

      const eventData: Omit<CalendarEvent, "id"> = {
        title: title.trim(),
        description,
        location,
        start: nextStartDate,
        end: nextEndDate,
        feedId: selectedFeedId,
        allDay: isAllDay,
        isRecurring,
        recurrenceRule: isRecurring
          ? buildRecurrenceRule(
              recurrenceFreq,
              recurrenceInterval,
              recurrenceByDay
            )
          : undefined,
        isMaster: false,
        color: color || null,
      };

      if (event?.id) {
        // For existing events
        if (feed.type === "GOOGLE" && !event.externalEventId) {
          throw new Error("Cannot edit this Google Calendar event");
        }
        await updateEvent(event.id, eventData, editMode);
      } else {
        // For new events
        await addEvent(eventData);
      }
      // Reset all states before closing
      resetState();
      onClose();
    } catch (error) {
      console.error("Failed to save event:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to save event"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyDuration = (minutes: number) => {
    if (!startDay || !startTime) {
      setFormError("Choose a start date and time first.");
      return;
    }
    const nextStart = localDateFromParts(startDay, startTime, false);
    if (Number.isNaN(nextStart.getTime())) return;
    const nextEnd = newDate(nextStart.getTime() + minutes * 60_000);
    const nextEndParts = localDateParts(nextEnd);
    setEndDay(nextEndParts.date);
    setEndTime(nextEndParts.time);
    setFormError(null);
  };

  const handleDelete = async () => {
    if (!event?.id) return;

    try {
      setIsSubmitting(true);
      await removeEvent(event.id, editMode);
      resetState();
      onClose();
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert(error instanceof Error ? error.message : "Failed to delete event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render recurrence options
  const renderRecurrenceOptions = () => {
    if (!isRecurring) return null;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recurrence-freq">Repeats</Label>
          <Select
            value={recurrenceFreq || FREQUENCIES.WEEKLY}
            onValueChange={(value) =>
              setRecurrenceFreq(value === FREQUENCIES.NONE ? "" : value)
            }
          >
            <SelectTrigger id="recurrence-freq" data-testid="recurrence-freq">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FREQUENCIES.DAILY}>Daily</SelectItem>
              <SelectItem value={FREQUENCIES.WEEKLY}>Weekly</SelectItem>
              <SelectItem value={FREQUENCIES.MONTHLY}>Monthly</SelectItem>
              <SelectItem value={FREQUENCIES.YEARLY}>Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recurrenceFreq && recurrenceFreq !== FREQUENCIES.NONE && (
          <>
            <div className="space-y-2">
              <Label htmlFor="recurrence-interval">Repeat every</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  id="recurrence-interval"
                  min="1"
                  value={recurrenceInterval}
                  onChange={(e) =>
                    setRecurrenceInterval(
                      Math.max(1, parseInt(e.target.value, 10))
                    )
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {recurrenceFreq.toLowerCase()}
                  {recurrenceInterval > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {recurrenceFreq === FREQUENCIES.WEEKLY && (
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(WEEKDAYS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2">
                      <Checkbox
                        checked={recurrenceByDay.includes(key)}
                        onCheckedChange={(checked) => {
                          setRecurrenceByDay(
                            checked
                              ? [...recurrenceByDay, key]
                              : recurrenceByDay.filter((d) => d !== key)
                          );
                        }}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex h-[calc(100dvh-1rem)] max-h-[760px] w-[calc(100vw-1rem)] max-w-[680px] flex-col gap-0 overflow-hidden p-0 sm:h-auto">
          {isSubmitting && <LoadingOverlay />}
          <DialogHeader className="flex-none space-y-1.5 border-b border-black/[0.055] bg-[#fffdf5] px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
            <DialogTitle>{event?.id ? "Edit Event" : "New Event"}</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          >
            <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#efb7a5] bg-[#fff1e8] px-4 py-3 text-sm text-[#8b4934]"
                >
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <RequiredLabel htmlFor="title">Title</RequiredLabel>
                <Input
                  type="text"
                  id="title"
                  ref={titleInputRef}
                  data-testid="event-title-input"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setFormError(null);
                  }}
                  className="event-title"
                  required
                />
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="calendar">Calendar</RequiredLabel>
                <Select
                  value={selectedFeedId}
                  onValueChange={(value) => {
                    setSelectedFeedId(value);
                    setFormError(null);
                  }}
                  disabled={!!event?.id}
                >
                  <SelectTrigger
                    id="calendar"
                    data-testid="calendar-select"
                    aria-invalid={Boolean(formError && !selectedFeedId)}
                    className={cn(
                      formError &&
                        !selectedFeedId &&
                        "border-[#d87857] ring-2 ring-[#f7d2c3]"
                    )}
                  >
                    <SelectValue placeholder="Select a calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeds
                      .filter((feed) => feed.enabled)
                      .map((feed) => (
                        <SelectItem key={feed.id} value={feed.id}>
                          {feed.name} {feed.type === "GOOGLE" ? "(Google)" : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateTimeFields
                  label="Start"
                  dateId="start-date"
                  timeId="start-time"
                  date={startDay}
                  time={startTime}
                  allDay={isAllDay}
                  onDateChange={(value) => {
                    setStartDay(value);
                    setFormError(null);
                  }}
                  onTimeChange={(value) => {
                    setStartTime(value);
                    setFormError(null);
                  }}
                  testId="event-start-date"
                />
                <DateTimeFields
                  label="End"
                  dateId="end-date"
                  timeId="end-time"
                  date={endDay}
                  time={endTime}
                  minDate={startDay}
                  allDay={isAllDay}
                  onDateChange={(value) => {
                    setEndDay(value);
                    setFormError(null);
                  }}
                  onTimeChange={(value) => {
                    setEndTime(value);
                    setFormError(null);
                  }}
                  testId="event-end-date"
                />
              </div>

              {!isAllDay && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#f7f5eb] px-3 py-2">
                  <span className="mr-1 text-xs font-medium text-black/45">
                    Quick duration
                  </span>
                  {[30, 60, 90, 120].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => applyDuration(minutes)}
                      className="rounded-lg border border-black/[0.07] bg-white px-2.5 py-1 text-xs font-semibold text-[#65734c] hover:bg-[#eef3df]"
                    >
                      {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-day"
                  checked={isAllDay}
                  onCheckedChange={(checked) => setIsAllDay(checked as boolean)}
                />
                <Label htmlFor="all-day" className="text-sm">
                  All day
                </Label>
              </div>

              <button
                type="button"
                onClick={() => setShowDetails((current) => !current)}
                aria-expanded={showDetails}
                className="flex w-full items-center justify-between rounded-xl border border-black/[0.07] bg-[#f7f5eb] px-3 py-2 text-sm font-semibold text-[#60684a] hover:bg-[#eef3df]"
              >
                Color, location, notes &amp; repeat
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showDetails && "rotate-180"
                  )}
                />
              </button>

              {showDetails && (
                <div className="space-y-4 rounded-2xl border border-black/[0.055] bg-[#fcfbf5] p-4">
                  <div className="space-y-2">
                    <Label>Event color</Label>
                    <SunnieColorPicker
                      value={color}
                      fallbackColor={
                        feeds.find((feed) => feed.id === selectedFeedId)?.color
                      }
                      onChange={(nextColor) => setColor(nextColor || "")}
                      allowDefault
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="event-location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      data-testid="event-description-input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="event-description resize-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recurring"
                      checked={isRecurring}
                      onCheckedChange={(checked) => {
                        const isChecked = checked as boolean;
                        setIsRecurring(isChecked);
                        if (
                          isChecked &&
                          (recurrenceFreq === FREQUENCIES.NONE ||
                            !recurrenceFreq)
                        ) {
                          setRecurrenceFreq(FREQUENCIES.WEEKLY);
                          const recurrenceStart = localDateFromParts(
                            startDay,
                            startTime,
                            isAllDay
                          );
                          const weekdayNum = recurrenceStart.getDay();
                          const weekdays = [
                            "SU",
                            "MO",
                            "TU",
                            "WE",
                            "TH",
                            "FR",
                            "SA",
                          ];
                          const weekday = weekdays[weekdayNum];
                          setRecurrenceByDay([weekday]);
                        }
                      }}
                      data-testid="recurring-event-checkbox"
                    />
                    <Label htmlFor="recurring" className="text-sm">
                      Recurring event
                    </Label>
                  </div>

                  {renderRecurrenceOptions()}
                </div>
              )}
            </div>

            <div className="flex flex-none items-center justify-between gap-3 border-t border-black/[0.06] bg-[#fffdf5] px-4 py-3 sm:px-6 sm:py-4">
              {event?.id ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  data-testid="delete-event-button"
                >
                  Delete
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="save-event-button">
                  {event?.id ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Recurring Event Edit Mode Dialog */}
      <AlertDialog.Root
        open={showRecurrenceDialog}
        onOpenChange={(open) => {
          setShowRecurrenceDialog(open);
          if (!open) onClose();
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[10001] bg-background/80 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[10002] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
            <AlertDialog.Title className="mb-4 text-lg font-semibold">
              Edit Recurring Event
            </AlertDialog.Title>
            <AlertDialog.Description className="mb-6 text-sm text-muted-foreground">
              Would you like to edit this event or the entire series?
            </AlertDialog.Description>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRecurrenceDialog(false);
                  onClose();
                }}
                data-testid="edit-cancel-button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setEditMode("single");
                  setShowRecurrenceDialog(false);
                }}
                data-testid="edit-single-event-button"
              >
                This Event
              </Button>
              <Button
                onClick={() => {
                  setEditMode("series");
                  setShowRecurrenceDialog(false);
                }}
                data-testid="edit-series-button"
              >
                Entire Series
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );

  function resetState() {
    setShowRecurrenceDialog(false);
    setEditMode(undefined);
    setTitle("");
    setDescription("");
    setLocation("");
    const nextStartParts = localDateParts(newDate());
    const nextEndParts = localDateParts(newDate(Date.now() + 3600000));
    setStartDay(nextStartParts.date);
    setStartTime(nextStartParts.time);
    setEndDay(nextEndParts.date);
    setEndTime(nextEndParts.time);
    setIsAllDay(false);
    setIsRecurring(false);
    setColor("");
    setRecurrenceFreq("");
    setRecurrenceInterval(1);
    setRecurrenceByDay([]);
    setFormError(null);
    setShowDetails(false);
  }
}

function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-[#c65f40]">*</span>
    </Label>
  );
}

function DateTimeFields({
  label,
  dateId,
  timeId,
  date,
  time,
  minDate,
  allDay,
  onDateChange,
  onTimeChange,
  testId,
}: {
  label: string;
  dateId: string;
  timeId: string;
  date: string;
  time: string;
  minDate?: string;
  allDay: boolean;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  testId: string;
}) {
  const pickerClassName = cn(
    "h-10 cursor-pointer px-2 text-sm",
    "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
    "[&::-webkit-calendar-picker-indicator]:rounded-md",
    "[&::-webkit-calendar-picker-indicator]:hover:bg-accent",
    "[&::-webkit-calendar-picker-indicator]:dark:invert"
  );

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">
        {label} <span className="text-[#c65f40]">*</span>
      </legend>
      <div
        className={cn(
          "grid min-w-0 gap-2",
          !allDay && "grid-cols-[minmax(0,1fr)_minmax(0,112px)]"
        )}
      >
        <label className="relative">
          <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
          <Input
            type="date"
            id={dateId}
            data-testid={testId}
            aria-label={`${label} date`}
            value={date}
            min={minDate}
            onChange={(event) => onDateChange(event.target.value)}
            onClick={(event) => event.currentTarget.showPicker?.()}
            className={cn(pickerClassName, "min-w-0 pl-8")}
            required
          />
        </label>
        {!allDay && (
          <label className="relative">
            <Clock3 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
            <Input
              type="time"
              id={timeId}
              aria-label={`${label} time`}
              value={time}
              onChange={(event) => onTimeChange(event.target.value)}
              onClick={(event) => event.currentTarget.showPicker?.()}
              className={cn(pickerClassName, "min-w-0 pl-8")}
              required
            />
          </label>
        )}
      </div>
      <p className="text-[11px] text-black/35">
        {allDay ? "Choose a date" : "Date and time"}
      </p>
    </fieldset>
  );
}
