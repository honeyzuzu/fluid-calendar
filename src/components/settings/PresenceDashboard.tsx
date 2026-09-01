"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Activity,
  Clock3,
  Loader2,
  RefreshCw,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import AccessDeniedMessage from "@/components/auth/AccessDeniedMessage";
import AdminOnly from "@/components/auth/AdminOnly";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { SettingsSection } from "./SettingsSection";

type PresenceUser = {
  id: string;
  name: string | null;
  email: string | null;
  lastActiveAt: string;
  online: boolean;
};

type PresenceSummary = {
  generatedAt: string;
  onlineWindowMinutes: number;
  totalUsers: number;
  onlineNow: number;
  activeToday: number;
  users: PresenceUser[];
};

function localDayStart() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function formatLastSeen(value: string, online: boolean) {
  if (online) return "Online now";

  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000)
  );
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function PresenceDashboard() {
  const [summary, setSummary] = useState<PresenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Make the current admin visible immediately instead of waiting for the
      // next global one-minute heartbeat.
      await fetch("/api/presence", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
      }).catch(() => undefined);

      const response = await fetch(
        `/api/admin/presence?since=${encodeURIComponent(localDayStart())}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Could not load activity right now");
      setSummary((await response.json()) as PresenceSummary);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load activity"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  return (
    <AdminOnly
      fallback={
        <AccessDeniedMessage message="You do not have permission to view user activity." />
      }
    >
      <SettingsSection
        title="Who’s around"
        description="A lightweight view of recent Sunnie activity. No page history is recorded."
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dfe2c8] bg-[#fffaf0] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f8e4a1] text-[#8a681e]">
                <Activity className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Sunnie activity</p>
                <p className="text-xs text-muted-foreground">
                  Online means active during the last five minutes.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
              className="shrink-0"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              icon={UserRoundCheck}
              label="Online now"
              value={summary?.onlineNow}
              color="bg-[#dcecc8] text-[#59733f]"
            />
            <SummaryCard
              icon={Clock3}
              label="Active today"
              value={summary?.activeToday}
              color="bg-[#fff0bf] text-[#8a681e]"
            />
            <SummaryCard
              icon={UsersRound}
              label="Total accounts"
              value={summary?.totalUsers}
              color="bg-[#e6dcf5] text-[#665080]"
            />
          </div>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Active today</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Times are shown relative to this browser.
                  </p>
                </div>
                {summary && (
                  <span className="text-[11px] text-muted-foreground">
                    Updated{" "}
                    {new Date(summary.generatedAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>

              {loading && !summary ? (
                <div className="grid min-h-32 place-items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#d0902f]" />
                </div>
              ) : summary?.users.length ? (
                <div className="divide-y divide-black/[0.055]">
                  {summary.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 py-3 first:pt-1 last:pb-1"
                    >
                      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f3ecd6] text-sm font-semibold text-[#6b6248]">
                        {(user.name || user.email || "U")
                          .slice(0, 1)
                          .toUpperCase()}
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                            user.online ? "bg-[#7cab58]" : "bg-[#c8c5b8]"
                          }`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {user.name || user.email || "Sunnie user"}
                        </p>
                        {user.name && user.email && (
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-xs font-medium ${
                          user.online
                            ? "text-[#638446]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatLastSeen(user.lastActiveAt, user.online)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-black/10 text-center">
                  <div>
                    <UsersRound className="mx-auto h-6 w-6 text-black/20" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nobody has checked in yet today.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SettingsSection>
    </AdminOnly>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Activity;
  label: string;
  value: number | undefined;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-semibold tracking-[-0.04em]">
            {value ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
