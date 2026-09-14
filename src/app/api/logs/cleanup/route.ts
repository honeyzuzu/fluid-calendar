import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-auth";
import { newDate } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  try {
    // Delete all expired logs
    const { count } = await prisma.log.deleteMany({
      where: {
        expiresAt: {
          lt: newDate(),
        },
      },
    });

    return NextResponse.json({
      message: `Cleaned up ${count} expired logs`,
      count,
    });
  } catch (error) {
    console.error("Failed to cleanup logs:", error);
    return NextResponse.json(
      { error: "Failed to cleanup logs" },
      { status: 500 }
    );
  }
}
