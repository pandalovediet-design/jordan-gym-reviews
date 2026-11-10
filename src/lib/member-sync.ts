// Client-side rules for syncing member data that also lives in localStorage.
//
// Data a visitor saved on this device before signing in is merged into their
// account once. After that the account is the source of truth, so items removed
// on another device do not come back, and data that belongs to a different
// account that used this device is never uploaded to the current one.

const OWNER_PREFIX = "gymjo:sync-owner:";

export type MemberDataset = "favorites" | "workouts" | "challenges" | "food";

/** "merge" = upload this device's anonymous data once; "replace" = take the account's data as is. */
export function claimLocalData(dataset: MemberDataset, userId: string): "merge" | "replace" {
  try {
    const key = OWNER_PREFIX + dataset;
    const owner = localStorage.getItem(key);
    localStorage.setItem(key, userId);
    return owner === null ? "merge" : "replace";
  } catch {
    return "replace";
  }
}

/** Local keys that hold a signed-in member's copy of their data. */
const MEMBER_KEYS = ["jgr:favs", "jgr:log-v1", "gymjo-challenge-progress-v1", "gymjo:food-v1", "gymjo:water-v1"];

/** Called on sign-out so the next person on a shared device does not see this account's data. */
export function clearMemberLocalData() {
  try {
    const datasets = ["favorites", "workouts", "challenges", "food"] as const;
    if (!datasets.some((d) => localStorage.getItem(OWNER_PREFIX + d) !== null)) return;
    for (const d of datasets) localStorage.removeItem(OWNER_PREFIX + d);
    for (const key of MEMBER_KEYS) localStorage.removeItem(key);
    window.dispatchEvent(new Event("jgr:favs-change"));
    window.dispatchEvent(new Event("jgr:log-change"));
    window.dispatchEvent(new Event("gymjo:food-change"));
  } catch {
    // Storage can be blocked; nothing to clear in that case.
  }
}

/** Monday of the current week in the visitor's local calendar, as YYYY-MM-DD. */
export function localWeekStart(now = new Date()): string {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return [start.getFullYear(), String(start.getMonth() + 1).padStart(2, "0"), String(start.getDate()).padStart(2, "0")].join("-");
}
