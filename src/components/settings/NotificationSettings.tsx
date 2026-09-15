import { useSettingsStore } from "@/store/settings";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function NotificationSettings() {
  const { notifications, updateNotificationSettings } = useSettingsStore();

  return (
    <SettingsSection
      title="Notification Settings"
      description="Configure your notification preferences."
    >
      <SettingRow
        label="Daily Email Updates"
        description="Optional: receive one morning email summarizing upcoming meetings and tasks. Transactional account messages stay separate."
      >
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={notifications.dailyEmailEnabled}
              onChange={(e) =>
                updateNotificationSettings({
                  dailyEmailEnabled: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="ml-2 text-sm">
              Send me the optional daily planning email
            </span>
          </label>
        </div>
      </SettingRow>
    </SettingsSection>
  );
}
