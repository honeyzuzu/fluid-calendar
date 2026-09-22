"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

import { DndProvider } from "@/components/dnd/DndProvider";
import { AppNav } from "@/components/navigation/AppNav";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { DailyRhythmPrompt } from "@/components/planning/DailyRhythmPrompt";
import { PresenceHeartbeat } from "@/components/providers/PresenceHeartbeat";
import { PrivacyProvider } from "@/components/providers/PrivacyProvider";
import { SetupCheck } from "@/components/setup/SetupCheck";
import { CommandPalette } from "@/components/ui/command-palette";
import { ShortcutsModal } from "@/components/ui/shortcuts-modal";
import { Toaster } from "@/components/ui/sonner";

import { isColorThemeId } from "@/lib/color-themes";
import { persistDisplayPreferences } from "@/lib/display-preferences";
import { ONBOARDING_TOUR_ENABLED } from "@/lib/onboarding";

import { usePageTitle } from "@/hooks/use-page-title";

import { useSettingsStore } from "@/store/settings";
import { useShortcutsStore } from "@/store/shortcuts";

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
  const { data: session } = useSession();
  const { isOpen: shortcutsOpen, setOpen: setShortcutsOpen } =
    useShortcutsStore();

  // Use the page title hook
  usePageTitle();

  const settingsIdentity =
    session?.user?.email || session?.user?.name || undefined;

  useEffect(() => {
    if (!settingsIdentity) return;
    const themeCacheKey = `sunnie-color-theme:${settingsIdentity}`;
    const cachedTheme = window.localStorage.getItem(themeCacheKey);
    if (isColorThemeId(cachedTheme)) {
      useSettingsStore.setState((state) => ({
        user: { ...state.user, colorTheme: cachedTheme },
      }));
      persistDisplayPreferences({ colorTheme: cachedTheme });
    }
    const controller = new AbortController();
    void fetch("/api/user-settings", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load user settings");
        return response.json();
      })
      .then((userSettings) => {
        if (userSettings.colorTheme) {
          window.localStorage.setItem(themeCacheKey, userSettings.colorTheme);
        }
        persistDisplayPreferences({
          colorTheme: userSettings.colorTheme,
          calendarStyle: userSettings.calendarStyle,
          motionPreference: userSettings.motionPreference,
        });
        useSettingsStore.setState((state) => ({
          initialized: true,
          user: { ...state.user, ...userSettings },
        }));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        console.error("Failed to hydrate user settings", error);
      });
    return () => controller.abort();
  }, [settingsIdentity]);

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
    <div className="sunnie-app sunnie-theme-app-pattern relative flex min-h-screen flex-col overflow-x-clip">
      <PresenceHeartbeat />
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
          <DailyRhythmPrompt />
          {ONBOARDING_TOUR_ENABLED && <OnboardingTour />}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed -left-24 top-28 z-0 h-56 w-56 rounded-full bg-[var(--sunnie-warm-glow)] opacity-10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed -right-24 top-44 z-0 h-72 w-72 rounded-full bg-[var(--sunnie-cool-glow)] opacity-15 blur-3xl"
          />
          <main className="relative z-[1] flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
            <NotificationProvider>{children}</NotificationProvider>
          </main>
          <Toaster />
        </DndProvider>
      </PrivacyProvider>
    </div>
  );
}
