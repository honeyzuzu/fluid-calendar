import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import { CalendarDays, ChevronDown, Globe2 } from "lucide-react";
import { BsApple, BsGoogle } from "react-icons/bs";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { logger } from "@/lib/logger";

import { useCalendarStore } from "@/store/calendar";
import { useSettingsStore } from "@/store/settings";

import { AvailableCalendars } from "./AvailableCalendars";
import { CalDAVAccountForm } from "./CalDAVAccountForm";

const LOG_SOURCE = "AccountManager";

interface IntegrationStatus {
  google: { configured: boolean };
}

type CalDAVMode = "apple" | "generic";

export function AccountManager() {
  const { accounts, refreshAccounts, removeAccount } = useSettingsStore();
  const [showAvailableFor, setShowAvailableFor] = useState<string | null>(null);
  const [calDAVMode, setCalDAVMode] = useState<CalDAVMode | null>(null);
  const [accountToRemove, setAccountToRemove] = useState<string | null>(null);
  const [removingAccount, setRemovingAccount] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>(
    {
      google: { configured: false },
    }
  );
  const [isLoading, setIsLoading] = useState(true);
  const calDAVTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    void refreshAccounts().catch(() =>
      toast.error(
        "Could not load connected accounts. Reload Settings to try again."
      )
    );
  }, [refreshAccounts]);

  useEffect(() => {
    // Fetch integration status
    fetch("/api/integration-status")
      .then((res) => {
        if (!res.ok) throw new Error(`Status request failed (${res.status})`);
        return res.json() as Promise<IntegrationStatus>;
      })
      .then((data) => {
        setIntegrationStatus(data);
        setIsLoading(false);
      })
      .catch((error) => {
        logger.error(
          "Failed to fetch integration status",
          { error: error instanceof Error ? error.message : "Unknown error" },
          LOG_SOURCE
        );
        setStatusError(true);
        setIsLoading(false);
      });
  }, []);

  const handleGoogleConnect = () => {
    window.location.href = `/api/calendar/google/auth`;
  };

  const handleRemove = async () => {
    if (!accountToRemove || removingAccount) return;
    setRemovingAccount(true);
    try {
      await removeAccount(accountToRemove);
      setShowAvailableFor((current) =>
        current === accountToRemove ? null : current
      );
      setAccountToRemove(null);
      toast.success(
        "Account removed from Sunnie. Your provider calendar is unchanged."
      );
      void useCalendarStore
        .getState()
        .loadFromDatabase()
        .catch(() => undefined);
    } catch {
      toast.error("Could not remove this account. Try again.");
    } finally {
      setRemovingAccount(false);
    }
  };

  const toggleAvailableCalendars = useCallback((accountId: string) => {
    setShowAvailableFor((current) =>
      current === accountId ? null : accountId
    );
  }, []);

  const handleCalDAVSuccess = (accountId: string) => {
    closeCalDAVForm();
    setShowAvailableFor(accountId);
    void refreshAccounts().catch(() =>
      toast.error(
        "Account connected, but the list could not refresh. Reload Settings to choose calendars."
      )
    );
  };

  const openCalDAVForm = (mode: CalDAVMode, trigger: HTMLButtonElement) => {
    calDAVTriggerRef.current = trigger;
    setCalDAVMode(mode);
  };

  const closeCalDAVForm = () => {
    setCalDAVMode(null);
    window.requestAnimationFrame(() => calDAVTriggerRef.current?.focus());
  };

  const visibleAccounts = accounts.filter(
    (account) => account.provider !== "OUTLOOK"
  );
  const selectedAccount = visibleAccounts.find(
    (account) => account.id === accountToRemove
  );

  return (
    <div className="min-w-0 space-y-7">
      <section
        aria-labelledby="connect-calendars-heading"
        className="space-y-4"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Connections
          </p>
          <h2
            id="connect-calendars-heading"
            className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
          >
            Connect a calendar
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Bring your meetings into Sunnie. Connect an account, choose its
            calendars, then see them on Calendar. Your original calendars stay
            with their provider.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-paper)]">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <BsGoogle className="h-4 w-4" aria-hidden="true" /> Google
              Calendar
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              Sign in with Google. Your calendars appear in Sunnie
              automatically.
            </p>
            {isLoading ? (
              <p role="status" className="mt-4 text-xs text-muted-foreground">
                Checking availability…
              </p>
            ) : integrationStatus.google.configured ? (
              <Button className="mt-4 w-full" onClick={handleGoogleConnect}>
                Connect Google
              </Button>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                {statusError
                  ? "Availability could not be checked. Reload Settings to try again."
                  : "Google connection is unavailable here. Ask your Sunnie host."}
              </p>
            )}
          </div>
          <div className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-paper)]">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <BsApple className="h-4 w-4" aria-hidden="true" /> Apple Calendar
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              Use an Apple app-specific password, then choose which calendars to
              add.
            </p>
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={(event) => openCalDAVForm("apple", event.currentTarget)}
            >
              Connect Apple
            </Button>
          </div>
          <div className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-paper)]">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Globe2 className="h-4 w-4" aria-hidden="true" /> Other calendar
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              Connect Fastmail, Nextcloud, or another CalDAV calendar server.
            </p>
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={(event) =>
                openCalDAVForm("generic", event.currentTarget)
              }
            >
              Connect CalDAV
            </Button>
          </div>
        </div>

        {calDAVMode && (
          <CalDAVAccountForm
            key={calDAVMode}
            preset={calDAVMode}
            onSuccess={handleCalDAVSuccess}
            onCancel={closeCalDAVForm}
          />
        )}
      </section>

      <section
        aria-labelledby="connected-calendars-heading"
        className="space-y-3"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="connected-calendars-heading"
              className="text-xl font-semibold text-foreground"
            >
              Your connections
            </h2>
            <p className="text-sm text-muted-foreground">
              {visibleAccounts.length === 0
                ? "No calendar accounts connected yet."
                : `${visibleAccounts.length} connected ${visibleAccounts.length === 1 ? "account" : "accounts"}`}
            </p>
          </div>
          {visibleAccounts.length > 0 && (
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" /> View
              Calendar
            </Link>
          )}
        </div>

        {visibleAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-6 text-sm text-muted-foreground">
            Choose a provider above to start seeing your meetings in Sunnie.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAccounts.map((account) => {
              const expanded = showAvailableFor === account.id;
              const label =
                account.provider === "CALDAV" &&
                account.caldavUrl?.includes("icloud.com")
                  ? "Apple"
                  : account.provider === "GOOGLE"
                    ? "Google"
                    : "CalDAV";
              return (
                <div
                  key={account.id}
                  className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-paper)]"
                >
                  <div className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Badge variant="outline">{label}</Badge>
                        <span className="min-w-0 break-words text-sm font-semibold text-foreground">
                          {account.email}
                        </span>
                      </div>
                      {account.caldavUrl && (
                        <p
                          className="mt-1 truncate text-xs text-muted-foreground"
                          title={account.caldavUrl}
                        >
                          {account.caldavUrl}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {account.calendars.length === 0
                          ? "Choose calendars to finish setup"
                          : `${account.calendars.length} ${account.calendars.length === 1 ? "calendar" : "calendars"} added`}
                      </p>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                      <Button
                        size="sm"
                        variant={
                          account.calendars.length === 0 ? "default" : "outline"
                        }
                        onClick={() => toggleAvailableCalendars(account.id)}
                        aria-expanded={expanded}
                        aria-controls={`available-calendars-${account.id}`}
                      >
                        Choose calendars
                        <ChevronDown
                          className={`ml-1 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setAccountToRemove(account.id)}
                      >
                        Remove account
                      </Button>
                    </div>
                  </div>
                  {expanded && (
                    <div
                      id={`available-calendars-${account.id}`}
                      className="border-t border-border bg-muted/20 p-4"
                    >
                      <AvailableCalendars
                        accountId={account.id}
                        provider={account.provider}
                        onCalendarAdded={() => {
                          void refreshAccounts().catch(() =>
                            toast.error(
                              "Calendar added, but the account list could not refresh. Reload Settings to see it."
                            )
                          );
                          void useCalendarStore
                            .getState()
                            .loadFromDatabase()
                            .catch(() => undefined);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Dialog
        open={accountToRemove !== null}
        onOpenChange={(open) =>
          !open && !removingAccount && setAccountToRemove(null)
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Remove {selectedAccount?.email || "this account"}?
            </DialogTitle>
            <DialogDescription>
              Sunnie will remove this connection and its imported calendar
              copies. The original calendars at your provider will stay
              unchanged. Any task sync linked to this account may need to be
              reconnected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={removingAccount}
              onClick={() => setAccountToRemove(null)}
            >
              Keep account
            </Button>
            <Button
              variant="destructive"
              disabled={removingAccount}
              onClick={() => void handleRemove()}
            >
              {removingAccount ? "Removing…" : "Remove from Sunnie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
