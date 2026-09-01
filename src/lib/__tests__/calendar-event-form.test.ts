import { validateCalendarEventDraft } from "@/lib/calendar-event-form";

const validDraft = {
  title: "Lunch with Maya",
  calendarId: "calendar-1",
  startDay: "2026-09-03",
  startTime: "12:00",
  endDay: "2026-09-03",
  endTime: "13:00",
  allDay: false,
};

describe("calendar event form validation", () => {
  it("explains that a calendar must be selected", () => {
    expect(validateCalendarEventDraft({ ...validDraft, calendarId: "" })).toBe(
      "Choose a calendar before creating this event."
    );
  });

  it("requires all visible date and time fields", () => {
    expect(validateCalendarEventDraft({ ...validDraft, startTime: "" })).toBe(
      "Choose a start and end date and time."
    );
  });

  it("rejects an end time before the start", () => {
    expect(
      validateCalendarEventDraft({ ...validDraft, endTime: "11:30" })
    ).toBe("The event must end after it starts.");
  });

  it("accepts a complete event", () => {
    expect(validateCalendarEventDraft(validDraft)).toBeNull();
  });
});
