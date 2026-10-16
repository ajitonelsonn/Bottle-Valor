import type { AppSettings } from "@/lib/types";

/** Device-level preferences (kept in this browser, not in the database). */
export const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  theme: "light",
  distanceUnit: "km",
  dateFormat: "medium",
  timeFormat: "24h",
  notifications: {
    submissionUpdates: true,
    pointsAndRewards: true,
    nearbyBins: true,
    tips: false,
  },
  privacy: {
    useLocation: true,
    saveLocationWithSubmissions: true,
  },
};

/** Contributor levels, unlocked by lifetime points. */
export const LEVELS = [
  { id: "beginner", name: "Beginner", minPoints: 0, description: "Your recycling journey has started." },
  { id: "green-contributor", name: "Green Contributor", minPoints: 20, description: "You recycle regularly." },
  { id: "eco-champion", name: "Eco Champion", minPoints: 100, description: "A consistent recycler in your community." },
  { id: "recycle-leader", name: "Recycle Leader", minPoints: 250, description: "Leading the way to a cleaner Dili." },
] as const;

/** Rewards begin at this many points. */
export const MIN_REWARD_POINTS = 500;

/**
 * Email + password sign-in. Disabled until a verified email domain exists for
 * sending verification codes; Google sign-in works meanwhile. To re-enable,
 * set NEXT_PUBLIC_EMAIL_PASSWORD_AUTH=true AND enable the Email/Password
 * provider in Firebase Authentication.
 */
export const EMAIL_PASSWORD_AUTH_ENABLED = process.env.NEXT_PUBLIC_EMAIL_PASSWORD_AUTH === "true";

/** Default city label shown on profiles. */
export const DEFAULT_CITY = "Dili, Timor-Leste";
