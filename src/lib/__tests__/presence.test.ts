import {
  MAX_ACTIVITY_WINDOW_MS,
  ONLINE_WINDOW_MS,
  isPresenceOnline,
  resolvePresenceActivityStart,
} from "@/lib/presence";

describe("presence windows", () => {
  const now = new Date("2026-09-01T16:00:00.000Z");

  it("defaults activity to the previous 24 hours", () => {
    expect(resolvePresenceActivityStart(null, now).toISOString()).toBe(
      "2026-08-31T16:00:00.000Z"
    );
  });

  it("accepts a browser-local start of day within the privacy window", () => {
    const start = "2026-09-01T04:00:00.000Z";
    expect(resolvePresenceActivityStart(start, now).toISOString()).toBe(start);
  });

  it("clamps requests that would expose older activity", () => {
    const result = resolvePresenceActivityStart(
      "2026-08-20T00:00:00.000Z",
      now
    );
    expect(result.getTime()).toBe(now.getTime() - MAX_ACTIVITY_WINDOW_MS);
  });

  it("rejects future or invalid activity windows", () => {
    expect(resolvePresenceActivityStart("not-a-date", now).toISOString()).toBe(
      "2026-08-31T16:00:00.000Z"
    );
    expect(
      resolvePresenceActivityStart(
        "2026-09-02T00:00:00.000Z",
        now
      ).toISOString()
    ).toBe("2026-08-31T16:00:00.000Z");
  });

  it("counts activity inside five minutes as online", () => {
    expect(
      isPresenceOnline(new Date(now.getTime() - ONLINE_WINDOW_MS), now)
    ).toBe(true);
    expect(
      isPresenceOnline(new Date(now.getTime() - ONLINE_WINDOW_MS - 1), now)
    ).toBe(false);
    expect(isPresenceOnline(new Date(now.getTime() + 1), now)).toBe(false);
    expect(isPresenceOnline(null, now)).toBe(false);
  });
});
