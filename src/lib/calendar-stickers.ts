import { isValidStickerAsset } from "@/lib/sticker-manifest";

import type {
  CalendarStickerUpdate,
  NewCalendarSticker,
} from "@/types/calendar-sticker";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 400;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isCalendarDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_KEY.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function parseStickerDateRange(
  start: string | null,
  end: string | null
) {
  if (!isCalendarDateKey(start) || !isCalendarDateKey(end)) return null;
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  const duration = endDate.getTime() - startDate.getTime();
  if (duration <= 0 || duration > MAX_RANGE_DAYS * DAY_MS) return null;
  return { start, end };
}

const finiteNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function parseNewCalendarSticker(
  value: unknown
): NewCalendarSticker | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const x = finiteNumber(body.x);
  const y = finiteNumber(body.y);
  const scale = body.scale === undefined ? 1 : finiteNumber(body.scale);
  const rotation =
    body.rotation === undefined ? 0 : finiteNumber(body.rotation);
  const zIndex = body.zIndex === undefined ? 1 : finiteNumber(body.zIndex);

  if (
    !isValidStickerAsset(body.packId, body.stickerId) ||
    body.view !== "month" ||
    !isCalendarDateKey(body.anchorDate) ||
    x === null ||
    y === null ||
    x < 0 ||
    x > 1 ||
    y < 0 ||
    y > 1 ||
    scale === null ||
    scale < 0.4 ||
    scale > 2.5 ||
    rotation === null ||
    zIndex === null ||
    !Number.isInteger(zIndex)
  ) {
    return null;
  }

  return {
    stickerId: body.stickerId as string,
    packId: body.packId as string,
    view: "month",
    anchorDate: body.anchorDate,
    x,
    y,
    scale,
    rotation,
    zIndex,
  };
}

export function parseCalendarStickerUpdate(
  value: unknown
): CalendarStickerUpdate | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const allowed = ["anchorDate", "x", "y", "scale", "rotation", "zIndex"];
  const present = allowed.filter((key) => body[key] !== undefined);
  if (!present.length) return null;

  const result: CalendarStickerUpdate = {};
  if (body.anchorDate !== undefined) {
    if (!isCalendarDateKey(body.anchorDate)) return null;
    result.anchorDate = body.anchorDate;
  }
  for (const key of ["x", "y"] as const) {
    if (body[key] === undefined) continue;
    const parsed = finiteNumber(body[key]);
    if (parsed === null || parsed < 0 || parsed > 1) return null;
    result[key] = parsed;
  }
  if (body.scale !== undefined) {
    const scale = finiteNumber(body.scale);
    if (scale === null || scale < 0.4 || scale > 2.5) return null;
    result.scale = scale;
  }
  if (body.rotation !== undefined) {
    const rotation = finiteNumber(body.rotation);
    if (rotation === null) return null;
    result.rotation = rotation;
  }
  if (body.zIndex !== undefined) {
    const zIndex = finiteNumber(body.zIndex);
    if (zIndex === null || !Number.isInteger(zIndex)) return null;
    result.zIndex = zIndex;
  }
  return result;
}
