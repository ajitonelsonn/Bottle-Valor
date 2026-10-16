"use client";

import { useSyncExternalStore } from "react";
import { onIdTokenChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { apiFetch } from "@/lib/api/client";
import { DEFAULT_CITY, DEFAULT_SETTINGS } from "@/lib/config";
import { firebaseAuth } from "@/lib/firebase/client";
import type { AppSettings, GeoPoint, LedgerEntry, Submission, UserProfile } from "@/lib/types";

/**
 * Client state for the signed-in user. Identity comes from Firebase
 * Authentication; profile, submissions and the points ledger come from the
 * server API (Cloud Firestore). Nothing here is mock data. Only device
 * preferences (settings, selected bin, read notifications) are kept in
 * localStorage.
 */

export type Session =
  | { status: "signed-out" }
  | { status: "pending-verification"; email: string }
  | { status: "signed-in"; email: string };

/** A captured photo waiting to be submitted (memory only, never persisted). */
export type PendingCapture = {
  requestId: string;
  binId: string;
  bottleCount: number;
  location: GeoPoint;
  photo: Blob;
  photoUrl: string;
};

export type AppState = {
  /** Auth state known and (when signed in) the account has loaded or failed. */
  hydrated: boolean;
  session: Session;
  profile: UserProfile;
  submissions: Submission[];
  ledger: LedgerEntry[];
  accountError: string | null;
  settings: AppSettings;
  selectedBinId: string | null;
  activeSubmissionId: string | null;
  readNotificationIds: string[];
};

const PREFS_KEY = "botlevalor.prefs.v1";

const EMPTY_PROFILE: UserProfile = {
  uid: "",
  name: "",
  email: "",
  emailVerified: false,
  language: "en",
  bio: "",
  memberSince: new Date(0).toISOString(),
  city: DEFAULT_CITY,
  showOnLeaderboard: true,
};

const BASE: AppState = {
  hydrated: false,
  session: { status: "signed-out" },
  profile: EMPTY_PROFILE,
  submissions: [],
  ledger: [],
  accountError: null,
  settings: DEFAULT_SETTINGS,
  selectedBinId: null,
  activeSubmissionId: null,
  readNotificationIds: [],
};

let state: AppState | null = null;
let started = false;
const listeners = new Set<() => void>();
const evidencePhotos = new Map<string, string>();
let pendingCapture: PendingCapture | null = null;
let explicitSignOut = false;

function loadPrefs(): Partial<AppState> {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Partial<AppState>;
    return {
      settings: {
        ...DEFAULT_SETTINGS,
        ...p.settings,
        notifications: { ...DEFAULT_SETTINGS.notifications, ...p.settings?.notifications },
        privacy: { ...DEFAULT_SETTINGS.privacy, ...p.settings?.privacy },
      },
      selectedBinId: p.selectedBinId ?? null,
      readNotificationIds: p.readNotificationIds ?? [],
    };
  } catch {
    return {};
  }
}

function savePrefs(s: AppState) {
  try {
    window.localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ settings: s.settings, selectedBinId: s.selectedBinId, readNotificationIds: s.readNotificationIds }),
    );
  } catch {
    // Storage unavailable — preferences simply won't persist.
  }
}

function setState(patch: Partial<AppState>) {
  state = { ...getSnapshot(), ...patch };
  savePrefs(state);
  listeners.forEach((l) => l());
}

function getSnapshot(): AppState {
  state ??= { ...BASE, ...loadPrefs() };
  return state;
}

const getServerSnapshot = () => BASE;

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

/** Starts listening to Firebase Auth once, in the browser only. */
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  let lastUid: string | null = null;
  onIdTokenChanged(firebaseAuth(), (user) => {
    if (!user) {
      lastUid = null;
      evidencePhotos.clear();
      setState({ ...BASE, ...loadPrefs(), hydrated: true });
      return;
    }
    if (user.uid !== lastUid) {
      lastUid = user.uid;
      void loadAccount(user);
    }
  });
}

type MeResponse = { profile: UserProfile; submissions: Submission[]; ledger: LedgerEntry[] };

async function loadAccount(user: User) {
  try {
    const me = await apiFetch<MeResponse>("/api/me");
    setState({
      hydrated: true,
      accountError: null,
      profile: me.profile,
      submissions: me.submissions,
      ledger: me.ledger,
      session: me.profile.emailVerified
        ? { status: "signed-in", email: me.profile.email }
        : { status: "pending-verification", email: me.profile.email },
    });
  } catch (err) {
    // Keep already-loaded data on a transient refresh failure.
    if (getSnapshot().profile.uid === user.uid) return;
    setState({
      hydrated: true,
      accountError: err instanceof Error ? err.message : "Couldn't load your account.",
      session: { status: "pending-verification", email: user.email ?? "" },
    });
  }
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ---------------------------------- actions --------------------------------- */

export const actions = {
  /** Re-fetches profile, submissions and ledger from the server. */
  async refreshAccount() {
    const user = firebaseAuth().currentUser;
    if (user) await loadAccount(user);
  },

  async signOut() {
    explicitSignOut = true;
    pendingCapture = null;
    await firebaseSignOut(firebaseAuth());
  },

  async updateProfile(patch: Partial<Pick<UserProfile, "name" | "language" | "bio" | "showOnLeaderboard">>) {
    const { profile } = await apiFetch<{ profile: UserProfile }>("/api/me", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setState({ profile });
  },

  updateSettings(updater: (settings: AppSettings) => AppSettings) {
    setState({ settings: updater(getSnapshot().settings) });
  },

  async clearLocationHistory() {
    await apiFetch<{ cleared: number }>("/api/me/clear-location", { method: "POST" });
    setState({ submissions: getSnapshot().submissions.map((s) => ({ ...s, deviceLocation: undefined })) });
  },

  selectBin(binId: string) {
    setState({ selectedBinId: binId });
  },

  markNotificationsRead(ids: string[]) {
    setState({ readNotificationIds: Array.from(new Set([...getSnapshot().readNotificationIds, ...ids])) });
  },

  /** Holds the captured photo in memory until the verify page submits it. */
  setPendingCapture(capture: PendingCapture) {
    pendingCapture = capture;
    evidencePhotos.set(capture.requestId, capture.photoUrl);
    setState({ activeSubmissionId: capture.requestId });
  },

  /** Records the server's final result for a submission. */
  receiveSubmission(submission: Submission) {
    if (pendingCapture?.requestId === submission.id) pendingCapture = null;
    const s = getSnapshot();
    setState({
      activeSubmissionId: submission.id,
      submissions: [submission, ...s.submissions.filter((x) => x.id !== submission.id)],
    });
    // Points are awarded on the server; reload the ledger and profile from the source of truth.
    void actions.refreshAccount();
  },
};

export function getPendingCapture(): PendingCapture | null {
  return pendingCapture;
}

export function getEvidencePhoto(submissionId: string): string | undefined {
  return evidencePhotos.get(submissionId);
}

export function rememberEvidencePhoto(submissionId: string, url: string) {
  evidencePhotos.set(submissionId, url);
}

/** True once after the user signs out, so the guard can show a friendly message. */
export function consumeExplicitSignOut(): boolean {
  const value = explicitSignOut;
  explicitSignOut = false;
  return value;
}
