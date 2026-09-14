import { NextRequest } from "next/server";

import * as route from "@/app/api/calendar/google/auth/route";

import { authenticateRequest } from "@/lib/auth/api-auth";
import * as googleModule from "@/lib/google";

jest.mock("@/lib/google");
jest.mock("@/lib/auth/api-auth", () => ({ authenticateRequest: jest.fn() }));

describe("Calendar Google auth route", () => {
  it("requests tasks scope when generating auth URL", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret-at-least-32-characters";
    (authenticateRequest as jest.Mock).mockResolvedValue({ userId: "user-1" });
    const generateAuthUrl = jest.fn().mockReturnValue("https://redirect");
    jest
      .spyOn(googleModule, "createGoogleOAuthClient")
      .mockResolvedValue({ generateAuthUrl } as unknown as ReturnType<
        typeof googleModule.createGoogleOAuthClient
      >);

    await route.GET(
      new NextRequest("http://localhost/api/calendar/google/auth")
    );

    expect(generateAuthUrl).toHaveBeenCalled();
    const arg = generateAuthUrl.mock.calls[0][0];
    expect(Array.isArray(arg.scope)).toBe(true);
    expect(arg.scope).toContain("https://www.googleapis.com/auth/tasks");
    expect(arg.state).toEqual(expect.any(String));
  });
});
