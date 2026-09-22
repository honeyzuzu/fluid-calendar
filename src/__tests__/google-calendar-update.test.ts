import { calendar_v3 } from "googleapis";

import { updateGoogleEvent } from "@/lib/google-calendar";

it("updates a series duration without moving its original first date", async () => {
  const get = jest.fn().mockImplementation(({ eventId }) =>
    Promise.resolve({
      data:
        eventId === "instance"
          ? {
              id: "instance",
              recurringEventId: "master",
              start: { dateTime: "2026-09-17T14:00:00.000Z" },
            }
          : {
              id: "master",
              start: { dateTime: "2026-09-14T14:00:00.000Z" },
            },
    })
  );
  const patch = jest.fn().mockResolvedValue({ data: { id: "master" } });
  const calendar = {
    events: { get, patch },
  } as unknown as calendar_v3.Calendar;

  await updateGoogleEvent(
    "account",
    "user",
    "calendar",
    "instance",
    {
      mode: "series",
      start: new Date("2026-09-17T14:00:00.000Z"),
      end: new Date("2026-09-17T16:00:00.000Z"),
      recurrenceRule: "FREQ=DAILY",
      timeZone: "UTC",
    },
    async () => calendar
  );

  expect(get).toHaveBeenCalledWith({
    calendarId: "calendar",
    eventId: "master",
  });
  expect(patch).toHaveBeenCalledWith({
    calendarId: "calendar",
    eventId: "master",
    requestBody: expect.objectContaining({
      start: expect.objectContaining({ dateTime: "2026-09-14T14:00:00.000Z" }),
      end: expect.objectContaining({ dateTime: "2026-09-14T16:00:00.000Z" }),
    }),
  });
});

it("sends changed reminders to Google and leaves them out of unrelated edits", async () => {
  const get = jest.fn().mockResolvedValue({ data: { id: "meeting" } });
  const patch = jest.fn().mockResolvedValue({ data: { id: "meeting" } });
  const calendar = { events: { get, patch } } as unknown as calendar_v3.Calendar;

  await updateGoogleEvent(
    "account",
    "user",
    "calendar",
    "meeting",
    { title: "Meeting", reminderMinutes: [30, 60], useDefaultReminders: false },
    async () => calendar
  );
  expect(patch.mock.calls[0][0].requestBody.reminders).toEqual({
    useDefault: false,
    overrides: [
      { method: "popup", minutes: 30 },
      { method: "popup", minutes: 60 },
    ],
  });

  await updateGoogleEvent(
    "account",
    "user",
    "calendar",
    "meeting",
    { title: "Renamed" },
    async () => calendar
  );
  expect(patch.mock.calls[1][0].requestBody.reminders).toBeUndefined();
});
