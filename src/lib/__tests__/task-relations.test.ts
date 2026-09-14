import { prisma } from "@/lib/prisma";
import {
  pickMutableTaskFields,
  validateTaskRelations,
} from "@/lib/task-relations";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findFirst: jest.fn() },
    tag: { count: jest.fn() },
  },
}));

describe("task API relation boundaries", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects a project that is not owned by the authenticated user", async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(
      validateTaskRelations("user-1", { projectId: "foreign-project" })
    ).resolves.toBe("Project not found");
    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: "foreign-project", userId: "user-1" },
      select: { id: true },
    });
  });

  it("rejects any tag outside the authenticated user's collection", async () => {
    (prisma.tag.count as jest.Mock).mockResolvedValue(1);
    await expect(
      validateTaskRelations("user-1", { tagIds: ["tag-1", "tag-2"] })
    ).resolves.toBe("Tag not found");
  });

  it("drops protected and nested Prisma fields", () => {
    expect(
      pickMutableTaskFields({
        title: "Safe title",
        user: { connect: { id: "victim" } },
        changes: { create: {} },
        completedAt: "2001-01-01",
      })
    ).toEqual({ title: "Safe title" });
  });
});
