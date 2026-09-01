import { getTaskDropUpdate } from "@/lib/task-dnd";

import { TaskStatus } from "@/types/task";

describe("task drag and drop targets", () => {
  it("moves a task into a project", () => {
    expect(
      getTaskDropUpdate("project-123", {
        type: "project",
        project: { id: "project-123" },
      })
    ).toEqual({ projectId: "project-123" });
  });

  it("removes a task from its project", () => {
    expect(
      getTaskDropUpdate("remove-project", {
        type: "project",
        project: null,
      })
    ).toEqual({ projectId: null });
  });

  it("moves a board task to another status", () => {
    expect(
      getTaskDropUpdate(TaskStatus.IN_PROGRESS, {
        type: "status",
        status: TaskStatus.IN_PROGRESS,
      })
    ).toEqual({ status: TaskStatus.IN_PROGRESS });
  });

  it("ignores unrelated drop targets", () => {
    expect(getTaskDropUpdate("navigation", { type: "navigation" })).toBeNull();
  });
});
