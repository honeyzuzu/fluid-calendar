"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  ArrowRight,
  Check,
  Clock3,
  Eye,
  EyeOff,
  HeartHandshake,
  MailPlus,
  ShieldCheck,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SunniePanel, SunnieSkeleton } from "@/components/ui/sunnie";

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
  { value: "DETAILS", label: "Event and task names" },
  { value: "NONE", label: "Nothing" },
];
const visibilityDescriptions: Record<Visibility, string> = {
  BUSY_ONLY: "They see when you're busy, without names or details.",
  DETAILS:
    "They see titles and times from your enabled calendars and scheduled tasks.",
  NONE: "Your calendar and scheduled tasks stay hidden from them.",
};

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok)
    throw new Error(data?.error || `Request failed (${response.status})`);
  return data as T;
}

function displayName(connection: FriendConnection) {
  return connection.friend.name || connection.friend.email || "Friend";
}

function Avatar({ connection }: { connection: FriendConnection }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-lg font-semibold text-primary"
    >
      {displayName(connection).slice(0, 1).toUpperCase()}
    </span>
  );
}

function VisibilityLabel({ value }: { value: Visibility }) {
  const Icon = value === "NONE" ? EyeOff : value === "DETAILS" ? Eye : Clock3;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      {visibilityOptions.find((option) => option.value === value)?.label}
    </span>
  );
}

