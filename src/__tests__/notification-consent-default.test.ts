import fs from "node:fs";
import path from "node:path";

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("daily planning email consent", () => {
  it("defaults new notification settings to off in Prisma and the API", () => {
    expect(read("prisma/schema.prisma")).toMatch(
      /dailyEmailEnabled\s+Boolean\s+@default\(false\)/
    );
    expect(read("src/app/api/notification-settings/route.ts")).toContain(
      "dailyEmailEnabled: false"
    );
  });

  it("changes only the database default and preserves existing choices", () => {
    const migration = read(
      "prisma/migrations/20260915003000_daily_email_opt_in/migration.sql"
    );

    expect(migration).toContain(
      'ALTER COLUMN "dailyEmailEnabled" SET DEFAULT false'
    );
    expect(migration).not.toMatch(/UPDATE\s+"NotificationSettings"/i);
  });
});
