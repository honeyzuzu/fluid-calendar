"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BsListTask, BsCalendar } from "react-icons/bs";
import { HiOutlineLightBulb, HiOutlineSearch, HiOutlineSparkles, HiOutlineUserGroup } from "react-icons/hi";
import { RiKeyboardLine } from "react-icons/ri";

import { cn } from "@/lib/utils";
import { SunnieSun } from "@/components/brand/SunnieSun";

import { useShortcutsStore } from "@/store/shortcuts";

import { UserMenu } from "./UserMenu";

interface AppNavProps {
  className?: string;
}

export function AppNav({ className }: AppNavProps) {
  const pathname = usePathname();
  const { setOpen: setShortcutsOpen } = useShortcutsStore();

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
    { href: "/plan", label: "Plan", icon: HiOutlineSparkles },
    { href: "/calendar", label: "Calendar", icon: BsCalendar },
    { href: "/tasks", label: "Tasks", icon: BsListTask },
    { href: "/friends", label: "Friends", icon: HiOutlineUserGroup },
    { href: "/focus", label: "Focus", icon: HiOutlineLightBulb },
  ];

  return (
    <nav
      className={cn(
        "relative z-10 min-h-16 flex-none border-b border-[#dfe2c8] bg-[#fff9e8]/95 shadow-[0_3px_18px_rgba(95,103,64,0.06)] backdrop-blur-md",
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
                pathname === "/calendar" ? "text-primary" : "text-foreground hover:text-primary"
              )}
            >
              <SunnieSun className="h-9 w-9" />
              <span className="hidden text-sm font-semibold tracking-tight xl:inline">Sunnie Planner</span>
            </Link>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold xl:px-3.5",
                    isActive
                      ? "bg-[#f8e4a1] text-[#77591d] shadow-sm"
                      : "text-[#626849] hover:bg-[#eef3df] hover:text-[#4f5d39]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={openCommandPalette}
              className="hidden items-center gap-1 rounded-xl px-2 py-1.5 text-xs text-[#74785f] hover:bg-[#eef3df] hover:text-[#4f5d39] xl:flex"
              title="Search or run a command (⌘K)"
            >
              <HiOutlineSearch className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-1 hidden rounded bg-muted px-1 py-0.5 text-xs sm:inline">
                ⌘K
              </kbd>
            </button>
            <button
              onClick={() => setShortcutsOpen(true)}
              className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs text-[#74785f] hover:bg-[#eef3df] hover:text-[#4f5d39]"
              title="View Keyboard Shortcuts (Press ?)"
            >
              <RiKeyboardLine className="h-4 w-4" />
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
  );
}
