-- Store only the latest activity timestamp for privacy-friendly presence.
ALTER TABLE "User" ADD COLUMN "lastActiveAt" TIMESTAMP(3);

CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");
