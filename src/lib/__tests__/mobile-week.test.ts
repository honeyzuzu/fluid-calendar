import {
  getMobileWeekDays,
  groupFriendBusyTime,
  itemsForMobileWeekDay,
} from "@/lib/mobile-week";

describe("mobile week dates", () => {
  it("starts on the saved first weekday in the account time zone", () => {
    const date = new Date("2026-09-20T02:00:00.000Z"); // Saturday in New York
    const days = getMobileWeekDays(date, "America/New_York", "monday");
    expect(days.map((day) => day.key)).toEqual([
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      "2026-09-20",
    ]);
  });

  it("uses local midnight boundaries across daylight-saving changes", () => {
    const days = getMobileWeekDays(
      new Date("2026-11-01T16:00:00.000Z"),
      "America/New_York",
      "sunday"
    );
    expect(days[0].key).toBe("2026-11-01");
    expect(days[0].end.getTime() - days[0].start.getTime()).toBe(
      25 * 60 * 60_000
    );
  });

  it("shows an overnight event on both days and puts all-day items first", () => {
    const days = getMobileWeekDays(
      new Date("2026-09-17T16:00:00.000Z"),
      "America/New_York",
      "sunday"
    );
    const overnight = {
      title: "Overnight",
      start: new Date("2026-09-18T03:00:00.000Z"),
      end: new Date("2026-09-18T15:00:00.000Z"),
      allDay: false,
    };
    const allDay = {
      title: "All day",
      start: new Date("2026-09-18T00:00:00.000Z"),
      end: new Date("2026-09-19T00:00:00.000Z"),
      allDay: true,
    };
    expect(
      itemsForMobileWeekDay([overnight, allDay], days[5]).map(
        (item) => item.title
      )
    ).toEqual(["All day", "Overnight"]);
    expect(itemsForMobileWeekDay([overnight], days[6])).toEqual([]);
  });

  it("combines overlapping busy blocks per friend within the local day", () => {
    const day = getMobileWeekDays(
      new Date("2026-09-17T16:00:00.000Z"),
      "America/New_York",
      "sunday"
    )[4];
    const block = (id: string, owner: string, start: string, end: string) => ({
      start: new Date(start),
      end: new Date(end),
      allDay: false,
      backgroundColor: "#aabbcc",
      extendedProps: { friendId: id, friendOwner: owner },
    });
    const groups = groupFriendBusyTime(
      [
        block("maya", "Maya", "2026-09-17T02:00:00Z", "2026-09-17T15:00:00Z"),
        block("maya", "Maya", "2026-09-17T14:30:00Z", "2026-09-17T17:00:00Z"),
        block("maya", "Maya", "2026-09-17T20:00:00Z", "2026-09-18T05:00:00Z"),
        block("lee", "Lee", "2026-09-17T16:00:00Z", "2026-09-17T17:00:00Z"),
      ],
      day
    );

    expect(groups.map((group) => group.name)).toEqual(["Lee", "Maya"]);
    expect(groups[1].windows).toEqual([
      {
        start: day.start,
        end: new Date("2026-09-17T17:00:00Z"),
        allDay: false,
      },
      {
        start: new Date("2026-09-17T20:00:00Z"),
        end: day.end,
        allDay: false,
      },
    ]);
    expect(groups[0].windows).toHaveLength(1);
  });
});
