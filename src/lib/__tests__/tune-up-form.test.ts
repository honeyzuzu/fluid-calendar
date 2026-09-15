import { getMissingTuneUpFields, tuneUpIsReady } from "@/lib/tune-up-form";

describe("task tune-up readiness", () => {
  it("enables Save & next for the audited valid field combination", () => {
    expect(
      tuneUpIsReady({
        duration: "30",
        priority: "medium",
        energyLevel: "low",
        dueDate: "2026-09-18",
      })
    ).toBe(true);
  });

  it("identifies each missing displayed requirement", () => {
    expect(
      getMissingTuneUpFields({
        duration: "",
        priority: "",
        energyLevel: "",
        dueDate: "",
      })
    ).toEqual(["time estimate", "priority", "energy needed", "due date"]);
  });
});
