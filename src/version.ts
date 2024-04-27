// to get around the headache of semver comparisons, mapping version numbers
// to the order in which they're released
export const VERSION_MAP = {
  "1.0.0": 1,
  "2.0.0": 2,
  "2.0.1": 3,
  "2.1.0": 4,
} as const;
export const SEMVER_VERSION: keyof typeof VERSION_MAP = "2.1.0";
export const INT_VERSION = VERSION_MAP[SEMVER_VERSION];
export const LOCAL_STORAGE_VERSION_KEY = "lastVersionViewed" as const;

export const storeLastVersionViewed = () => {
  const lastVersionViewed = localStorage.getItem(LOCAL_STORAGE_VERSION_KEY);
  localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, INT_VERSION.toString());
  return lastVersionViewed;
};
