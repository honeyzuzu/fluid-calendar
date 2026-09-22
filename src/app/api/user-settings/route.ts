import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { isColorThemeId } from "@/lib/color-themes";
import { isMotionPreference } from "@/lib/display-preferences";
import { logger } from "@/lib/logger";
import { isCalendarStyleId } from "@/lib/planner-themes";
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
    let settings;
    try {
      settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
    } catch (error) {
      // Two first-load requests can race to create the same settings row.
      if (
        !error ||
        typeof error !== "object" ||
        !("code" in error) ||
        error.code !== "P2002"
      ) {
        throw error;
      }
      settings = await prisma.userSettings.findUnique({ where: { userId } });
      if (!settings) throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return NextResponse.json({
      ...settings,
      colorTheme: user?.role === "admin" ? settings.colorTheme : "base",
    });
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
      "colorTheme",
      "calendarStyle",
      "motionPreference",
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
    if (
      updates.colorTheme !== undefined &&
      !isColorThemeId(updates.colorTheme)
    ) {
      return NextResponse.json(
        { error: "Choose a valid planner colorway" },
        { status: 400 }
      );
    }
    if (updates.colorTheme !== undefined && updates.colorTheme !== "base") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can change planner colorways" },
          { status: 403 }
        );
      }
    }
    if (
      updates.calendarStyle !== undefined &&
      !isCalendarStyleId(updates.calendarStyle)
    ) {
      return NextResponse.json(
        { error: "Choose a valid calendar style" },
        { status: 400 }
      );
    }
    if (
      updates.motionPreference !== undefined &&
      !isMotionPreference(updates.motionPreference)
    ) {
      return NextResponse.json(
        { error: "Choose a valid motion preference" },
        { status: 400 }
      );
    }
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
