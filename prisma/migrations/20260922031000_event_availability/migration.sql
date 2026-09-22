ALTER TABLE "CalendarEvent" ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT false;
UPDATE "CalendarEvent" SET "isFree" = true
WHERE "title" = 'Untitled Event' AND LOWER(COALESCE("status", '')) = 'free';
