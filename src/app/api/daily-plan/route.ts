import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "daily-plan-route";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parsePlanDate(value: unknown): Date | null {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const rawDate = request.nextUrl.searchParams.get("date");
  const date = parsePlanDate(rawDate);
  if (!date) {
    return NextResponse.json(
      { error: "A valid date is required" },
      { status: 400 }
    );
  }

  const plan = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId: auth.userId, date } },
  });

  return NextResponse.json(plan);
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const body = (await request.json()) as {
    date?: unknown;
    intention?: unknown;
    completed?: unknown;
    dayVibe?: unknown;
    unwindReflection?: unknown;
    unwindCompleted?: unknown;
  };
  const date = parsePlanDate(body.date);
  if (!date) {
    return NextResponse.json(
      { error: "A valid date is required" },
      { status: 400 }
    );
  }
  if (body.intention !== undefined && typeof body.intention !== "string") {
    return NextResponse.json(
      { error: "Intention must be text" },
      { status: 400 }
    );
  }
  if (body.completed !== undefined && typeof body.completed !== "boolean") {
    return NextResponse.json(
      { error: "Completed must be true or false" },
      { status: 400 }
    );
  }
  const allowedVibes = ["stormy", "cloudy", "soft", "sunny", "glowing"];
  if (
    body.dayVibe !== undefined &&
    body.dayVibe !== null &&
    (typeof body.dayVibe !== "string" || !allowedVibes.includes(body.dayVibe))
  ) {
    return NextResponse.json(
      { error: "Choose a valid day vibe" },
      { status: 400 }
    );
  }
  if (
    body.unwindReflection !== undefined &&
    typeof body.unwindReflection !== "string"
  ) {
    return NextResponse.json(
      { error: "Reflection must be text" },
      { status: 400 }
    );
  }
  if (
    body.unwindCompleted !== undefined &&
    typeof body.unwindCompleted !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Unwind completion must be true or false" },
      { status: 400 }
    );
  }

  const intention =
    typeof body.intention === "string"
      ? body.intention.trim().slice(0, 500)
      : undefined;
  const completedAt =
    typeof body.completed === "boolean"
      ? body.completed
        ? new Date()
        : null
      : undefined;
  const dayVibe =
    body.dayVibe === null
      ? null
      : typeof body.dayVibe === "string"
        ? body.dayVibe
        : undefined;
  const unwindReflection =
    typeof body.unwindReflection === "string"
      ? body.unwindReflection.trim().slice(0, 1000)
      : undefined;
  const unwindCompletedAt =
    typeof body.unwindCompleted === "boolean"
      ? body.unwindCompleted
        ? new Date()
        : null
      : undefined;

  const plan = await prisma.dailyPlan.upsert({
    where: { userId_date: { userId: auth.userId, date } },
    create: {
      userId: auth.userId,
      date,
      intention: intention ?? null,
      completedAt: completedAt ?? null,
      dayVibe: dayVibe ?? null,
      unwindReflection: unwindReflection ?? "",
      unwindCompletedAt: unwindCompletedAt ?? null,
    },
    update: {
      ...(intention !== undefined && { intention }),
      ...(completedAt !== undefined && { completedAt }),
      ...(dayVibe !== undefined && { dayVibe }),
      ...(unwindReflection !== undefined && { unwindReflection }),
      ...(unwindCompletedAt !== undefined && { unwindCompletedAt }),
    },
  });

  return NextResponse.json(plan);
}
