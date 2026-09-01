import { hasIncomingPendingFriendRequest } from "@/lib/friend-requests";

describe("hasIncomingPendingFriendRequest", () => {
  it("detects an incoming request that is still pending", () => {
    expect(
      hasIncomingPendingFriendRequest([
        { status: "ACCEPTED", direction: "incoming" },
        { status: "PENDING", direction: "incoming" },
      ])
    ).toBe(true);
  });

  it("ignores sent requests and accepted friends", () => {
    expect(
      hasIncomingPendingFriendRequest([
        { status: "PENDING", direction: "outgoing" },
        { status: "ACCEPTED", direction: "incoming" },
      ])
    ).toBe(false);
  });
});
