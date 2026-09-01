export const FOCUS_PREFERENCES_KEY = "sunnie-focus-companion-v1";
export const FOCUS_REWARD_EVENT = "sunnie-focus-reward";

export interface FocusRewardDetail {
  sunDrops: number;
  amount: number;
}

export function completionEarnsSunDrop(
  previousStatus: string | undefined,
  nextStatus: string | undefined
): boolean {
  return (
    Boolean(previousStatus) &&
    previousStatus !== "completed" &&
    nextStatus === "completed"
  );
}

export function addSunDropsToPreferences(
  storedPreferences: string | null,
  amount = 1
): { serialized: string; sunDrops: number } {
  let preferences: Record<string, unknown> = {};

  try {
    const parsed = storedPreferences ? JSON.parse(storedPreferences) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      preferences = parsed as Record<string, unknown>;
    }
  } catch {
    // A damaged preference should not prevent the user from earning a reward.
  }

  const current =
    typeof preferences.sunDrops === "number" &&
    Number.isFinite(preferences.sunDrops)
      ? Math.max(0, preferences.sunDrops)
      : 0;
  const safeAmount = Math.max(0, Math.floor(amount));
  const sunDrops = current + safeAmount;

  return {
    serialized: JSON.stringify({ ...preferences, sunDrops }),
    sunDrops,
  };
}

export function awardSunDrops(amount = 1): number | null {
  if (typeof window === "undefined") return null;

  try {
    const reward = addSunDropsToPreferences(
      window.localStorage.getItem(FOCUS_PREFERENCES_KEY),
      amount
    );
    window.localStorage.setItem(FOCUS_PREFERENCES_KEY, reward.serialized);
    window.dispatchEvent(
      new CustomEvent<FocusRewardDetail>(FOCUS_REWARD_EVENT, {
        detail: { sunDrops: reward.sunDrops, amount: Math.max(0, amount) },
      })
    );
    return reward.sunDrops;
  } catch {
    return null;
  }
}
