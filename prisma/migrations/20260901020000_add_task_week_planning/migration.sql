-- Add an explicit weekly planning bucket without changing due dates or schedules.
ALTER TABLE "Task" ADD COLUMN "plannedWeekStart" DATE;

CREATE INDEX "Task_plannedWeekStart_userId_idx"
ON "Task"("plannedWeekStart", "userId");
