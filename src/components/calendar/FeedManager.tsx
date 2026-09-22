import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import {
  MoreHorizontal,
  RefreshCw,
  Trash2,
  UsersRound,
} from "lucide-react";
import { BsGoogle, BsMicrosoft } from "react-icons/bs";
import { toast } from "sonner";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { resolveThemeLinkedColor } from "@/lib/color-themes";
import { getFriendCalendarColor } from "@/lib/friend-calendar-colors";
import { cn } from "@/lib/utils";

import { CalendarFeed } from "@/types/calendar";

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
  const { colorTheme } = useTheme();
  const friendColors = colorTheme.palettes.friends;
  const [syncingFeeds, setSyncingFeeds] = useState<Set<string>>(new Set());
  const [colorFeedId, setColorFeedId] = useState<string | null>(null);
  const [feedToRemove, setFeedToRemove] = useState<CalendarFeed | null>(null);
  const [isRemovingFeed, setIsRemovingFeed] = useState(false);
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

  const handleSyncFeed = useCallback(
    async (feedId: string) => {
      if (syncingFeeds.has(feedId)) return;

      try {
        setSyncingFeeds((prev) => new Set(prev).add(feedId));
        await syncFeed(feedId);
      } catch {
        toast.error("Could not refresh this calendar. Try again.");
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
              className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Checkbox
                  checked={feed.enabled}
                  onCheckedChange={() =>
                    void toggleFeed(feed.id).catch(() =>
                      toast.error("Could not change calendar visibility. Try again.")
                    )
                  }
                  aria-label={`Show ${feed.name} on Calendar`}
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
                        backgroundColor: resolveThemeLinkedColor(
                          "events",
                          feed.colorSlot,
                          feed.color,
                          colorTheme.id
                        ),
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
                      value={resolveThemeLinkedColor(
                        "events",
                        feed.colorSlot,
                        feed.color,
                        colorTheme.id
                      )}
                      valueSlot={feed.colorSlot}
                      onChange={(color, colorSlot) => {
                        if (color) {
                          setColorFeedId(null);
                          void updateFeed(feed.id, { color, colorSlot }).catch(
                            () =>
                              toast.error(
                                "That calendar color could not be saved, so Sunnie restored the previous color."
                              )
                          );
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <span className="calendar-name min-w-0 truncate text-sm font-medium text-foreground">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`More actions for ${feed.name}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[80] w-52">
                  <DropdownMenuItem
                    disabled={syncingFeeds.has(feed.id)}
                    onSelect={() => void handleSyncFeed(feed.id)}
                  >
                    <RefreshCw className="h-4 w-4" /> Refresh calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setFeedToRemove(feed)}
                  >
                    <Trash2 className="h-4 w-4" /> Remove from Sunnie
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {feeds.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/45 px-3 py-4 text-center">
              <p className="text-sm font-semibold text-foreground">
                No calendars connected yet
              </p>
              <Link
                href="/settings#accounts"
                className="mt-2 inline-flex rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                Connect a calendar
              </Link>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-medium text-foreground">
              <UsersRound className="h-4 w-4 text-primary" /> Friends&apos;
              shared time
            </h3>
            <Link
              href="/friends"
              className="text-xs font-semibold text-primary hover:underline"
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
                friendCalendarColors,
                "friend-1",
                colorTheme.id
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
                        className="h-5 w-5 shrink-0 rounded-full border-2 border-card shadow-sm ring-1 ring-border transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
                        style={{ backgroundColor: friendColor }}
                        title={`Change ${connection.friend.name || connection.friend.email || "friend"}'s calendar color`}
                        aria-label={`Change ${connection.friend.name || connection.friend.email || "friend"}'s calendar color`}
                      />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64">
                      <p className="text-sm font-semibold text-foreground">
                        {colorTheme.paletteNames.friends}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Friend colors · every shared block from this friend uses
                        the same color.
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {friendColors.map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() =>
                              setFriendCalendarColor(
                                connection.friend.id,
                                color.id
                              )
                            }
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl p-2 text-[10px] text-muted-foreground transition hover:bg-muted",
                              friendColor === color.value &&
                                "bg-muted font-semibold text-foreground ring-1 ring-primary/45"
                            )}
                            title={color.name}
                          >
                            <span
                              className="h-7 w-7 rounded-full border border-border shadow-sm"
                              style={{ backgroundColor: color.value }}
                            />
                            <span className="leading-tight">{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${connection.friend.online ? "bg-success shadow-[0_0_0_2px_hsl(var(--success)/0.2)]" : "bg-muted-foreground/60"}`}
                    title={connection.friend.online ? "Online now" : "Offline"}
                    aria-label={
                      connection.friend.online ? "Online now" : "Offline"
                    }
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                    {connection.friend.name ||
                      connection.friend.email ||
                      "Friend"}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
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
              <p className="rounded-xl border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
                No accepted friends are sharing yet.
              </p>
            )}
          </div>
        </div>
      </div>
      <Dialog
        open={!!feedToRemove}
        onOpenChange={(open) => !open && !isRemovingFeed && setFeedToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {feedToRemove?.name}?</DialogTitle>
            <DialogDescription>
              Sunnie will stop showing this calendar and remove its local event
              copies. The original calendar at your provider will stay as it is.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              type="button"
              disabled={isRemovingFeed}
              onClick={() => setFeedToRemove(null)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
            >
              Keep calendar
            </button>
            <button
              type="button"
              disabled={isRemovingFeed}
              onClick={async () => {
                if (!feedToRemove) return;
                setIsRemovingFeed(true);
                try {
                  await removeFeed(feedToRemove.id);
                  setFeedToRemove(null);
                } catch {
                  toast.error("Could not remove this calendar from Sunnie. Try again.");
                } finally {
                  setIsRemovingFeed(false);
                }
              }}
              className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
            >
              {isRemovingFeed ? "Removing…" : "Remove calendar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
