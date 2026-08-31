CREATE TABLE "DailyPlan" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "intention" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyPlan_userId_date_key" ON "DailyPlan"("userId", "date");
CREATE INDEX "DailyPlan_date_idx" ON "DailyPlan"("date");
CREATE INDEX "DailyPlan_userId_idx" ON "DailyPlan"("userId");

ALTER TABLE "DailyPlan"
ADD CONSTRAINT "DailyPlan_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
