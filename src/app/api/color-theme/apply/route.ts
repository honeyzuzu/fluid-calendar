import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  ColorThemeId,
  isColorThemeId,
  mapThemeLinkedColor,
} from "@/lib/color-themes";
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
    const counts = await prisma.$transaction(async (transaction) => {
      const [feeds, events, projects, calendarSettings] = await Promise.all([
        transaction.calendarFeed.findMany({
          where: { userId, color: { not: null } },
          select: { id: true, color: true },
        }),
        transaction.calendarEvent.findMany({
          where: { feed: { userId }, color: { not: null } },
          select: { id: true, color: true },
        }),
        transaction.project.findMany({
          where: { userId, color: { not: null } },
          select: { id: true, color: true },
        }),
        transaction.calendarSettings.findUnique({
          where: { userId },
          select: { id: true, defaultColor: true },
        }),
      ]);

      const feedUpdates = feeds.flatMap((feed) => {
        const color = mapThemeLinkedColor("events", feed.color, colorTheme);
        return color && color !== feed.color
          ? [
              transaction.calendarFeed.update({
                where: { id: feed.id },
                data: { color },
              }),
            ]
          : [];
      });
      const eventUpdates = events.flatMap((event) => {
        const color = mapThemeLinkedColor("events", event.color, colorTheme);
        return color && color !== event.color
          ? [
              transaction.calendarEvent.update({
                where: { id: event.id },
                data: { color },
              }),
            ]
          : [];
      });
      const projectUpdates = projects.flatMap((project) => {
        const color = mapThemeLinkedColor(
          "projects",
          project.color,
          colorTheme
        );
        return color && color !== project.color
          ? [
              transaction.project.update({
                where: { id: project.id },
                data: { color },
              }),
            ]
          : [];
      });
      const defaultCalendarColor = calendarSettings
        ? mapThemeLinkedColor(
            "events",
            calendarSettings.defaultColor,
            colorTheme
          )
        : undefined;

      await Promise.all([
        ...feedUpdates,
        ...eventUpdates,
        ...projectUpdates,
        ...(calendarSettings &&
        defaultCalendarColor &&
        defaultCalendarColor !== calendarSettings.defaultColor
          ? [
              transaction.calendarSettings.update({
                where: { id: calendarSettings.id },
                data: { defaultColor: defaultCalendarColor },
              }),
            ]
          : []),
        transaction.userSettings.upsert({
          where: { userId },
          update: { colorTheme },
          create: {
            userId,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            colorTheme,
          },
        }),
      ]);

      return {
        feeds: feedUpdates.length,
        events: eventUpdates.length,
        projects: projectUpdates.length,
        calendarDefaults:
          calendarSettings &&
          defaultCalendarColor &&
          defaultCalendarColor !== calendarSettings.defaultColor
            ? 1
            : 0,
      };
    });

    return NextResponse.json({ colorTheme, updated: counts });
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
