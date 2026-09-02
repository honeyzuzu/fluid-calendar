import { getFriendCalendarItems } from "@/lib/friend-calendar";

describe("friend calendar overlays", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("turns shared busy time into a labeled, read-only calendar item", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "event-one",
          title: "Busy",
          start: "2026-09-03T14:00:00.000Z",
          end: "2026-09-03T15:00:00.000Z",
          allDay: false,
          ownerId: "maya-id",
          owner: "Maya",
          color: "#8f78b7",
          source: "calendar",
        },
      ],
    });

    const items = await getFriendCalendarItems(
      new Date("2026-09-03T00:00:00.000Z"),
      new Date("2026-09-04T00:00:00.000Z"),
      { "maya-id": "#EBCBD7" }
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "friend-event-one",
      title: "Maya · Busy",
      startEditable: false,
      durationEditable: false,
      backgroundColor: "#EBCBD7",
      borderColor: "#EBCBD7",
      extendedProps: {
        isFriendEvent: true,
        friendId: "maya-id",
        friendOwner: "Maya",
        friendSource: "calendar",
      },
    });
  });

  it("uses one chosen color instead of the friend's source-calendar colors", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "one",
          title: "Busy",
          start: "2026-09-03T14:00:00.000Z",
          end: "2026-09-03T15:00:00.000Z",
          allDay: false,
          ownerId: "maya-id",
          owner: "Maya",
          color: "#111111",
          source: "calendar",
        },
        {
          id: "two",
          title: "Focus",
          start: "2026-09-03T16:00:00.000Z",
          end: "2026-09-03T17:00:00.000Z",
          allDay: false,
          ownerId: "maya-id",
          owner: "Maya",
          color: "#FFFFFF",
          source: "focus",
        },
      ],
    });

    const items = await getFriendCalendarItems(
      new Date("2026-09-03T00:00:00.000Z"),
      new Date("2026-09-04T00:00:00.000Z"),
      { "maya-id": "#C6DCEB" }
    );
    expect(items.map((item) => item.backgroundColor)).toEqual([
      "#C6DCEB",
      "#C6DCEB",
    ]);
  });

  it("keeps the user's own calendar usable if sharing cannot load", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(
      getFriendCalendarItems(new Date(0), new Date(60_000))
    ).resolves.toEqual([]);
  });
});
