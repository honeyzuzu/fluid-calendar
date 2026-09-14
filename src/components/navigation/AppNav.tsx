"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarDays,
  Keyboard,
  Lightbulb,
  ListTodo,
  MoreHorizontal,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { SunnieSun } from "@/components/brand/SunnieSun";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

import { usePendingFriendRequests } from "@/hooks/usePendingFriendRequests";

import { useShortcutsStore } from "@/store/shortcuts";

import { UserMenu } from "./UserMenu";

interface AppNavProps {
  className?: string;
}

export function AppNav({ className }: AppNavProps) {
  const pathname = usePathname();
  const { setOpen: setShortcutsOpen } = useShortcutsStore();
  const hasPendingFriendRequest = usePendingFriendRequests();

  // Function to trigger command palette
  const openCommandPalette = () => {
    // Simulate Cmd+K / Ctrl+K
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  const links = [
    {
      href: "/plan",
      label: "Plan",
      mobileLabel: "Plan",
      icon: Sparkles,
    },
    {
      href: "/calendar",
      label: "Calendar",
      mobileLabel: "Calendar",
      icon: CalendarDays,
    },
    { href: "/tasks", label: "Tasks", mobileLabel: "Tasks", icon: ListTodo },
    {
      href: "/focus",
      label: "Focus",
      mobileLabel: "Focus",
      icon: Lightbulb,
    },
  ];
  const moreLinks = [{ href: "/friends", label: "Friends", icon: UsersRound }];
  const moreIsActive = moreLinks.some((link) => pathname === link.href);

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className={cn(
          "relative z-10 min-h-16 flex-none border-b border-border bg-card/90 shadow-[var(--shadow-paper)] backdrop-blur-md",
          className
        )}
      >
        <div className="h-full px-3 sm:px-4">
          <div className="flex min-h-16 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1 xl:gap-3">
              <Link
                href="/calendar"
                className={cn(
                  "mr-2 flex shrink-0 items-center gap-2 xl:mr-4",
                  pathname === "/calendar"
                    ? "text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                <SunnieSun className="h-9 w-9" />
                <span className="hidden text-sm font-semibold tracking-tight sm:inline lg:hidden xl:inline">
                  Sunnie
                  <span className="hidden xl:inline"> Planner</span>
                </span>
              </Link>
              <div className="hidden items-center gap-1 lg:flex xl:gap-3">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "inline-flex min-h-10 items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold transition-[background-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:px-3.5",
                        isActive
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "text-secondary-foreground hover:bg-muted hover:text-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="relative">
                        <Icon className="h-4 w-4" />
                        {link.href === "/friends" &&
                          hasPendingFriendRequest && (
                            <span
                              aria-label="Pending friend request"
                              className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-destructive"
                            />
                          )}
                      </span>
                      <span className="hidden xl:inline">{link.label}</span>
                    </Link>
                  );
                })}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Open more destinations"
                      className={cn(
                        "inline-flex min-h-10 items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:px-3.5",
                        moreIsActive
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "text-secondary-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className="relative">
                        <MoreHorizontal className="h-4 w-4" />
                        {hasPendingFriendRequest && (
                          <span
                            aria-label="Pending friend request"
                            className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-destructive"
                          />
                        )}
                      </span>
                      <span className="hidden xl:inline">More</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {moreLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <DropdownMenuItem key={link.href} asChild>
                          <Link href={link.href} className="cursor-pointer">
                            <Icon className="mr-2 h-4 w-4" />
                            {link.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Search or run a command"
                onClick={openCommandPalette}
                className="hidden min-h-10 items-center gap-1 rounded-xl px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
                title="Search or run a command (⌘K)"
              >
                <Search className="h-4 w-4" />
                <span className="hidden xl:inline">Search</span>
                <kbd className="ml-1 hidden rounded bg-muted px-1 py-0.5 text-xs sm:inline">
                  ⌘K
                </kbd>
              </button>
              <button
                type="button"
                aria-label="View keyboard shortcuts"
                onClick={() => setShortcutsOpen(true)}
                className="flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="View Keyboard Shortcuts (Press ?)"
              >
                <Keyboard className="h-4 w-4" />
                <span className="hidden xl:inline">Shortcuts</span>
                <kbd className="ml-1 hidden rounded bg-muted px-1 py-0.5 text-xs sm:inline">
                  ?
                </kbd>
              </button>
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 grid h-[calc(5rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur-md lg:hidden"
      >
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                isActive
                  ? "text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "grid h-9 w-11 place-items-center rounded-xl",
                  isActive && "bg-accent shadow-sm"
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {link.href === "/friends" && hasPendingFriendRequest && (
                    <span
                      aria-label="Pending friend request"
                      className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-destructive"
                    />
                  )}
                </span>
              </span>
              <span className="max-w-full truncate">{link.mobileLabel}</span>
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open more destinations"
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-1 text-[11px] font-semibold",
                moreIsActive
                  ? "text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-11 place-items-center rounded-xl",
                  moreIsActive && "bg-accent shadow-sm"
                )}
              >
                <span className="relative">
                  <MoreHorizontal className="h-5 w-5" />
                  {hasPendingFriendRequest && (
                    <span
                      aria-label="Pending friend request"
                      className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-destructive"
                    />
                  )}
                </span>
              </span>
              <span>More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="mb-2 w-52">
            {moreLinks.map((link) => {
              const Icon = link.icon;
              return (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href} className="cursor-pointer py-3">
                    <Icon className="mr-2 h-4 w-4" />
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </>
  );
}
