"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  Check,
  Clock3,
  Eye,
  EyeOff,
  MailPlus,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SunnieEmptyState,
  SunniePanel,
  SunnieSkeleton,
} from "@/components/ui/sunnie";

import { FRIEND_REQUESTS_UPDATED_EVENT } from "@/lib/friend-requests";

type Visibility = "NONE" | "BUSY_ONLY" | "DETAILS";
type FriendConnection = {
  id: string;
  status: "PENDING" | "ACCEPTED";
  direction: "incoming" | "outgoing";
  friend: {
    id: string;
    name: string | null;
    email: string | null;
    online: boolean;
  };
  myVisibility: Visibility;
  theirVisibility: Visibility;
};

const visibilityOptions: Array<{ value: Visibility; label: string }> = [
  { value: "BUSY_ONLY", label: "Busy times only" },
  { value: "DETAILS", label: "Full event details" },
  { value: "NONE", label: "Hidden" },
];

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok)
    throw new Error(data?.error || `Request failed (${response.status})`);
  return data as T;
}

export default function FriendsPage() {
  const [connections, setConnections] = useState<FriendConnection[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      setConnections(
        await fetch("/api/friends").then((response) =>
          readResponse<FriendConnection[]>(response)
        )
      );
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load friends"
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(false), 60_000);
    const handleFocus = () => void load(false);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [load]);

  const accepted = useMemo(
    () => connections.filter((item) => item.status === "ACCEPTED"),
    [connections]
  );
  const incoming = useMemo(
    () =>
      connections.filter(
        (item) => item.status === "PENDING" && item.direction === "incoming"
      ),
    [connections]
  );
  const outgoing = useMemo(
    () =>
      connections.filter(
        (item) => item.status === "PENDING" && item.direction === "outgoing"
      ),
    [connections]
  );

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then((response) => readResponse<FriendConnection>(response));
      setEmail("");
      await load();
      window.dispatchEvent(new Event(FRIEND_REQUESTS_UPDATED_EVENT));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to send request"
      );
    } finally {
      setSaving(false);
    }
  };

  const act = async (id: string, action: string, visibility?: Visibility) => {
    const previousConnections = connections;
    if (action === "visibility" && visibility) {
      setConnections((current) =>
        current.map((connection) =>
          connection.id === id
            ? { ...connection, myVisibility: visibility }
            : connection
        )
      );
    }
    setSaving(true);
    try {
      await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, visibility }),
      }).then((response) => readResponse<unknown>(response));
      if (action !== "visibility") await load();
      window.dispatchEvent(new Event(FRIEND_REQUESTS_UPDATED_EVENT));
    } catch (caught) {
      if (action === "visibility") setConnections(previousConnections);
      setError(
        caught instanceof Error ? caught.message : "Unable to update friend"
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/friends?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).then((response) => readResponse<unknown>(response));
      await load();
      window.dispatchEvent(new Event(FRIEND_REQUESTS_UPDATED_EVENT));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to remove friend"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-full w-full min-w-0 overflow-x-clip bg-background p-3 text-foreground min-[380px]:p-4 sm:p-5 lg:p-8">
      <div className="mx-auto w-full min-w-0 max-w-5xl">
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <UsersRound className="h-4 w-4" />
            Friends
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            Plan together, privately.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Connect by account email, then choose exactly what each friend can
            see. Sharing defaults to busy times only.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <SunniePanel className="mb-5">
          <h2 className="font-semibold">Add a friend</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            They need an account on this server first. Enable public signup in
            Settings → Admin → Users while friends register, then disable it
            again.
          </p>
          <form
            onSubmit={invite}
            className="mt-4 flex max-w-xl flex-col gap-2 sm:flex-row"
          >
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="friend@example.com"
              className="min-w-0 flex-1"
            />
            <Button type="submit" disabled={saving || !email.trim()}>
              <MailPlus className="h-4 w-4" />
              Request
            </Button>
          </form>
        </SunniePanel>

        {loading ? (
          <FriendsPageSkeleton />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <SunniePanel>
              <h2 className="font-semibold">Connected friends</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Your choice controls what you share with each person.
              </p>
              <div className="mt-4 space-y-3">
                {!accepted.length && (
                  <SunnieEmptyState
                    icon={<UsersRound />}
                    title="No connected friends yet"
                    description="Send a request above when you're ready to plan alongside someone."
                  />
                )}
                {accepted.map((connection) => (
                  <article
                    key={connection.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-accent font-semibold text-accent-foreground">
                        {(
                          connection.friend.name ||
                          connection.friend.email ||
                          "F"
                        )
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${connection.friend.online ? "bg-success shadow-[0_0_0_3px_hsl(var(--success)/0.2)]" : "bg-muted-foreground/60"}`}
                            title={
                              connection.friend.online
                                ? "Online now"
                                : "Offline"
                            }
                            aria-label={
                              connection.friend.online
                                ? "Online now"
                                : "Offline"
                            }
                          />
                          <p className="truncate text-sm font-semibold">
                            {connection.friend.name || connection.friend.email}
                          </p>
                        </div>
                        {connection.friend.name && (
                          <p className="truncate text-xs text-muted-foreground">
                            {connection.friend.email}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => void remove(connection.id)}
                        disabled={saving}
                        title="Remove friend"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <UserRoundX className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs text-muted-foreground">
                        I share
                        <select
                          value={connection.myVisibility}
                          onChange={(event) =>
                            void act(
                              connection.id,
                              "visibility",
                              event.target.value as Visibility
                            )
                          }
                          className="mt-1 block min-h-9 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs text-foreground"
                        >
                          {visibilityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="text-xs text-muted-foreground">
                        They share
                        <div className="mt-1 flex h-[34px] items-center gap-2 rounded-lg bg-muted px-2.5 text-xs text-secondary-foreground">
                          {connection.theirVisibility === "NONE" ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : connection.theirVisibility === "DETAILS" ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <Clock3 className="h-3.5 w-3.5" />
                          )}
                          {
                            visibilityOptions.find(
                              (item) =>
                                item.value === connection.theirVisibility
                            )?.label
                          }
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </SunniePanel>

            <aside className="space-y-5">
              <SunniePanel>
                <h2 className="font-semibold">Requests</h2>
                <div className="mt-4 space-y-3">
                  {!incoming.length && (
                    <p className="text-xs text-muted-foreground">
                      No requests waiting.
                    </p>
                  )}
                  {incoming.map((connection) => (
                    <div
                      key={connection.id}
                      className="rounded-xl bg-muted p-3"
                    >
                      <p className="text-sm font-medium">
                        {connection.friend.name || connection.friend.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {connection.friend.email}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => void act(connection.id, "accept")}
                          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => void act(connection.id, "decline")}
                          className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SunniePanel>
              {!!outgoing.length && (
                <SunniePanel>
                  <h2 className="font-semibold">Sent</h2>
                  <div className="mt-3 space-y-2">
                    {outgoing.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs"
                      >
                        <span className="truncate">
                          {connection.friend.name || connection.friend.email}
                        </span>
                        <button
                          onClick={() => void remove(connection.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </SunniePanel>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function FriendsPageSkeleton() {
  return (
    <div
      aria-label="Loading friends"
      className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]"
    >
      <SunniePanel>
        <SunnieSkeleton className="h-5 w-40" />
        <SunnieSkeleton className="mt-2 h-3 w-64 max-w-full" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-border p-4"
            >
              <SunnieSkeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <SunnieSkeleton className="h-4 w-1/2" />
                <SunnieSkeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </SunniePanel>
      <SunniePanel className="h-fit space-y-4">
        <SunnieSkeleton className="h-5 w-24" />
        <SunnieSkeleton className="h-20 w-full" />
        <SunnieSkeleton className="h-20 w-full" />
      </SunniePanel>
    </div>
  );
}
