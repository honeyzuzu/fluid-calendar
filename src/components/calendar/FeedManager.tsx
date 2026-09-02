import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { UsersRound } from "lucide-react";
import { BsArrowRepeat, BsGoogle, BsMicrosoft, BsTrash } from "react-icons/bs";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { newDate } from "@/lib/date-utils";
import {
  FRIEND_CALENDAR_COLORS,
  getFriendCalendarColor,
} from "@/lib/friend-calendar-colors";
import { cn } from "@/lib/utils";

import {
  useCalendarStore,
  useCalendarUIStore,
  useViewStore,
} from "@/store/calendar";

import { MiniCalendar } from "./MiniCalendar";
import { SunnieColorPicker } from "./SunnieColorPicker";

type FriendShare = {
  id: string;
  status: "PENDING" | "ACCEPTED";
  friend: {
    id: string;
    name: string | null;
    email: string | null;
    online: boolean;
  };
  theirVisibility: "NONE" | "BUSY_ONLY" | "DETAILS";
};

export function FeedManager() {
  const [syncingFeeds, setSyncingFeeds] = useState<Set<string>>(new Set());
  const [colorFeedId, setColorFeedId] = useState<string | null>(null);
  const [friendShares, setFriendShares] = useState<FriendShare[]>([]);
  const { feeds, removeFeed, toggleFeed, updateFeed, syncFeed } =
    useCalendarStore();
  const { date: currentDate, setDate } = useViewStore();
  const {
    hiddenFriendIds,
    toggleFriendCalendar,
    friendCalendarColors,
    setFriendCalendarColor,
    friendRefreshRevision,
  } = useCalendarUIStore();

  useEffect(() => {
    const loadFriendShares = () => {
      fetch("/api/friends", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : []))
        .then((items: FriendShare[]) =>
          setFriendShares(items.filter((item) => item.status === "ACCEPTED"))
        )
        .catch(() => undefined);
    };
    loadFriendShares();
    const interval = window.setInterval(loadFriendShares, 60_000);
    window.addEventListener("focus", loadFriendShares);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", loadFriendShares);
    };
  }, [friendRefreshRevision]);

  const handleRemoveFeed = useCallback(
    async (feedId: string) => {
      try {
        await removeFeed(feedId);
      } catch (error) {
        console.error("Failed to remove feed:", error);
      }
    },
    [removeFeed]
  );

  const handleSyncFeed = useCallback(
    async (feedId: string) => {
      if (syncingFeeds.has(feedId)) return;

      try {
        setSyncingFeeds((prev) => new Set(prev).add(feedId));
        await syncFeed(feedId);
      } finally {
        setSyncingFeeds((prev) => {
          const next = new Set(prev);
          next.delete(feedId);
          return next;
        });
      }
    },
    [syncFeed, syncingFeeds]
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border py-4">
        <MiniCalendar currentDate={currentDate} onDateClick={setDate} />
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Your Calendars</h3>
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={feed.enabled}
                  onCheckedChange={() => toggleFeed(feed.id)}
                  className="h-4 w-4"
                />
                <Popover
                  open={colorFeedId === feed.id}
                  onOpenChange={(open) => setColorFeedId(open ? feed.id : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-background shadow-sm ring-1 ring-border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
                      style={{
                        backgroundColor: feed.color || "#F6D77A",
                      }}
                      title={`Change ${feed.name} color`}
                      aria-label={`Change ${feed.name} color`}
                    />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72">
                    <p className="mb-3 text-sm font-medium">
                      {feed.name} color
                    </p>
                    <SunnieColorPicker
                      value={feed.color}
                      onChange={(color) => {
                        if (color) {
                          void updateFeed(feed.id, { color });
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <span className="calendar-name max-w-[150px] truncate text-sm text-foreground">
                  {feed.name}
                </span>
                {feed.type === "GOOGLE" && (
                  <BsGoogle
                    className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                    title={feed.url}
                  />
                )}
                {feed.type === "OUTLOOK" && (
                  <BsMicrosoft
                    className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                    title={feed.url}
                  />
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSyncFeed(feed.id)}
                  disabled={syncingFeeds.has(feed.id)}
                  title={`Refresh ${feed.name}. ${feed.lastSync ? `Last refreshed ${newDate(feed.lastSync).toLocaleString()}.` : "Not refreshed yet."}`}
                  aria-label={`Refresh ${feed.name}`}
                  className={cn(
                    "rounded-full p-1.5 text-muted-foreground hover:text-foreground",
                    "hover:bg-muted/50 focus:outline-none focus:ring-2",
                    "focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    "disabled:opacity-50"
                  )}
                >
                  <BsArrowRepeat
                    className={cn(
                      "h-3.5 w-3.5",
                      syncingFeeds.has(feed.id) && "animate-spin"
                    )}
                  />
                </button>
                <button
                  onClick={() => handleRemoveFeed(feed.id)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                >
                  <BsTrash className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {feeds.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No calendars added yet
            </p>
          )}
        </div>

        <div className="border-t border-[#e4e0cc] pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-medium text-foreground">
              <UsersRound className="h-4 w-4 text-[#8069a7]" /> Friends&apos;
              shared time
            </h3>
            <Link
              href="/friends"
              className="text-xs font-semibold text-[#687b4c] hover:underline"
            >
              Manage
            </Link>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Use each checkbox like a calendar. Their sharing choice decides
            whether enabled blocks say “Busy,” show details, or stay hidden.
          </p>
          <div className="mt-3 space-y-1.5">
            {friendShares.map((connection) => {
              const friendColor = getFriendCalendarColor(
                connection.friend.id,
                friendCalendarColors
              );
              return (
                <div
                  key={connection.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ backgroundColor: `${friendColor}38` }}
                >
                  <Checkbox
                    checked={
                      connection.theirVisibility !== "NONE" &&
                      !hiddenFriendIds.includes(connection.friend.id)
                    }
                    disabled={connection.theirVisibility === "NONE"}
                    onCheckedChange={() =>
                      toggleFriendCalendar(connection.friend.id)
                    }
                    aria-label={`Show ${connection.friend.name || connection.friend.email || "friend"}'s shared calendar`}
                    className="h-4 w-4"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="h-5 w-5 shrink-0 rounded-full border-2 border-white shadow-sm ring-1 ring-black/10 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#7c8d61]"
                        style={{ backgroundColor: friendColor }}
                        title={`Change ${connection.friend.name || connection.friend.email || "friend"}'s calendar color`}
                        aria-label={`Change ${connection.friend.name || connection.friend.email || "friend"}'s calendar color`}
                      />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64">
                      <p className="text-sm font-semibold text-[#495036]">
                        Friend calendar color
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Every shared block from this friend uses the same color.
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {FRIEND_CALENDAR_COLORS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() =>
                              setFriendCalendarColor(
                                connection.friend.id,
                                color.value
                              )
                            }
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl p-2 text-[10px] text-[#5b5d50] transition hover:bg-black/[0.035]",
                              friendColor === color.value &&
                                "bg-[#eef3df] font-semibold ring-1 ring-[#aebd91]"
                            )}
                            title={color.name}
                          >
                            <span
                              className="h-7 w-7 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: color.value }}
                            />
                            <span className="leading-tight">{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${connection.friend.online ? "bg-[#76a856] shadow-[0_0_0_2px_#e5f0d7]" : "bg-[#aaa5b0]"}`}
                    title={connection.friend.online ? "Online now" : "Offline"}
                    aria-label={
                      connection.friend.online ? "Online now" : "Offline"
                    }
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#534763]">
                    {connection.friend.name ||
                      connection.friend.email ||
                      "Friend"}
                  </span>
                  <span className="text-[10px] font-semibold text-[#786a88]">
                    {connection.theirVisibility === "NONE"
                      ? "Not shared"
                      : hiddenFriendIds.includes(connection.friend.id)
                        ? "Hidden here"
                        : connection.theirVisibility === "DETAILS"
                          ? "Details"
                          : connection.theirVisibility === "BUSY_ONLY"
                            ? "Busy only"
                            : "Not shared"}
                  </span>
                </div>
              );
            })}
            {!friendShares.length && (
              <p className="rounded-xl border border-dashed border-black/10 px-3 py-3 text-center text-xs text-muted-foreground">
                No accepted friends are sharing yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
