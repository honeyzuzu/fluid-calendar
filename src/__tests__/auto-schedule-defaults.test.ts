import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..");
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

describe("auto-schedule opt-out defaults", () => {
  it("defaults new database tasks to auto-scheduling", () => {
    const schema = read("prisma/schema.prisma");

    expect(schema).toMatch(/isAutoScheduled\s+Boolean\s+@default\(true\)/);
  });

  it("migrates existing unfinished tasks and changes the database default", () => {
    const migration = read(
      "prisma/migrations/20260901003000_default_tasks_to_auto_schedule/migration.sql"
    );

    expect(migration).toContain(
      'ALTER COLUMN "isAutoScheduled" SET DEFAULT true'
    );
    expect(migration).toContain('SET "isAutoScheduled" = true');
    expect(migration).toContain('"status" <> \'completed\'');
  });
});
