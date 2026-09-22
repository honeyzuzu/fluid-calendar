ALTER TABLE "User" ADD COLUMN "starterProjectsInitializedAt" TIMESTAMP(3);

INSERT INTO "Project" ("id", "name", "colorSlot", "status", "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, starter.name, starter.color_slot, 'active', users."id", NOW(), NOW()
FROM "User" AS users
CROSS JOIN (VALUES
  ('General', 'project-1'),
  ('Work', 'project-2'),
  ('School', 'project-3'),
  ('Hobbies', 'project-4')
) AS starter(name, color_slot)
WHERE NOT EXISTS (
  SELECT 1 FROM "Project" AS existing
  WHERE existing."userId" = users."id"
    AND LOWER(existing."name") = LOWER(starter.name)
    AND existing."status" = 'active'
);

UPDATE "Task" AS task
SET "projectId" = (
  SELECT project."id" FROM "Project" AS project
  WHERE project."userId" = task."userId"
    AND LOWER(project."name") = 'general'
    AND project."status" = 'active'
  ORDER BY project."createdAt", project."id"
  LIMIT 1
)
WHERE task."projectId" IS NULL AND task."userId" IS NOT NULL;

UPDATE "User" SET "starterProjectsInitializedAt" = NOW();
