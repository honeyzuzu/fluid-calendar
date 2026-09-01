export const FRIEND_REQUESTS_UPDATED_EVENT = "sunnie:friend-requests-updated";

export type FriendRequestSummary = {
  status: string;
  direction: string;
};

export function hasIncomingPendingFriendRequest(
  connections: FriendRequestSummary[]
) {
  return connections.some(
    (connection) =>
      connection.status === "PENDING" && connection.direction === "incoming"
  );
}
