-- Earlier recurring Google event updates could insert the full provider series
-- after deleting only the dragged occurrence. Keep the newest local copy of
-- each provider event and repair any instance links before removing duplicates.
WITH ranked_events AS (
  SELECT
    event."id",
    FIRST_VALUE(event."id") OVER (
      PARTITION BY event."feedId", event."externalEventId"
      ORDER BY event."isMaster" DESC, event."updatedAt" DESC, event."createdAt" DESC, event."id" DESC
    ) AS "keeperId"
  FROM "CalendarEvent" AS event
  JOIN "CalendarFeed" AS feed ON feed."id" = event."feedId"
  WHERE event."externalEventId" IS NOT NULL
    AND feed."type" = 'GOOGLE'
), duplicate_events AS (
  SELECT "id", "keeperId"
  FROM ranked_events
  WHERE "id" <> "keeperId"
)
UPDATE "CalendarEvent" AS keeper
SET
  "titleOverride" = COALESCE(keeper."titleOverride", duplicate."titleOverride"),
  "color" = COALESCE(keeper."color", duplicate."color"),
  "colorSlot" = COALESCE(keeper."colorSlot", duplicate."colorSlot")
FROM duplicate_events
JOIN "CalendarEvent" AS duplicate ON duplicate."id" = duplicate_events."id"
WHERE keeper."id" = duplicate_events."keeperId";

WITH ranked_events AS (
  SELECT
    event."id",
    FIRST_VALUE(event."id") OVER (
      PARTITION BY event."feedId", event."externalEventId"
      ORDER BY event."isMaster" DESC, event."updatedAt" DESC, event."createdAt" DESC, event."id" DESC
    ) AS "keeperId"
  FROM "CalendarEvent" AS event
  JOIN "CalendarFeed" AS feed ON feed."id" = event."feedId"
  WHERE event."externalEventId" IS NOT NULL
    AND feed."type" = 'GOOGLE'
), duplicate_events AS (
  SELECT "id", "keeperId"
  FROM ranked_events
  WHERE "id" <> "keeperId"
)
UPDATE "CalendarEvent" AS child
SET "masterEventId" = duplicate_events."keeperId"
FROM duplicate_events
WHERE child."masterEventId" = duplicate_events."id";

WITH ranked_events AS (
  SELECT
    event."id",
    ROW_NUMBER() OVER (
      PARTITION BY event."feedId", event."externalEventId"
      ORDER BY event."isMaster" DESC, event."updatedAt" DESC, event."createdAt" DESC, event."id" DESC
    ) AS "duplicateRank"
  FROM "CalendarEvent" AS event
  JOIN "CalendarFeed" AS feed ON feed."id" = event."feedId"
  WHERE event."externalEventId" IS NOT NULL
    AND feed."type" = 'GOOGLE'
)
DELETE FROM "CalendarEvent" AS event
USING ranked_events
WHERE event."id" = ranked_events."id"
  AND ranked_events."duplicateRank" > 1;
