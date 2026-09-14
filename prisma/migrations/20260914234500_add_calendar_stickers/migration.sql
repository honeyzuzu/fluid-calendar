CREATE TABLE "CalendarSticker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stickerId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "view" TEXT NOT NULL DEFAULT 'month',
    "anchorDate" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zIndex" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSticker_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CalendarSticker_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CalendarSticker_month_view_check" CHECK ("view" = 'month'),
    CONSTRAINT "CalendarSticker_x_check" CHECK ("x" >= 0 AND "x" <= 1),
    CONSTRAINT "CalendarSticker_y_check" CHECK ("y" >= 0 AND "y" <= 1),
    CONSTRAINT "CalendarSticker_scale_check" CHECK ("scale" >= 0.4 AND "scale" <= 2.5)
);

CREATE INDEX "CalendarSticker_userId_anchorDate_idx"
ON "CalendarSticker"("userId", "anchorDate");
