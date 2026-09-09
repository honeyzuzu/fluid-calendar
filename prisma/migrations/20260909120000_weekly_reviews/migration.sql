ALTER TABLE "Task" ADD COLUMN "rolloverCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "rolledFromWeek" DATE;
CREATE INDEX "Task_userId_status_completedAt_idx" ON "Task"("userId", "status", "completedAt");

CREATE TABLE "WeeklyReview" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weekStart" DATE NOT NULL,
  "goodThings" TEXT NOT NULL DEFAULT '',
  "makeEasier" TEXT NOT NULL DEFAULT '',
  "nextPriorities" TEXT NOT NULL DEFAULT '',
  "calendarIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "excludedEventIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WeeklyReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WeeklyReview_userId_weekStart_key" ON "WeeklyReview"("userId", "weekStart");
