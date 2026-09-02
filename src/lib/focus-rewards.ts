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

function cacheAndAnnounceSunDrops(sunDrops: number, amount: number) {
  if (typeof window === "undefined") return null;

  try {
    const current = window.localStorage.getItem(FOCUS_PREFERENCES_KEY);
    const reward = addSunDropsToPreferences(current, 0);
    const preferences = JSON.parse(reward.serialized) as Record<
      string,
      unknown
    >;
    window.localStorage.setItem(
      FOCUS_PREFERENCES_KEY,
      JSON.stringify({ ...preferences, sunDrops })
    );
    window.dispatchEvent(
      new CustomEvent<FocusRewardDetail>(FOCUS_REWARD_EVENT, {
        detail: { sunDrops, amount: Math.max(0, amount) },
      })
    );
    return sunDrops;
  } catch {
    return null;
  }
}

export async function loadSunDrops(localMinimum = 0): Promise<number | null> {
  if (typeof window === "undefined") return null;

  try {
    let response = await fetch("/api/focus-rewards", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load sun drops");
    let reward = (await response.json()) as { sunDrops: number };

    if (localMinimum > reward.sunDrops) {
      response = await fetch("/api/focus-rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minimum: localMinimum }),
      });
      if (!response.ok) throw new Error("Unable to migrate sun drops");
      reward = (await response.json()) as { sunDrops: number };
    }

    return cacheAndAnnounceSunDrops(reward.sunDrops, 0);
  } catch {
    const cached = addSunDropsToPreferences(
      window.localStorage.getItem(FOCUS_PREFERENCES_KEY),
      0
    ).sunDrops;
    return cacheAndAnnounceSunDrops(
      Math.max(cached, Math.max(0, localMinimum)),
      0
    );
  }
}

export async function awardSunDrops(amount = 1): Promise<number | null> {
  if (typeof window === "undefined") return null;
  const safeAmount = Math.max(1, Math.min(10, Math.floor(amount)));

  try {
    const response = await fetch("/api/focus-rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: safeAmount }),
    });
    if (!response.ok) throw new Error("Unable to save sun drops");
    const reward = (await response.json()) as { sunDrops: number };
    return cacheAndAnnounceSunDrops(reward.sunDrops, safeAmount);
  } catch {
    const reward = addSunDropsToPreferences(
      window.localStorage.getItem(FOCUS_PREFERENCES_KEY),
      safeAmount
    );
    window.localStorage.setItem(FOCUS_PREFERENCES_KEY, reward.serialized);
    window.dispatchEvent(
      new CustomEvent<FocusRewardDetail>(FOCUS_REWARD_EVENT, {
        detail: { sunDrops: reward.sunDrops, amount: safeAmount },
      })
    );
    return reward.sunDrops;
  }
}
