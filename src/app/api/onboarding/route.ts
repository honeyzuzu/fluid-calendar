import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { CURRENT_ONBOARDING_VERSION } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "OnboardingAPI";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;

    const userId = auth.userId;
    const [settings, connectedAccountCount, calendars] = await Promise.all([
      prisma.userSettings.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        select: { onboardingVersion: true },
      }),
      prisma.connectedAccount.count({ where: { userId } }),
      prisma.calendarFeed.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          color: true,
          enabled: true,
          type: true,
          account: { select: { email: true, provider: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return NextResponse.json({
      onboardingVersion: settings.onboardingVersion,
      currentVersion: CURRENT_ONBOARDING_VERSION,
      connectedAccountCount,
      calendars,
    });
  } catch (error) {
    logger.error(
      "Failed to load onboarding",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to load onboarding" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as { completed?: boolean };
    if (body.completed !== true) {
      return NextResponse.json(
        { error: "A completed onboarding state is required" },
        { status: 400 }
      );
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: auth.userId },
      update: { onboardingVersion: CURRENT_ONBOARDING_VERSION },
      create: {
        userId: auth.userId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        onboardingVersion: CURRENT_ONBOARDING_VERSION,
      },
      select: { onboardingVersion: true },
    });

    return NextResponse.json(settings);
  } catch (error) {
    logger.error(
      "Failed to complete onboarding",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
