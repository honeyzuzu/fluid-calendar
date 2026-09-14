import { useSession } from "next-auth/react";

import { BsGoogle } from "react-icons/bs";

import { useSettingsStore } from "@/store/settings";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function IntegrationSettings() {
  const { data: session } = useSession();
  const { integrations, updateIntegrationSettings } = useSettingsStore();

  return (
    <SettingsSection
      title="Integration Settings"
      description="Manage your calendar integrations and synchronization settings."
    >
      <SettingRow
        label="Google Calendar"
        description="Configure your Google Calendar integration"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BsGoogle className="h-6 w-6 text-muted-foreground" />
              <div>
                <div className="font-medium">Google Calendar</div>
                <div className="text-sm text-muted-foreground">
                  {session?.user?.email || "Not connected"}
                </div>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={integrations.googleCalendar.enabled}
                onChange={(e) =>
                  updateIntegrationSettings({
                    googleCalendar: {
                      ...integrations.googleCalendar,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-card after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-card peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring/30"></div>
            </label>
          </div>

          {integrations.googleCalendar.enabled && (
            <>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={integrations.googleCalendar.autoSync}
                  onChange={(e) =>
                    updateIntegrationSettings({
                      googleCalendar: {
                        ...integrations.googleCalendar,
                        autoSync: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                />
                <span className="ml-2 text-sm">Enable auto-sync</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Sync Interval (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={integrations.googleCalendar.syncInterval}
                  onChange={(e) =>
                    updateIntegrationSettings({
                      googleCalendar: {
                        ...integrations.googleCalendar,
                        syncInterval: Number(e.target.value),
                      },
                    })
                  }
                  className="mt-1 block w-full rounded-xl border-border bg-card shadow-sm focus:border-primary focus:ring-ring sm:text-sm"
                />
              </div>
            </>
          )}
        </div>
      </SettingRow>
    </SettingsSection>
  );
}