export default function FriendsPage() {
  const [connections, setConnections] = useState<FriendConnection[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [friendToRemove, setFriendToRemove] = useState<FriendConnection | null>(
    null
  );
  const emailInput = useRef<HTMLInputElement>(null);
  const mutationInFlight = useRef(false);

  const load = useCallback(async (showLoading = true) => {
    if (mutationInFlight.current) return;
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/friends", { cache: "no-store" });
      const next = await readResponse<FriendConnection[]>(response);
      if (!mutationInFlight.current) setConnections(next);
      if (!mutationInFlight.current) setError(null);
    } catch (caught) {
      if (!mutationInFlight.current) {
        setError(
          caught instanceof Error ? caught.message : "Unable to load friends"
        );
      }
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

  const accepted = connections.filter((item) => item.status === "ACCEPTED");
  const incoming = connections.filter(
    (item) => item.status === "PENDING" && item.direction === "incoming"
  );
  const outgoing = connections.filter(
    (item) => item.status === "PENDING" && item.direction === "outgoing"
  );

  const beginMutation = (id: string) => {
    if (mutationInFlight.current) return false;
    mutationInFlight.current = true;
    setBusyId(id);
    setError(null);
    setNotice(null);
    return true;
  };
  const finishMutation = () => {
    mutationInFlight.current = false;
    setBusyId(null);
    window.dispatchEvent(new Event(FRIEND_REQUESTS_UPDATED_EVENT));
  };

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !beginMutation("invite")) return;
    try {
      const connection = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      }).then((response) => readResponse<FriendConnection>(response));
      setConnections((current) => [connection, ...current]);
      setEmail("");
      setNotice(
        `Request sent to ${connection.friend.email || displayName(connection)}. They can accept it in Friends.`
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to send request"
      );
    } finally {
      finishMutation();
    }
  };

  const act = async (
    connection: FriendConnection,
    action: "accept" | "decline" | "visibility",
    visibility?: Visibility
  ) => {
    if (!beginMutation(connection.id)) return;
    const previous = connections;
    if (action === "visibility" && visibility) {
      setConnections((current) =>
        current.map((item) =>
          item.id === connection.id
            ? { ...item, myVisibility: visibility }
            : item
        )
      );
    } else if (action === "accept") {
      setConnections((current) =>
        current.map((item) =>
          item.id === connection.id ? { ...item, status: "ACCEPTED" } : item
        )
      );
    } else {
      setConnections((current) =>
        current.filter((item) => item.id !== connection.id)
      );
    }
    try {
      const updated = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: connection.id, action, visibility }),
      }).then((response) =>
        readResponse<FriendConnection | { removed: true }>(response)
      );
      if (action !== "decline") {
        setConnections((current) =>
          current.map((item) =>
            item.id === connection.id ? (updated as FriendConnection) : item
          )
        );
      }
      if (action === "accept")
        setNotice(
          `${displayName(connection)} is now a friend. Sharing starts with busy times only.`
        );
      if (action === "decline") setNotice("Request declined.");
    } catch (caught) {
      setConnections(previous);
      setError(
        `${action === "visibility" ? "Sharing choice" : "Friend request"} could not be saved. ${caught instanceof Error ? caught.message : "Please try again."}`
      );
    } finally {
      finishMutation();
    }
  };

  const remove = async (connection: FriendConnection) => {
    if (!beginMutation(connection.id)) return;
    const previous = connections;
    setConnections((current) =>
      current.filter((item) => item.id !== connection.id)
    );
    try {
      await fetch(`/api/friends?id=${encodeURIComponent(connection.id)}`, {
        method: "DELETE",
      }).then((response) => readResponse<{ removed: true }>(response));
      setFriendToRemove(null);
      setNotice(
        connection.status === "PENDING"
          ? "Request canceled."
          : `${displayName(connection)} was removed. Calendar sharing has stopped.`
      );
    } catch (caught) {
      setConnections(previous);
      setFriendToRemove(null);
      setError(
        `Could not ${connection.status === "PENDING" ? "cancel the request" : "remove the friend"}. ${caught instanceof Error ? caught.message : "Please try again."}`
      );
    } finally {
      finishMutation();
    }
  };

  return (
    <main className="min-h-full w-full min-w-0 overflow-x-clip bg-background p-3 pb-24 text-foreground min-[380px]:p-4 sm:p-5 lg:p-8">
      <div className="mx-auto w-full min-w-0 max-w-5xl space-y-5">
        <header className="mb-1">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" /> Friends
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Your people, your pace.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            See shared time while keeping control of what friends see from you.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <span>{error}</span>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError(null)}
              className="shrink-0 rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground"
          >
            <span>{notice}</span>
            <button
              type="button"
              aria-label="Dismiss notice"
              onClick={() => setNotice(null)}
              className="shrink-0 rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {!loading && incoming.length > 0 && (
          <section
            aria-labelledby="friend-requests-heading"
            className="rounded-[var(--radius-card)] border border-primary/25 bg-primary/5 p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <MailPlus className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="friend-requests-heading" className="font-semibold">
                Waiting for you
              </h2>
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {incoming.length}
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {incoming.map((connection) => (
                <article
                  key={connection.id}
                  className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar connection={connection} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {displayName(connection)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {connection.friend.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Wants to connect with you
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!!busyId}
                      onClick={() => void act(connection, "accept")}
                    >
                      <Check aria-hidden="true" /> Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={!!busyId}
                      onClick={() => void act(connection, "decline")}
                    >
                      Decline
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Accepting starts with busy times only. You can change your sharing
              choice anytime.
            </p>
          </section>
        )}

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,21rem)] lg:items-start">
          <aside
            className={`${accepted.length ? "order-last" : "order-first"} space-y-4 lg:order-last`}
          >
            <SunniePanel>
              <div className="flex items-center gap-2">
                <MailPlus className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="font-semibold">Invite a friend</h2>
              </div>
              <p
                id="friend-email-hint"
                className="mt-2 text-sm leading-5 text-muted-foreground"
              >
                Enter the email they use for Sunnie. They&apos;ll see your
                request here when they next open the app.
              </p>
              <form onSubmit={invite} className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="friend-account-email"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Friend&apos;s account email
                  </label>
                  <Input
                    ref={emailInput}
                    id="friend-account-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="friend@example.com"
                    autoComplete="email"
                    aria-describedby="friend-email-hint"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!!busyId || loading || !email.trim()}
                  className="w-full"
                >
                  <MailPlus aria-hidden="true" />{" "}
                  {busyId === "invite" ? "Sending…" : "Send request"}
                </Button>
              </form>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                They need an account first. If they&apos;re new, ask the person
                who hosts this Sunnie planner to help them join.
              </p>
            </SunniePanel>
            <div className="flex gap-3 rounded-2xl border border-border bg-muted/60 p-4">
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                <strong className="block text-sm text-foreground">
                  Sharing stays in your hands
                </strong>
                Friends start with busy times only. Each person chooses what the
                other sees, and you can hide your time at any moment.
              </p>
            </div>
          </aside>

          <section
            aria-labelledby="connected-friends-heading"
            className="min-w-0"
          >
            <SunniePanel>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 id="connected-friends-heading" className="font-semibold">
                    Connected friends
                    {!loading && accepted.length > 0
                      ? ` · ${accepted.length}`
                      : ""}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your sharing choice is separate for each friend.
                  </p>
                </div>
                {accepted.some((item) => item.theirVisibility !== "NONE") && (
                  <Link
                    href="/calendar"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    See shared time{" "}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
              {loading ? (
                <FriendsPageSkeleton />
              ) : accepted.length === 0 ? (
                <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-5 sm:flex-row sm:items-center">
                  <div
                    className="relative grid h-14 w-20 shrink-0 place-items-center"
                    aria-hidden="true"
                  >
                    <span className="absolute left-0 h-11 w-11 rounded-2xl border border-primary/20 bg-primary/15" />
                    <span className="absolute right-1 h-11 w-11 rounded-2xl border border-accent bg-accent/70" />
                    <UsersRound className="relative h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">
                      A little room for your people
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      Send a request to someone you know. Once they accept,
                      their shared time can appear on your Calendar.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => emailInput.current?.focus()}
                  >
                    Invite someone
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {accepted.map((connection) => (
                    <article
                      key={connection.id}
                      className="min-w-0 rounded-2xl border border-border bg-card p-4"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar connection={connection} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="min-w-0 truncate text-sm font-semibold">
                              {displayName(connection)}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <span
                                className={`h-2 w-2 rounded-full ${connection.friend.online ? "bg-success" : "bg-muted-foreground/50"}`}
                                aria-hidden="true"
                              />
                              {connection.friend.online ? "Online" : "Offline"}
                            </span>
                          </div>
                          {connection.friend.name && (
                            <p className="truncate text-xs text-muted-foreground">
                              {connection.friend.email}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setFriendToRemove(connection)}
                          disabled={!!busyId}
                          className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                          aria-label={`Remove ${displayName(connection)}`}
                        >
                          <UserRoundX className="h-4 w-4" aria-hidden="true" />{" "}
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                      <div className="mt-4 grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2">
                        <div className="min-w-0">
                          <label
                            htmlFor={`visibility-${connection.id}`}
                            className="mb-1.5 block text-xs font-semibold text-foreground"
                          >
                            What they can see
                          </label>
                          <select
                            id={`visibility-${connection.id}`}
                            value={connection.myVisibility}
                            disabled={!!busyId}
                            onChange={(event) =>
                              void act(
                                connection,
                                "visibility",
                                event.target.value as Visibility
                              )
                            }
                            aria-describedby={`visibility-help-${connection.id}`}
                            className="block min-h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                          >
                            {visibilityOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p
                            id={`visibility-help-${connection.id}`}
                            className="mt-1.5 text-xs leading-4 text-muted-foreground"
                          >
                            {visibilityDescriptions[connection.myVisibility]}
                          </p>
                        </div>
                        <div className="min-w-0 sm:border-l sm:border-border/70 sm:pl-3">
                          <p className="mb-2 text-xs font-semibold text-foreground">
                            What you can see
                          </p>
                          <VisibilityLabel value={connection.theirVisibility} />
                          <p className="mt-1.5 text-xs leading-4 text-muted-foreground">
                            {connection.theirVisibility === "NONE"
                              ? "They aren't sharing their time with you."
                              : connection.theirVisibility === "BUSY_ONLY"
                                ? "Their busy times appear on your Calendar."
                                : "Their event and task names appear on your Calendar."}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </SunniePanel>

            {!loading && outgoing.length > 0 && (
              <SunniePanel className="mt-4">
                <h2 className="font-semibold">Requests you sent</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Waiting for your friends to accept.
                </p>
                <ul className="mt-3 divide-y divide-border/70">
                  {outgoing.map((connection) => (
                    <li
                      key={connection.id}
                      className="flex min-w-0 items-center gap-3 py-3"
                    >
                      <Avatar connection={connection} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {displayName(connection)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!!busyId}
                        onClick={() => void remove(connection)}
                      >
                        Cancel request
                      </Button>
                    </li>
                  ))}
                </ul>
              </SunniePanel>
            )}
          </section>
        </div>
      </div>

      <AlertDialog.Root
        open={!!friendToRemove}
        onOpenChange={(open) => {
          if (!open && !busyId) setFriendToRemove(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[10020] bg-foreground/25 backdrop-blur-[2px]" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[10021] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-5 text-foreground shadow-[var(--shadow-raised)] sm:p-6">
            <AlertDialog.Title className="text-lg font-semibold">
              Remove {friendToRemove ? displayName(friendToRemove) : "friend"}?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
              You&apos;ll stop sharing calendar time with each other. You can
              send a new request later.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={!!busyId}>
                  Keep friend
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!!busyId}
                  onClick={(event) => {
                    event.preventDefault();
                    if (friendToRemove) void remove(friendToRemove);
                  }}
                >
                  {busyId ? "Removing…" : "Remove friend"}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </main>
  );
}

function FriendsPageSkeleton() {
  return (
    <div aria-label="Loading friends" className="mt-4 space-y-3">
      {Array.from({ length: 2 }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-border p-4"
        >
          <SunnieSkeleton className="h-11 w-11 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <SunnieSkeleton className="h-4 w-1/2" />
            <SunnieSkeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
