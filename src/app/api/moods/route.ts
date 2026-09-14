import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { isMoodDateKey, parseMoodInput, parseMoodMonth } from "@/lib/moods";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "moods-route";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const dateKey = request.nextUrl.searchParams.get("date");
  const monthKey = request.nextUrl.searchParams.get("month");
  const date = isMoodDateKey(dateKey)
    ? new Date(`${dateKey}T00:00:00.000Z`)
    : null;
  const month = parseMoodMonth(monthKey);
  if (!date && !month) {
    return NextResponse.json(
      { error: "Choose a valid day or month" },
      { status: 400 }
    );
  }

  const entries = await prisma.dailyMoodEntry.findMany({
    where: {
      userId: auth.userId,
      date: date ?? { gte: month!.start, lt: month!.end },
    },
    orderBy: [{ date: "asc" }, { phase: "asc" }],
  });
  return NextResponse.json(entries);
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const input = parseMoodInput(await request.json());
  if (!input) {
    return NextResponse.json(
      { error: "Choose a valid mood check-in" },
      { status: 400 }
    );
  }
  const date = new Date(`${input.date}T00:00:00.000Z`);
  const identity = {
    userId: auth.userId,
    date,
    phase: input.phase,
  };

  if (input.mood === null) {
    await prisma.dailyMoodEntry.deleteMany({ where: identity });
    return NextResponse.json(null);
  }

  const entry = await prisma.dailyMoodEntry.upsert({
    where: { userId_date_phase: identity },
    create: {
      ...identity,
      mood: input.mood,
      energy: input.energy ?? null,
      note: input.note ?? "",
    },
    update: {
      mood: input.mood,
      energy: input.energy ?? null,
      note: input.note ?? "",
    },
  });
  return NextResponse.json(entry);
}
