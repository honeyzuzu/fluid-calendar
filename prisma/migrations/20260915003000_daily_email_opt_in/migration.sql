-- New notification records must explicitly opt in to recurring daily email.
-- Existing account preferences are intentionally preserved.
ALTER TABLE "NotificationSettings"
ALTER COLUMN "dailyEmailEnabled" SET DEFAULT false;

ALTER TABLE "NotificationSettings"
ADD COLUMN "dailyEmailOptedInAt" TIMESTAMP(3),
ADD COLUMN "dailyEmailConsentSource" TEXT;
