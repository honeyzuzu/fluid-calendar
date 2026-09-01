import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { MAX_BRAIN_DUMP_TITLE_LENGTH, parseBrainDump } from "@/lib/brain-dump";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

import { TaskStatus } from "@/types/task";

const LOG_SOURCE = "brain-dump-route";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as { text?: unknown };
    if (typeof body.text !== "string") {
      return NextResponse.json(
        { error: "Add at least one thought first." },
        { status: 400 }
      );
    }

    const titles = parseBrainDump(body.text);
    if (!titles.length) {
      return NextResponse.json(
        { error: "Add at least one thought first." },
        { status: 400 }
      );
    }
    if (titles.some((title) => title.length > MAX_BRAIN_DUMP_TITLE_LENGTH)) {
      return NextResponse.json(
        { error: "Keep each task under 300 characters." },
        { status: 400 }
      );
    }

    const tasks = await prisma.$transaction(
      titles.map((title) =>
        prisma.task.create({
          data: {
            title,
            status: TaskStatus.TODO,
            userId: auth.userId,
            isAutoScheduled: true,
          },
          include: { tags: true, project: true },
        })
      )
    );

    return NextResponse.json({ tasks, count: tasks.length }, { status: 201 });
  } catch (error) {
    logger.error(
      "Unable to create brain dump tasks",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Sunnie could not save this brain dump. Please try again." },
      { status: 500 }
    );
  }
}
