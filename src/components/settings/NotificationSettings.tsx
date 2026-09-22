import Link from "next/link";

import { useSettingsStore } from "@/store/settings";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function NotificationSettings() {
  const { notifications, updateNotificationSettings } = useSettingsStore();

  return (
    <SettingsSection
      title="Email & reminders"
      description="See where reminders are set and manage your saved email choice."
    >
      <SettingRow
        label="Event reminders"
        description="Edit an event in Calendar to choose when its provider reminds you."
      >
        <Link
          href="/calendar"
          className="inline-block text-sm font-semibold text-primary underline underline-offset-2"
        >
          Open Calendar
        </Link>
      </SettingRow>

      <SettingRow
        label="Daily planning email"
        description="Sunnie does not send daily summary emails yet. Account messages, such as password resets, are separate."
      >
        {notifications.dailyEmailEnabled ? (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked
              onChange={() =>
                updateNotificationSettings({ dailyEmailEnabled: false })
              }
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <span>Keep my previously saved daily email preference on</span>
          </label>
        ) : (
          <p className="text-sm text-muted-foreground">
            Off. An opt-in will be offered if daily emails become available.
          </p>
        )}
      </SettingRow>
    </SettingsSection>
  );
}
