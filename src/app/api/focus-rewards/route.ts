import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "focus-rewards-route";

async function getOrCreateRewards(userId: string) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    select: { sunDrops: true },
  });
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  return NextResponse.json(await getOrCreateRewards(auth.userId));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { amount?: unknown };
  const amount =
    typeof body.amount === "number" && Number.isFinite(body.amount)
      ? Math.floor(body.amount)
      : 1;
  if (amount < 1 || amount > 10) {
    return NextResponse.json(
      { error: "Reward amount must be between 1 and 10." },
      { status: 400 }
    );
  }

  const rewards = await prisma.userSettings.upsert({
    where: { userId: auth.userId },
    update: { sunDrops: { increment: amount } },
    create: {
      userId: auth.userId,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sunDrops: amount,
    },
    select: { sunDrops: true },
  });

  return NextResponse.json(rewards);
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => ({}))) as {
    minimum?: unknown;
  };
  const minimum =
    typeof body.minimum === "number" && Number.isFinite(body.minimum)
      ? Math.max(0, Math.min(1_000_000, Math.floor(body.minimum)))
      : 0;

  await getOrCreateRewards(auth.userId);
  await prisma.userSettings.updateMany({
    where: { userId: auth.userId, sunDrops: { lt: minimum } },
    data: { sunDrops: minimum },
  });

  return NextResponse.json(await getOrCreateRewards(auth.userId));
}
