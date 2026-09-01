"use client";

import { useCallback, useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import {
  FRIEND_REQUESTS_UPDATED_EVENT,
  FriendRequestSummary,
  hasIncomingPendingFriendRequest,
} from "@/lib/friend-requests";

const REFRESH_INTERVAL_MS = 60_000;

export function usePendingFriendRequests() {
  const { status } = useSession();
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setHasPendingRequest(false);
      return;
    }

    try {
      const response = await fetch("/api/friends", { cache: "no-store" });
      if (!response.ok) return;

      const connections = (await response.json()) as FriendRequestSummary[];
      setHasPendingRequest(hasIncomingPendingFriendRequest(connections));
    } catch {
      // Keep the last known state if a background refresh briefly fails.
    }
  }, [status]);

  useEffect(() => {
    void refresh();

    const interval = window.setInterval(
      () => void refresh(),
      REFRESH_INTERVAL_MS
    );
    const handleRefresh = () => void refresh();

    window.addEventListener("focus", handleRefresh);
    window.addEventListener(FRIEND_REQUESTS_UPDATED_EVENT, handleRefresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener(FRIEND_REQUESTS_UPDATED_EVENT, handleRefresh);
    };
  }, [refresh]);

  return hasPendingRequest;
}
