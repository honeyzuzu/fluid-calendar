import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..");
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

describe("friend calendar visibility", () => {
  it.each(["DayView", "WeekView", "MonthView", "MultiMonthView"])(
    "loads sharing blocks in %s",
    (view) => {
      const source = read(`src/components/calendar/${view}.tsx`);
      expect(source).toContain("getFriendCalendarItems");
      expect(source).toContain("hiddenFriendIds");
      expect(source).toContain("friendRefreshRevision");
    }
  );

  it("persists per-friend calendar toggles", () => {
    const store = read("src/store/calendar.ts");
    const manager = read("src/components/calendar/FeedManager.tsx");
    expect(store).toContain("toggleFriendCalendar");
    expect(store).toContain("hiddenFriendIds: state.hiddenFriendIds");
    expect(manager).toContain("toggleFriendCalendar(connection.friend.id)");
  });

  it("persists one pastel display color per friend", () => {
    const store = read("src/store/calendar.ts");
    const manager = read("src/components/calendar/FeedManager.tsx");
    const styles = read("src/app/globals.css");
    expect(store).toContain("setFriendCalendarColor");
    expect(store).toContain("friendCalendarColors: state.friendCalendarColors");
    expect(manager).toContain("FRIEND_CALENDAR_COLORS");
    expect(styles).toContain(".calendar-friend-event");
    expect(styles).toContain("pointer-events: none");
    expect(styles).toContain("--friend-lane-offset");
    expect(styles).toContain("opacity: 0.52");
  });

  it("does not mix friends' availability into the Plan timeline", () => {
    const plan = read("src/app/(common)/plan/page.tsx");
    expect(plan).not.toContain("/api/friends/events");
    expect(plan).not.toContain("friendBlocks");
  });

  it("refreshes own and friend calendars automatically with visible status", () => {
    const calendar = read("src/components/calendar/Calendar.tsx");
    expect(calendar).toContain("syncAllFeeds");
    expect(calendar).toContain("requestFriendCalendarRefresh");
    expect(calendar).toContain("5 * 60_000");
    expect(calendar).toContain("Last refreshed");
    expect(calendar).toContain('document.visibilityState === "hidden"');
  });

  it("shows privacy-friendly presence dots for friends", () => {
    const route = read("src/app/api/friends/route.ts");
    const page = read("src/app/(common)/friends/page.tsx");
    const manager = read("src/components/calendar/FeedManager.tsx");
    expect(route).toContain("isPresenceOnline");
    expect(page).toContain("connection.friend.online");
    expect(page).toContain('"Online now"');
    expect(manager).toContain("connection.friend.online");
    expect(manager).toContain('"Offline"');
  });
});
