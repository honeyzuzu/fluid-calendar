import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "LogSourcesAPI";

export async function GET(request: NextRequest) {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  try {
    // Get all unique sources
    const sources = await prisma.log.findMany({
      distinct: ["source"],
      select: { source: true },
      where: {
        source: {
          not: null,
        },
      },
    });

    logger.debug(
      "Successfully fetched log sources",
      {
        sourceCount: String(sources.length),
      },
      LOG_SOURCE
    );

    return NextResponse.json({
      sources: sources
        .map((s) => s.source)
        .filter(Boolean)
        .sort(),
    });
  } catch (error) {
    logger.error(
      "Failed to fetch log sources",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to fetch log sources" },
      { status: 500 }
    );
  }
}
