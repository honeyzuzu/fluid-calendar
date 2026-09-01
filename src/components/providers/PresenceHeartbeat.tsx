"use client";

import { useCallback, useEffect } from "react";

import { useSession } from "next-auth/react";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function PresenceHeartbeat() {
  const { status } = useSession();

  const sendHeartbeat = useCallback(() => {
    if (status !== "authenticated" || document.visibilityState === "hidden") {
      return;
    }

    void fetch("/api/presence", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => undefined);
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    const handleActivity = () => sendHeartbeat();

    document.addEventListener("visibilitychange", handleActivity);
    window.addEventListener("focus", handleActivity);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleActivity);
      window.removeEventListener("focus", handleActivity);
    };
  }, [sendHeartbeat, status]);

  return null;
}
