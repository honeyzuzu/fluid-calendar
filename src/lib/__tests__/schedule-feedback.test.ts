import {
  collectScheduleChanges,
  formatScheduleSummary,
  restoreScheduleChanges,
} from "@/lib/schedule-feedback";

describe("schedule feedback", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("captures only tasks whose placement changed", () => {
    const changes = collectScheduleChanges(
      [
        { id: "same", scheduledStart: null, scheduledEnd: null },
        { id: "placed", scheduledStart: null, scheduledEnd: null },
      ],
      [
        { id: "same", scheduledStart: null, scheduledEnd: null },
        {
          id: "placed",
          scheduledStart: "2026-09-15T13:00:00.000Z",
          scheduledEnd: "2026-09-15T13:30:00.000Z",
        },
      ]
    );

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      id: "placed",
      before: { scheduledStart: null, scheduledEnd: null },
      after: {
        scheduledStart: "2026-09-15T13:00:00.000Z",
        scheduledEnd: "2026-09-15T13:30:00.000Z",
      },
    });
  });

  it("describes the first block in the account time zone", () => {
    const [change] = collectScheduleChanges(
      [{ id: "placed", scheduledStart: null, scheduledEnd: null }],
      [
        {
          id: "placed",
          scheduledStart: "2026-09-15T13:00:00.000Z",
          scheduledEnd: "2026-09-15T13:30:00.000Z",
        },
      ]
    );

    const summary = formatScheduleSummary(
      [change],
      "America/New_York",
      "12h",
      "Today"
    );
    expect(summary).toContain("9:00 AM");
    expect(summary).toContain("America/New_York");
    expect(summary).toContain("conflicts");
  });

  it("restores a block only while it still matches the scheduling result", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "placed",
          scheduledStart: "2026-09-15T13:00:00.000Z",
          scheduledEnd: "2026-09-15T13:30:00.000Z",
        }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    const restored = await restoreScheduleChanges([
      {
        id: "placed",
        before: {
          scheduledStart: null,
          scheduledEnd: null,
          scheduleLocked: false,
        },
        after: {
          scheduledStart: "2026-09-15T13:00:00.000Z",
          scheduledEnd: "2026-09-15T13:30:00.000Z",
        },
      },
    ]);

    expect(restored).toBe(1);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/tasks/placed",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("preserves a newer manual move instead of overwriting it", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "placed",
        scheduledStart: "2026-09-15T14:00:00.000Z",
        scheduledEnd: "2026-09-15T14:30:00.000Z",
      }),
    } as Response);

    const restored = await restoreScheduleChanges([
      {
        id: "placed",
        before: {
          scheduledStart: null,
          scheduledEnd: null,
          scheduleLocked: false,
        },
        after: {
          scheduledStart: "2026-09-15T13:00:00.000Z",
          scheduledEnd: "2026-09-15T13:30:00.000Z",
        },
      },
    ]);

    expect(restored).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
