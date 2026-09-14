CREATE TABLE "DailyMoodEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "phase" TEXT NOT NULL,
    "mood" INTEGER NOT NULL,
    "energy" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMoodEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DailyMoodEntry_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyMoodEntry_phase_check" CHECK ("phase" IN ('rise', 'unwind')),
    CONSTRAINT "DailyMoodEntry_mood_check" CHECK ("mood" BETWEEN 1 AND 5),
    CONSTRAINT "DailyMoodEntry_energy_check" CHECK ("energy" IS NULL OR "energy" BETWEEN 1 AND 3)
);

CREATE UNIQUE INDEX "DailyMoodEntry_userId_date_phase_key"
ON "DailyMoodEntry"("userId", "date", "phase");

CREATE INDEX "DailyMoodEntry_userId_date_idx"
ON "DailyMoodEntry"("userId", "date");
