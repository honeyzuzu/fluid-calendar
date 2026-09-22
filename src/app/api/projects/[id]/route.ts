import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "project-route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: {
        id,
        // Ensure the project belongs to the current user
        userId,
      },
      include: {
        tasks: true,
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    logger.error(
      "Error fetching project:",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      LOG_SOURCE
    );
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    const { id } = await params;
    const json = await request.json();

    const project = await prisma.project.update({
      where: {
        id,
        // Ensure the project belongs to the current user
        userId,
      },
      data: {
        name: json.name,
        description: json.description,
        color: json.color,
        colorSlot: json.colorSlot,
        status: json.status,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    logger.error(
      "Error updating project:",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      LOG_SOURCE
    );
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    const { id } = await params;

    // Check if project exists and get task count
    const project = await prisma.project.findUnique({
      where: {
        id,
        // Ensure the project belongs to the current user
        userId,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Keep tasks when their organizational project is removed.
    const destination = await prisma.$transaction(async (tx) => {
      let replacement = await tx.project.findFirst({
        where: {
          userId,
          id: { not: id },
          status: "active",
          name: { equals: "General", mode: "insensitive" },
        },
        select: { id: true, name: true },
      });
      replacement ??= await tx.project.findFirst({
        where: { userId, id: { not: id }, status: "active" },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true },
      });
      if (!replacement && project._count.tasks > 0) {
        replacement = await tx.project.create({
          data: { userId, name: "Unsorted", status: "active" },
          select: { id: true, name: true },
        });
      }
      if (replacement) {
        await tx.task.updateMany({
          where: { projectId: id, userId },
          data: { projectId: replacement.id },
        });
      }

      // Delete the project (this will cascade delete TaskListMappings due to onDelete: CASCADE)
      await tx.project.delete({
        where: {
          id,
          // Ensure the project belongs to the current user
          userId,
        },
      });
      return replacement;
    });

    return NextResponse.json({
      success: true,
      movedTasks: project._count.tasks,
      destination: destination?.name ?? null,
    });
  } catch (error) {
    logger.error(
      "Error deleting project:",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      LOG_SOURCE
    );
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
