import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { ServerLogger } from "@/lib/logger/server";
import { LogEntry } from "@/lib/logger/types";

const LOG_SOURCE = "LogBatchAPI";
const ALLOWED_LEVELS = new Set(["debug", "info", "warn", "error"]);
const MAX_BATCH_SIZE = 100;
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;

    const entries = (await request.json()) as unknown;

    if (
      !Array.isArray(entries) ||
      entries.length > MAX_BATCH_SIZE ||
      JSON.stringify(entries).length > 100_000 ||
      entries.some(
        (entry) =>
          !entry ||
          typeof entry !== "object" ||
          !ALLOWED_LEVELS.has((entry as LogEntry).level) ||
          typeof (entry as LogEntry).message !== "string" ||
          (entry as LogEntry).message.length > MAX_MESSAGE_LENGTH ||
          Number.isNaN(new Date((entry as LogEntry).timestamp).getTime())
      )
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const logger = new ServerLogger();
    const result = await logger.writeBatch(entries as LogEntry[]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to process batch logs:", error);
    return NextResponse.json(
      { error: "Failed to process logs" },
      { status: 500 }
    );
  }
}
