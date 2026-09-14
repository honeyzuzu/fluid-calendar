import {
  getTaskDisplayColor,
  isValidTaskColor,
  isValidTaskColorSlot,
} from "@/lib/task-colors";

describe("task colors", () => {
  it("resolves a linked slot through the active theme", () => {
    expect(
      getTaskDisplayColor(
        { id: "task-a", color: "#F7BEB5", colorSlot: "task-3" },
        "winter-candlelight-snow"
      )
    ).not.toBe("#F7BEB5");
  });

  it("preserves a fixed custom color", () => {
    expect(
      getTaskDisplayColor({ id: "task-a", color: "#123456" }, "base")
    ).toBe("#123456");
  });

  it("validates persisted values", () => {
    expect(isValidTaskColor("#abcdef")).toBe(true);
    expect(isValidTaskColor("red")).toBe(false);
    expect(isValidTaskColorSlot("task-6")).toBe(true);
    expect(isValidTaskColorSlot("event-1")).toBe(false);
  });
});
