import { createOAuthState, verifyOAuthState } from "@/lib/oauth-state";

describe("OAuth state", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-secret-at-least-32-characters";
  });

  it("binds a signed state to its user and provider", () => {
    const state = createOAuthState("user-1", "google");
    expect(verifyOAuthState(state, "user-1", "google")).toBe(true);
    expect(verifyOAuthState(state, "user-2", "google")).toBe(false);
    expect(verifyOAuthState(state, "user-1", "outlook")).toBe(false);
  });

  it("rejects tampered and malformed state", () => {
    const state = createOAuthState("user-1", "google");
    expect(verifyOAuthState(`${state}x`, "user-1", "google")).toBe(false);
    expect(verifyOAuthState("missing", "user-1", "google")).toBe(false);
  });
});
