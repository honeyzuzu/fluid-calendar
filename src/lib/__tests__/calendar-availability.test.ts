import { blocksCalendarTime } from "@/lib/calendar-availability";

it("keeps free and cancelled events visible without reserving time", () => {
  expect(blocksCalendarTime({ isFree: true, status: "confirmed" })).toBe(
    false
  );
  expect(blocksCalendarTime({ isFree: false, status: "CANCELLED" })).toBe(
    false
  );
  expect(blocksCalendarTime({ isFree: false, status: "CANCELED" })).toBe(false);
  expect(blocksCalendarTime({ isFree: false, status: "confirmed" })).toBe(true);
});
