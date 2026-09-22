import { readFileSync } from "fs";
import path from "path";

const migrationPath = path.join(
  process.cwd(),
  "prisma/migrations/20260922220000_dedupe_calendar_events/migration.sql"
);

it("removes only duplicate Google provider rows and repairs master links", () => {
  const sql = readFileSync(migrationPath, "utf8");

  expect(sql).toContain(`feed."type" = 'GOOGLE'`);
  expect(sql).toContain(`PARTITION BY event."feedId", event."externalEventId"`);
  expect(sql).toContain(`SET "masterEventId" = duplicate_events."keeperId"`);
  expect(sql).toContain(`ranked_events."duplicateRank" > 1`);
});
