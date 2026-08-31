import { getAppUrl } from "../app-url";

describe("getAppUrl", () => {
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;

  afterEach(() => {
    process.env.NEXTAUTH_URL = originalNextAuthUrl;
  });

  it.each([
    "https://sunnie-planner.example",
    "https://sunnie-planner.example/",
  ])("builds a callback without a double slash from %s", (baseUrl) => {
    process.env.NEXTAUTH_URL = baseUrl;

    expect(getAppUrl("/api/calendar/google")).toBe(
      "https://sunnie-planner.example/api/calendar/google"
    );
  });
});
