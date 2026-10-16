import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { DEFAULT_CITY } from "@/lib/config";
import type { LanguageCode, UserProfile } from "@/lib/types";
import { db } from "./firebase-admin";

/** Firestore `users/{uid}` document. Points are a cached total of the ledger. */
export type UserRecord = {
  name: string;
  email: string;
  language: LanguageCode;
  bio: string;
  city: string;
  emailVerified: boolean;
  emailVerifiedAt?: Timestamp;
  points: number;
  bottlesRecycled: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** User opted out of the public leaderboard. */
  leaderboardOptOut?: boolean;
  lastSubmissionAt?: Timestamp;
  submissionDay?: string;
  submissionDayCount?: number;
};

export const usersCol = () => db.collection("users");

export async function getUserRecord(uid: string): Promise<UserRecord | null> {
  const snap = await usersCol().doc(uid).get();
  return snap.exists ? (snap.data() as UserRecord) : null;
}

/** Creates the profile document on first use. Never overwrites protected fields. */
export async function ensureUser(input: {
  uid: string;
  email: string;
  name?: string;
  /** Email already verified by a trusted provider (e.g. Google). */
  emailTrusted?: boolean;
}): Promise<UserRecord> {
  const ref = usersCol().doc(input.uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      if (input.emailTrusted && !snap.get("emailVerified")) {
        tx.update(ref, {
          emailVerified: true,
          emailVerifiedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      return;
    }
    const fallbackName = input.email.split("@")[0];
    tx.create(ref, {
      name: (input.name ?? "").trim().slice(0, 80) || fallbackName,
      email: input.email.toLowerCase(),
      language: "en",
      bio: "",
      city: DEFAULT_CITY,
      emailVerified: input.emailTrusted === true,
      ...(input.emailTrusted ? { emailVerifiedAt: FieldValue.serverTimestamp() } : {}),
      points: 0,
      bottlesRecycled: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return (await getUserRecord(input.uid)) as UserRecord;
}

export function toProfile(uid: string, rec: UserRecord): UserProfile {
  return {
    uid,
    name: rec.name,
    email: rec.email,
    emailVerified: rec.emailVerified,
    language: rec.language,
    bio: rec.bio,
    city: rec.city,
    memberSince: rec.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    showOnLeaderboard: rec.leaderboardOptOut !== true,
  };
}

/** Only these fields may be edited by the user. */
export async function updateEditableProfile(
  uid: string,
  patch: Partial<Pick<UserRecord, "name" | "bio" | "language" | "leaderboardOptOut">>,
): Promise<void> {
  await usersCol()
    .doc(uid)
    .update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
}
