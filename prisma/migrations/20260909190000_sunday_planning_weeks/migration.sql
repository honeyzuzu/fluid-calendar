-- Weekly planning was introduced with Monday date keys. Sunnie presents weeks
-- as Sunday through Saturday, so preserve existing assignments and reviews by
-- moving each stored week key back one day.
UPDATE "Task"
SET "plannedWeekStart" = "plannedWeekStart" - INTERVAL '1 day'
WHERE "plannedWeekStart" IS NOT NULL
  AND EXTRACT(DOW FROM "plannedWeekStart") = 1;

UPDATE "Task"
SET "rolledFromWeek" = "rolledFromWeek" - INTERVAL '1 day'
WHERE "rolledFromWeek" IS NOT NULL
  AND EXTRACT(DOW FROM "rolledFromWeek") = 1;

UPDATE "WeeklyReview"
SET "weekStart" = "weekStart" - INTERVAL '1 day'
WHERE EXTRACT(DOW FROM "weekStart") = 1;

-- Event exclusions never affected a summary or any other review behavior.
-- Calendar events are now read-only reflection cues instead of attendance data.
ALTER TABLE "WeeklyReview" DROP COLUMN "excludedEventIds";
