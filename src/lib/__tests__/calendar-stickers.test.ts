import {
  isCalendarDateKey,
  parseCalendarStickerUpdate,
  parseNewCalendarSticker,
  parseStickerDateRange,
} from "@/lib/calendar-stickers";
import {
  SUNNIE_BASICS_STICKER_PACK,
  THEME_STICKER_PACKS,
  findStickerAsset,
} from "@/lib/sticker-manifest";

describe("calendar sticker validation", () => {
  it("accepts manifest assets and rejects arbitrary asset paths", () => {
    expect(findStickerAsset("sunnie-basics", "sunny-star")?.src).toBe(
      "/themes/basics/stickers/sunny-star.svg"
    );
    expect(findStickerAsset("unknown", "../../secret")).toBeUndefined();
    expect(SUNNIE_BASICS_STICKER_PACK.assets).toHaveLength(4);
    expect(Object.values(THEME_STICKER_PACKS)).toHaveLength(5);
  });

  it("requires real calendar keys and a bounded exclusive range", () => {
    expect(isCalendarDateKey("2026-02-29")).toBe(false);
    expect(isCalendarDateKey("2028-02-29")).toBe(true);
    expect(parseStickerDateRange("2026-09-01", "2026-10-01")).toEqual({
      start: "2026-09-01",
      end: "2026-10-01",
    });
    expect(parseStickerDateRange("2026-10-01", "2026-09-01")).toBeNull();
    expect(parseStickerDateRange("2026-01-01", "2028-01-01")).toBeNull();
  });

  it("validates placement and transform boundaries", () => {
    expect(
      parseNewCalendarSticker({
        packId: "base",
        stickerId: "garden-daisy",
        view: "month",
        anchorDate: "2026-09-14",
        x: 0.5,
        y: 0.25,
        scale: 1.2,
        rotation: -12,
        zIndex: 4,
      })
    ).toEqual(
      expect.objectContaining({
        packId: "base",
        stickerId: "garden-daisy",
        anchorDate: "2026-09-14",
      })
    );
    expect(
      parseNewCalendarSticker({
        packId: "base",
        stickerId: "garden-daisy",
        view: "week",
        anchorDate: "2026-09-14",
        x: 0.5,
        y: 0.5,
      })
    ).toBeNull();
    expect(parseCalendarStickerUpdate({ x: 1.1 })).toBeNull();
    expect(parseCalendarStickerUpdate({ scale: 0.3 })).toBeNull();
    expect(parseCalendarStickerUpdate({ rotation: 18, x: 0.2 })).toEqual({
      rotation: 18,
      x: 0.2,
    });
  });
});
