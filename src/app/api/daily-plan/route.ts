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
    return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
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
  };
  const date = parsePlanDate(body.date);
  if (!date) {
    return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
  }
  if (body.intention !== undefined && typeof body.intention !== "string") {
    return NextResponse.json({ error: "Intention must be text" }, { status: 400 });
  }
  if (body.completed !== undefined && typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "Completed must be true or false" }, { status: 400 });
  }

  const intention = typeof body.intention === "string" ? body.intention.trim().slice(0, 500) : undefined;
  const completedAt = typeof body.completed === "boolean"
    ? body.completed ? new Date() : null
    : undefined;

  const plan = await prisma.dailyPlan.upsert({
    where: { userId_date: { userId: auth.userId, date } },
    create: {
      userId: auth.userId,
      date,
      intention: intention ?? null,
      completedAt: completedAt ?? null,
    },
    update: {
      ...(intention !== undefined && { intention }),
      ...(completedAt !== undefined && { completedAt }),
    },
  });

  return NextResponse.json(plan);
}
