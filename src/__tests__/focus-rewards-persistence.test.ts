import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..");
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

describe("account-backed focus rewards", () => {
  it("stores sun drops in user settings through a checked-in migration", () => {
    expect(read("prisma/schema.prisma")).toMatch(
      /sunDrops\s+Int\s+@default\(0\)/
    );
    expect(
      read("prisma/migrations/20260902003000_persist_sun_drops/migration.sql")
    ).toContain('ADD COLUMN "sunDrops" INTEGER NOT NULL DEFAULT 0');
  });

  it("uses an authenticated atomic increment endpoint", () => {
    const route = read("src/app/api/focus-rewards/route.ts");
    expect(route).toContain("authenticateRequest");
    expect(route).toContain("sunDrops: { increment: amount }");
  });
});
