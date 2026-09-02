import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..");

describe("task schedule score presentation", () => {
  it("keeps the internal placement score out of user-facing task UI", () => {
    const surfaces = [
      "src/components/tasks/BoardView/BoardTask.tsx",
      "src/components/tasks/components/TaskRow.tsx",
      "src/components/tasks/TaskModal.tsx",
      "src/components/calendar/EventQuickView.tsx",
    ];

    for (const surface of surfaces) {
      const source = readFileSync(join(repoRoot, surface), "utf8");
      expect(source).not.toContain("scheduleScore");
      expect(source).not.toContain("Confidence:");
    }
  });
});
