import { readFileSync } from "fs";
import { join } from "path";

const taskCardSource = readFileSync(
  join(__dirname, "..", "components", "tasks", "BoardView", "BoardTask.tsx"),
  "utf8"
);

describe("responsive task card metadata", () => {
  it("shows priority separately from energy", () => {
    expect(taskCardSource).toContain(
      "Priority: {formatEnumValue(task.priority)}"
    );
    expect(taskCardSource).toContain(
      "Energy: {formatEnumValue(task.energyLevel)}"
    );
  });

  it("does not present the no-priority sentinel as a real priority", () => {
    expect(taskCardSource).toContain("task.priority !== Priority.NONE");
  });
});
