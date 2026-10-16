/**
 * Shared domain types. These mirror the shape the future Firestore
 * collections are expected to have, so mock data can be swapped out
 * for real services without touching UI components.
 */

/** Materials the app understands. Only plastic bottles are accepted today. */
export type MaterialId = "plastic-bottle" | "aluminium-can" | "glass-bottle" | "paper";

export type RecyclingBin = {
  id: string;
  name: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  supportedMaterials: MaterialId[];
  /** Short area label, e.g. "Comoro, Dili". */
  area: string;
  description?: string;
  isActive: boolean;
  /** True only for illustrative entries that are not real bin locations. */
  isSample?: boolean;
};

export type SubmissionStatus = "pending" | "verified" | "needs-review" | "not-verified";

export type GeoPoint = {
  latitude: number;
  longitude: number;
  /** Accuracy radius in metres, when reported by the device. */
  accuracy?: number;
};

export type CheckOutcome = "pass" | "fail" | "uncertain";

export type VerificationCheckId = "gps-proximity" | "bottle-detected" | "hand-visible" | "bin-context";

export type VerificationCheck = {
  id: VerificationCheckId;
  outcome: CheckOutcome;
  detail: string;
};

export type VerificationResult = {
  status: Exclude<SubmissionStatus, "pending">;
  checks: VerificationCheck[];
  headline: string;
  explanation: string;
  /** Points this submission earns if verified. Awarded through the ledger, never directly. */
  points: number;
};

export type Submission = {
  id: string;
  binId: string;
  /** Snapshot of the bin's name/area when the report was made. */
  binName: string;
  binArea?: string;
  material: MaterialId;
  /** Bottles the user reported depositing. */
  bottleCount: number;
  /** Bottles the AI estimated in the photo, when available. */
  bottleCountEstimated?: number;
  createdAt: string; // ISO timestamp
  status: SubmissionStatus;
  /** Device location at capture time; omitted when the user disables saving it. */
  deviceLocation?: GeoPoint;
  /** Distance in metres between device and bin at capture time, when known. */
  distanceToBinMeters?: number;
  checks?: VerificationCheck[];
  explanation?: string;
  /** Points credited for this submission (1–3 if verified, otherwise 0). Set by the server only. */
  points: number;
  /** Whether a photo is stored for this submission. */
  hasPhoto: boolean;
};

export type LedgerEntry = {
  id: string;
  type: "earn" | "redeem" | "adjustment";
  points: number;
  createdAt: string;
  description: string;
  /** Each submission can credit points at most once. */
  submissionId?: string;
};

export type RewardCategory = "voucher" | "partner-offer" | "merchandise" | "community";

export type RewardStatus = "coming-soon" | "demo";

export type Reward = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: RewardCategory;
  pointsRequired: number;
  status: RewardStatus;
  /** Public image URL (Cloud Storage). */
  imageUrl: string;
  popular?: boolean;
  /** Always false until a real redemption backend exists. */
  redemptionEnabled: boolean;
  sortOrder?: number;
};

export type LanguageCode = "en" | "tet" | "pt" | "id";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  emailVerified: boolean;
  language: LanguageCode;
  bio: string;
  memberSince: string; // ISO date
  city: string;
  /** Appear (with first name + last initial only) on the public leaderboard. */
  showOnLeaderboard: boolean;
};

/** Public leaderboard row — deliberately minimal (no email, no full name). */
export type LeaderboardEntry = {
  rank: number;
  name: string;
  initials: string;
  points: number;
  bottles: number;
};

export type DistanceUnit = "km" | "mi";
export type DateFormat = "medium" | "dmy" | "iso";
export type TimeFormat = "24h" | "12h";

export type AppSettings = {
  language: LanguageCode;
  /** Only the light theme ships in the prototype. */
  theme: "light" | "dark";
  distanceUnit: DistanceUnit;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  notifications: {
    submissionUpdates: boolean;
    pointsAndRewards: boolean;
    nearbyBins: boolean;
    tips: boolean;
  };
  privacy: {
    useLocation: boolean;
    saveLocationWithSubmissions: boolean;
  };
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  kind: "success" | "info" | "warning";
};
