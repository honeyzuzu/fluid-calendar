UPDATE "CalendarEvent" AS event
SET "useDefaultReminders" = true
FROM "CalendarFeed" AS feed
WHERE event."feedId" = feed."id" AND feed."type" = 'GOOGLE';
