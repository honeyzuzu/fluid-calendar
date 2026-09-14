import { readFileSync } from "fs";
import { join } from "path";

const template = readFileSync(
  join(__dirname, "..", "..", "docs", "new-theme-template.md"),
  "utf8"
);

describe("new theme worksheet", () => {
  it("asks for exactly 44 required color values", () => {
    expect(template.match(/#______/g)).toHaveLength(44);
  });

  it("covers both independent calendar styles and visual assets", () => {
    expect(template).toContain("| Calendar role");
    expect(template).toMatch(/\| Classic\s+\| Bujo \|/);
    expect(template).toContain("Sticker-pack idea");
    expect(template).toContain("Activation motion");
  });
});
