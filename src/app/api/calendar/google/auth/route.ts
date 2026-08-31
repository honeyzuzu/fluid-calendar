import { NextResponse } from "next/server";

import { getAppUrl } from "@/lib/app-url";
import { createGoogleOAuthClient } from "@/lib/google";

export async function GET() {
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
  });

  return NextResponse.redirect(url);
}
