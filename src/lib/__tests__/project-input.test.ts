import { projectCreateSchema } from "@/lib/project-input";

describe("project creation input", () => {
  it("normalizes the project form payload", () => {
    expect(
      projectCreateSchema.parse({
        name: "  Garden plans  ",
        description: "   ",
        color: "#F4D27D",
        colorSlot: "project-1",
      })
    ).toEqual({
      name: "Garden plans",
      description: undefined,
      color: "#F4D27D",
      colorSlot: "project-1",
      status: "active",
    });
  });

  it("rejects an empty project name", () => {
    const result = projectCreateSchema.safeParse({ name: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Project name is required");
    }
  });

  it("accepts the minimal payload used by task sync", () => {
    expect(projectCreateSchema.parse({ name: "Inbox" })).toEqual({
      name: "Inbox",
      status: "active",
    });
  });
});
