import { NextRequest, NextResponse } from "next/server";

import { getAppUrl } from "@/lib/app-url";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { createGoogleOAuthClient } from "@/lib/google";
import { createOAuthState } from "@/lib/oauth-state";

const LOG_SOURCE = "GoogleCalendarAuth";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const redirectUrl = getAppUrl("/api/calendar/google");
  const oauth2Client = await createGoogleOAuthClient({ redirectUrl });

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/tasks",
    ],
    prompt: "consent",
    state: createOAuthState(auth.userId, "google"),
  });

  return NextResponse.redirect(url);
}
