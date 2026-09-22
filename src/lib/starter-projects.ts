import { prisma } from "@/lib/prisma";

const STARTER_PROJECTS = [
  { name: "General", colorSlot: "project-1" },
  { name: "Work", colorSlot: "project-2" },
  { name: "School", colorSlot: "project-3" },
  { name: "Hobbies", colorSlot: "project-4" },
] as const;

/** Seed once per account. The marker also lets users delete starter projects. */
export async function ensureStarterProjects(userId: string) {
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.user.updateMany({
      where: { id: userId, starterProjectsInitializedAt: null },
      data: { starterProjectsInitializedAt: new Date() },
    });
    if (!claimed.count) return;

    let generalId: string | undefined;
    for (const { name, colorSlot } of STARTER_PROJECTS) {
      const existing = await tx.project.findFirst({
        where: {
          userId,
          name: { equals: name, mode: "insensitive" },
          status: "active",
        },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      const id =
        existing?.id ??
        (
          await tx.project.create({
            data: { userId, name, colorSlot, status: "active" },
            select: { id: true },
          })
        ).id;
      if (name === "General") generalId = id;
    }
    if (generalId) {
      await tx.task.updateMany({
        where: { userId, projectId: null },
        data: { projectId: generalId },
      });
    }
  });
}

export async function defaultProjectId(userId: string) {
  await ensureStarterProjects(userId);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${userId}))`;
    const project = await tx.project.findFirst({
      where: { userId, status: "active" },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    });
    const general = await tx.project.findFirst({
      where: {
        userId,
        status: "active",
        name: { equals: "General", mode: "insensitive" },
      },
      select: { id: true },
    });
    if (general) return general.id;
    if (project) return project.id;
    return (
      await tx.project.create({
        data: {
          userId,
          name: "General",
          colorSlot: "project-1",
          status: "active",
        },
        select: { id: true },
      })
    ).id;
  });
}
