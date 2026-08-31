"use client";

import { useEffect, useState } from "react";

import dynamic from "next/dynamic";

import { DndProvider } from "@/components/dnd/DndProvider";
import { AppNav } from "@/components/navigation/AppNav";
import { VersionBadge } from "@/components/navigation/VersionBadge";
import { PrivacyProvider } from "@/components/providers/PrivacyProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SetupCheck } from "@/components/setup/SetupCheck";
import { CommandPalette } from "@/components/ui/command-palette";
import { ShortcutsModal } from "@/components/ui/shortcuts-modal";
import { Toaster } from "@/components/ui/sonner";

import { usePageTitle } from "@/hooks/use-page-title";

import { useShortcutsStore } from "@/store/shortcuts";

import "../globals.css";

// Dynamically import the NotificationProvider based on SAAS flag
const NotificationProvider = dynamic<{ children: React.ReactNode }>(
  () =>
    import(
      `@/components/providers/NotificationProvider${
        process.env.NEXT_PUBLIC_ENABLE_SAAS_FEATURES === "true"
          ? ".saas"
          : ".open"
      }`
    ).then((mod) => mod.NotificationProvider),
  {
    ssr: false,
    loading: () => <>{/* Render nothing while loading */}</>,
  }
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { isOpen: shortcutsOpen, setOpen: setShortcutsOpen } =
    useShortcutsStore();

  // Use the page title hook
  usePageTitle();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      } else if (e.key === "?" && !(e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setShortcutsOpen]);

  return (
    <div className="sunnie-app relative flex min-h-screen flex-col overflow-x-clip">
      <SessionProvider>
        <PrivacyProvider>
          <DndProvider>
            <SetupCheck />
            <CommandPalette
              open={commandPaletteOpen}
              onOpenChange={setCommandPaletteOpen}
            />
            <ShortcutsModal
              isOpen={shortcutsOpen}
              onClose={() => setShortcutsOpen(false)}
            />
            <AppNav />
            <div aria-hidden="true" className="pointer-events-none fixed -left-24 top-28 z-0 h-56 w-56 rounded-full bg-[#f8c95d]/10 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none fixed -right-24 top-44 z-0 h-72 w-72 rounded-full bg-[#b8d98b]/15 blur-3xl" />
            <main className="relative z-[1] flex-1">
              <NotificationProvider>{children}</NotificationProvider>
            </main>
            <footer className="relative z-[1] flex-none border-t border-[#dfe2c8] bg-[#f7f0d6]/90 px-4 py-2">
              <div className="flex justify-end">
                <VersionBadge />
              </div>
            </footer>
            <Toaster />
          </DndProvider>
        </PrivacyProvider>
      </SessionProvider>
    </div>
  );
}
