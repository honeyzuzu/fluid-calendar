import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "UserSettingsAPI";

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    // Get the user settings or create default ones if they don't exist
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    logger.error(
      "Failed to fetch user settings",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    const body = (await request.json()) as Record<string, unknown>;
    const allowed = [
      "onboardingVersion",
      "theme",
      "defaultView",
      "timeZone",
      "weekStartDay",
      "timeFormat",
      "sleepHoursStart",
      "sleepHoursEnd",
      "sleepHoursConfigured",
      "dailyRiseEnabled",
      "dailyRiseTime",
      "dailyUnwindEnabled",
      "dailyUnwindTime",
      "dailyRitualDays",
    ] as const;
    const updates = Object.fromEntries(
      allowed
        .filter((key) => body[key] !== undefined)
        .map((key) => [key, body[key]])
    );
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (
      (updates.dailyRiseTime !== undefined &&
        (typeof updates.dailyRiseTime !== "string" ||
          !timePattern.test(updates.dailyRiseTime))) ||
      (updates.dailyUnwindTime !== undefined &&
        (typeof updates.dailyUnwindTime !== "string" ||
          !timePattern.test(updates.dailyUnwindTime))) ||
      (updates.dailyRitualDays !== undefined &&
        updates.dailyRitualDays !== "working" &&
        updates.dailyRitualDays !== "everyday")
    ) {
      return NextResponse.json(
        { error: "Choose valid Daily Rhythm settings" },
        { status: 400 }
      );
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...updates,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    logger.error(
      "Failed to update user settings",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
