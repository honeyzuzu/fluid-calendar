-- New tasks should participate in auto-scheduling unless a user opts them out.
ALTER TABLE "Task"
ALTER COLUMN "isAutoScheduled" SET DEFAULT true;

-- Apply the new opt-out behavior to tasks that can still be worked on.
-- Completed tasks remain untouched because the scheduler never considers them.
UPDATE "Task"
SET "isAutoScheduled" = true
WHERE "isAutoScheduled" = false
  AND "status" <> 'completed';
