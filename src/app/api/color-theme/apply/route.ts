import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { ColorThemeId, isColorThemeId } from "@/lib/color-themes";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "ColorThemeApplyAPI";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as { colorTheme?: unknown };
    if (!isColorThemeId(body.colorTheme)) {
      return NextResponse.json(
        { error: "Choose a valid planner colorway" },
        { status: 400 }
      );
    }

    const userId = auth.userId;
    const colorTheme: ColorThemeId = body.colorTheme;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (colorTheme !== "base" && user?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can change planner colorways" },
        { status: 403 }
      );
    }
    await prisma.userSettings.upsert({
      where: { userId },
      update: { colorTheme },
      create: {
        userId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        colorTheme,
      },
    });

    return NextResponse.json({ colorTheme });
  } catch (error) {
    logger.error(
      "Failed to apply planner colorway",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to apply planner colorway" },
      { status: 500 }
    );
  }
}
