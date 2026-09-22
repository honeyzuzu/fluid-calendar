import { ConnectedAccount } from "@prisma/client";
import ICAL from "ical.js";

import { CalDAVCalendarService } from "@/lib/caldav-calendar";
import {
  convertVEventToCalendarEvent,
  preserveCalDAVAlarms,
} from "@/lib/caldav-helpers";
import { CalendarEventInput } from "@/lib/caldav-interfaces";
import {
  googleReminderPayload,
  googleReminderState,
  validateReminderMinutes,
} from "@/lib/event-reminders";

it("validates a small, distinct reminder schedule", () => {
  expect(validateReminderMinutes([60, 5])).toEqual([5, 60]);
  expect(validateReminderMinutes([5, 5])).toBeNull();
  expect(validateReminderMinutes([-5])).toBeNull();
});

it("maps Google popup reminders without losing calendar defaults", () => {
  expect(googleReminderPayload(false, [5, 60])).toEqual({
    useDefault: false,
    overrides: [
      { method: "popup", minutes: 5 },
      { method: "popup", minutes: 60 },
    ],
  });
  expect(googleReminderState({ useDefault: true })).toEqual({
    useDefaultReminders: true,
    reminderMinutes: [],
  });
  expect(
    googleReminderState({
      useDefault: false,
      overrides: [{ method: "popup", minutes: 30 }],
    })
  ).toEqual({ useDefaultReminders: false, reminderMinutes: [30] });
});

it("round-trips CalDAV display alarms through VEVENT", () => {
  const account = {
    id: "account",
    email: "test@example.com",
    accessToken: "test",
  } as ConnectedAccount;
  const service = new CalDAVCalendarService(account);
  const event: CalendarEventInput = {
    id: "event",
    title: "Meeting",
    start: new Date("2026-09-22T12:00:00Z"),
    end: new Date("2026-09-22T13:00:00Z"),
    reminderMinutes: [15, 60],
  };
  const ical = (
    service as unknown as {
      convertToICalendar(input: CalendarEventInput): string;
    }
  ).convertToICalendar(event);
  const vevent = new ICAL.Component(ICAL.parse(ical)).getFirstSubcomponent(
    "vevent"
  );
  expect(vevent).toBeTruthy();
  expect(convertVEventToCalendarEvent(vevent!).reminderMinutes).toEqual([
    15, 60,
  ]);
});

it("keeps existing CalDAV alarms during an unrelated event edit", () => {
  const account = {
    id: "account",
    email: "test@example.com",
    accessToken: "test",
  } as ConnectedAccount;
  const service = new CalDAVCalendarService(account);
  const base: CalendarEventInput = {
    id: "event",
    title: "Meeting",
    start: new Date("2026-09-22T12:00:00Z"),
    end: new Date("2026-09-22T13:00:00Z"),
  };
  const convert = (input: CalendarEventInput) =>
    (
      service as unknown as {
        convertToICalendar(input: CalendarEventInput): string;
      }
    ).convertToICalendar(input);
  const merged = preserveCalDAVAlarms(
    convert({ ...base, title: "Renamed" }),
    convert({ ...base, reminderMinutes: [15] })
  );
  const vevent = new ICAL.Component(ICAL.parse(merged)).getFirstSubcomponent(
    "vevent"
  );
  expect(vevent?.getFirstPropertyValue("summary")).toBe("Renamed");
  expect(convertVEventToCalendarEvent(vevent!).reminderMinutes).toEqual([15]);
});
