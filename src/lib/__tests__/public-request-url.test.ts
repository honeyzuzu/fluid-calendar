import { NextRequest } from "next/server";

import { publicRequestUrl } from "@/lib/auth/public-request-url";

describe("publicRequestUrl", () => {
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;

  afterEach(() => {
    process.env.NEXTAUTH_URL = originalNextAuthUrl;
  });

  it("does not expose a reverse proxy's internal request host", () => {
    process.env.NEXTAUTH_URL = "https://sunnie.example.com";
    const request = new NextRequest(
      "https://internal-container:8080/calendar?a=1"
    );

    expect(publicRequestUrl(request).toString()).toBe(
      "https://sunnie.example.com/calendar?a=1"
    );
  });
});
