import {
  addSunDropsToPreferences,
  completionEarnsSunDrop,
} from "@/lib/focus-rewards";

describe("focus rewards", () => {
  it("adds a sun drop without losing companion preferences", () => {
    const reward = addSunDropsToPreferences(
      JSON.stringify({ petId: "miso-cat", sunDrops: 4 })
    );

    expect(reward.sunDrops).toBe(5);
    expect(JSON.parse(reward.serialized)).toEqual({
      petId: "miso-cat",
      sunDrops: 5,
    });
  });

  it("recovers from damaged local preferences", () => {
    expect(addSunDropsToPreferences("not-json").sunDrops).toBe(1);
  });

  it("rewards only a real transition into completed", () => {
    expect(completionEarnsSunDrop("todo", "completed")).toBe(true);
    expect(completionEarnsSunDrop("in_progress", "completed")).toBe(true);
    expect(completionEarnsSunDrop("completed", "completed")).toBe(false);
    expect(completionEarnsSunDrop("completed", "todo")).toBe(false);
    expect(completionEarnsSunDrop(undefined, "completed")).toBe(false);
  });
});
