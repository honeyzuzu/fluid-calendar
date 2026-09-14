export type CalendarSticker = {
  id: string;
  stickerId: string;
  packId: string;
  view: "month";
  anchorDate: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type NewCalendarSticker = Pick<
  CalendarSticker,
  "stickerId" | "packId" | "view" | "anchorDate" | "x" | "y"
> &
  Partial<Pick<CalendarSticker, "scale" | "rotation" | "zIndex">>;

export type CalendarStickerUpdate = Partial<
  Pick<
    CalendarSticker,
    "anchorDate" | "x" | "y" | "scale" | "rotation" | "zIndex"
  >
>;
