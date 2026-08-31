import { useCallback, useEffect, useState } from "react";

import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { logger } from "@/lib/logger";

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
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>(
    {
      google: { configured: false },
    }
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  useEffect(() => {
    // Fetch integration status
    fetch("/api/integration-status")
      .then((res) => res.json())
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
        setIsLoading(false);
      });
  }, []);

  const handleGoogleConnect = () => {
    window.location.href = `/api/calendar/google/auth`;
  };

  const handleRemove = async (accountId: string) => {
    try {
      await removeAccount(accountId);
    } catch (error) {
      console.error("Failed to remove account:", error);
    }
  };

  const toggleAvailableCalendars = useCallback((accountId: string) => {
    setShowAvailableFor((current) =>
      current === accountId ? null : accountId
    );
  }, []);

  const handleCalDAVSuccess = () => {
    setCalDAVMode(null);
    refreshAccounts();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your connected calendar accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!integrationStatus.google.configured && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Missing Google Credentials</AlertTitle>
              <AlertDescription>
                Please contact your administrator to configure Google Calendar
                integration.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleGoogleConnect}
              disabled={!integrationStatus.google.configured || isLoading}
            >
              Connect Google Calendar
            </Button>
            <Button onClick={() => setCalDAVMode("apple")}>
              Connect Apple Calendar
            </Button>
            <Button onClick={() => setCalDAVMode("generic")} variant="outline">
              Other calendar (CalDAV)
            </Button>
          </div>

          {calDAVMode && (
            <Card>
              <CardContent className="pt-6">
                <CalDAVAccountForm
                  preset={calDAVMode}
                  onSuccess={handleCalDAVSuccess}
                  onCancel={() => setCalDAVMode(null)}
                />
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {accounts
              ?.filter((account) => account.provider !== "OUTLOOK")
              .map((account) => (
                <div key={account.id} className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              account.provider === "GOOGLE"
                                ? "default"
                                : account.provider === "OUTLOOK"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="capitalize"
                          >
                            {account.provider === "CALDAV" &&
                            account.caldavUrl?.includes("icloud.com")
                              ? "apple"
                              : account.provider.toLowerCase()}
                          </Badge>
                          <span className="text-sm font-medium">
                            {account.email}
                          </span>
                          {account.provider === "CALDAV" &&
                            account.caldavUrl && (
                              <span
                                className="text-muted-foreground max-w-full truncate text-xs"
                                title={account.caldavUrl}
                              >
                                {account.caldavUrl}
                              </span>
                            )}
                          <Badge variant="outline" className="text-xs">
                            {account.calendars.length} calendars
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAvailableCalendars(account.id)}
                          >
                            {showAvailableFor === account.id ? "Hide" : "Show"}{" "}
                            Calendars
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemove(account.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {showAvailableFor === account.id && (
                    <Card>
                      <CardContent className="pt-6">
                        <AvailableCalendars
                          accountId={account.id}
                          provider={account.provider}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
