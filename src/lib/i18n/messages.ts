/**
 * Shared UI labels. Only English is shipped in this prototype; adding a
 * language means adding another dictionary with the same keys.
 */
import type { LanguageCode, RewardCategory, SubmissionStatus, VerificationCheckId } from "@/lib/types";

export const LANGUAGES: { code: LanguageCode; label: string; short: string; available: boolean }[] = [
  { code: "en", label: "English", short: "EN", available: true },
  { code: "tet", label: "Tetun", short: "TET", available: false },
  { code: "pt", label: "Português", short: "PT", available: false },
  { code: "id", label: "Bahasa Indonesia", short: "ID", available: false },
];

export const en = {
  brand: {
    name: "BotleValor",
    tagline: "Recycle Today. Earn Tomorrow.",
    motto: "A Cleaner Dili, A Brighter Tomorrow.",
  },
  nav: {
    dashboard: "Dashboard",
    bins: "Find Bins",
    recycle: "Recycle Now",
    history: "History",
    rewards: "Rewards",
    profile: "Profile",
    settings: "Settings",
    home: "Home",
  },
  status: {
    pending: "Pending",
    verified: "Verified",
    "needs-review": "Needs review",
    "not-verified": "Not verified",
  } satisfies Record<SubmissionStatus, string>,
  checks: {
    "gps-proximity": "GPS near selected bin",
    "bottle-detected": "Plastic bottle detected",
    "hand-visible": "Hand visible",
    "bin-context": "Recycling bin in frame",
  } satisfies Record<VerificationCheckId, string>,
  rewardCategories: {
    voucher: "Vouchers",
    "partner-offer": "Partner offers",
    merchandise: "Merchandise",
    community: "Community",
  } satisfies Record<RewardCategory, string>,
  demo: {
    data: "Demo data",
    dataLong: "Values shown are sample data for this prototype — not real points or activity.",
  },
} as const;

export type Messages = typeof en;

/** Returns the dictionary for a language, falling back to English. */
export function getMessages(language: LanguageCode = "en"): Messages {
  void language;
  return en;
}

export const t = en;
