"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  Check,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  MailPlus,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";

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
    setSaving(true);
    try {
      await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, visibility }),
      }).then((response) => readResponse<unknown>(response));
      await load();
      window.dispatchEvent(new Event(FRIEND_REQUESTS_UPDATED_EVENT));
    } catch (caught) {
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
    <main className="min-h-full w-full min-w-0 overflow-x-clip bg-[#fff9e8] p-3 text-[#3f432e] min-[380px]:p-4 sm:p-5 lg:p-8">
      <div className="mx-auto w-full min-w-0 max-w-5xl">
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d0902f]">
            <UsersRound className="h-4 w-4" />
            Friends
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            Plan together, privately.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/50">
            Connect by account email, then choose exactly what each friend can
            see. Sharing defaults to busy times only.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="mb-5 rounded-2xl border border-black/[0.065] bg-white/75 p-5 shadow-sm">
          <h2 className="font-semibold">Add a friend</h2>
          <p className="mt-1 text-xs text-black/42">
            They need an account on this server first. Enable public signup in
            Settings → Admin → Users while friends register, then disable it
            again.
          </p>
          <form
            onSubmit={invite}
            className="mt-4 flex max-w-xl flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="friend@example.com"
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#84a75e]"
            />
            <button
              disabled={saving || !email.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#64734a] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#465331] disabled:opacity-40"
            >
              <MailPlus className="h-4 w-4" />
              Request
            </button>
          </form>
        </section>

        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#84a75e]" />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <section className="rounded-2xl border border-black/[0.065] bg-white/75 p-5 shadow-sm">
              <h2 className="font-semibold">Connected friends</h2>
              <p className="mt-1 text-xs text-black/42">
                Your choice controls what you share with each person.
              </p>
              <div className="mt-4 space-y-3">
                {!accepted.length && (
                  <div className="rounded-xl border border-dashed border-black/10 p-8 text-center text-sm text-black/40">
                    No connected friends yet.
                  </div>
                )}
                {accepted.map((connection) => (
                  <article
                    key={connection.id}
                    className="rounded-xl border border-black/[0.06] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e6f0cf] font-semibold text-[#607044]">
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
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${connection.friend.online ? "bg-[#76a856] shadow-[0_0_0_3px_#e5f0d7]" : "bg-[#c4c3b9]"}`}
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
                          <p className="truncate text-xs text-black/40">
                            {connection.friend.email}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => void remove(connection.id)}
                        disabled={saving}
                        title="Remove friend"
                        className="rounded-lg p-2 text-black/30 hover:bg-red-50 hover:text-red-600"
                      >
                        <UserRoundX className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs text-black/45">
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
                          className="mt-1 block w-full rounded-lg border border-black/10 bg-[#faf9f6] px-2.5 py-2 text-xs text-black/70"
                        >
                          {visibilityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="text-xs text-black/45">
                        They share
                        <div className="mt-1 flex h-[34px] items-center gap-2 rounded-lg bg-[#eef3df] px-2.5 text-xs text-[#607044]">
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
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-black/[0.065] bg-white/75 p-5 shadow-sm">
                <h2 className="font-semibold">Requests</h2>
                <div className="mt-4 space-y-3">
                  {!incoming.length && (
                    <p className="text-xs text-black/40">
                      No requests waiting.
                    </p>
                  )}
                  {incoming.map((connection) => (
                    <div
                      key={connection.id}
                      className="rounded-xl bg-[#eef3df] p-3"
                    >
                      <p className="text-sm font-medium">
                        {connection.friend.name || connection.friend.email}
                      </p>
                      <p className="text-xs text-black/40">
                        {connection.friend.email}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => void act(connection.id, "accept")}
                          className="flex items-center gap-1 rounded-lg bg-[#64734a] px-3 py-1.5 text-xs text-white"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => void act(connection.id, "decline")}
                          className="rounded-lg px-3 py-1.5 text-xs text-black/50 hover:bg-black/5"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              {!!outgoing.length && (
                <section className="rounded-2xl border border-black/[0.065] bg-white/75 p-5 shadow-sm">
                  <h2 className="font-semibold">Sent</h2>
                  <div className="mt-3 space-y-2">
                    {outgoing.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between rounded-lg bg-black/[0.025] px-3 py-2 text-xs"
                      >
                        <span className="truncate">
                          {connection.friend.name || connection.friend.email}
                        </span>
                        <button
                          onClick={() => void remove(connection.id)}
                          className="text-black/35 hover:text-red-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
