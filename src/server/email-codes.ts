import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, db } from "./firebase-admin";
import { EmailNotConfiguredError, sendVerificationCodeEmail } from "./email";
import { env } from "./env";
import { HttpError } from "./http";
import { usersCol } from "./users";

/**
 * Six-digit email verification codes.
 * - Only a salted SHA-256 hash is stored (Firestore `emailCodes/{uid}`, server-only).
 * - Codes expire after 10 minutes and allow at most 5 attempts.
 * - Sending is limited to once per minute and 5 times per hour.
 * - Codes are never logged.
 */
export const CODE_POLICY = {
  ttlMs: 10 * 60 * 1000,
  maxAttempts: 5,
  resendIntervalMs: 60 * 1000,
  maxSendsPerHour: 5,
} as const;

type CodeDoc = {
  hash: string;
  salt: string;
  expiresAt: Timestamp;
  attempts: number;
  lastSentAt: Timestamp;
  windowStart: Timestamp;
  sendCount: number;
};

const codesCol = () => db.collection("emailCodes");

function hashCode(code: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${code}:${env.codePepper}`).digest("hex");
}

export async function sendCode(uid: string, email: string): Promise<{ resendAvailableInMs: number }> {
  const ref = codesCol().doc(uid);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const salt = randomBytes(16).toString("hex");
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists ? (snap.data() as CodeDoc) : null;
    if (prev) {
      const sinceLast = now - prev.lastSentAt.toMillis();
      if (sinceLast < CODE_POLICY.resendIntervalMs) {
        const wait = Math.ceil((CODE_POLICY.resendIntervalMs - sinceLast) / 1000);
        throw new HttpError(429, "too-soon", `Please wait ${wait} seconds before requesting a new code.`);
      }
    }
    const windowFresh = !prev || now - prev.windowStart.toMillis() > 60 * 60 * 1000;
    const sendCount = windowFresh ? 1 : prev!.sendCount + 1;
    if (sendCount > CODE_POLICY.maxSendsPerHour) {
      throw new HttpError(429, "too-many-codes", "Too many codes requested. Please try again in an hour.");
    }
    tx.set(ref, {
      hash: hashCode(code, salt),
      salt,
      expiresAt: Timestamp.fromMillis(now + CODE_POLICY.ttlMs),
      attempts: 0,
      lastSentAt: Timestamp.fromMillis(now),
      windowStart: windowFresh ? Timestamp.fromMillis(now) : prev!.windowStart,
      sendCount,
    } satisfies CodeDoc);
  });

  try {
    await sendVerificationCodeEmail(email, code);
  } catch (err) {
    // Invalidate the unsent code so it can't be guessed later.
    await ref.update({ expiresAt: Timestamp.fromMillis(0) });
    if (err instanceof EmailNotConfiguredError) {
      throw new HttpError(503, "email-not-configured", "Email sending isn't set up yet, so no code was sent.");
    }
    throw new HttpError(502, "email-failed", "We couldn't send the email. Please try again.");
  }
  return { resendAvailableInMs: CODE_POLICY.resendIntervalMs };
}

export async function verifyCode(uid: string, code: string): Promise<void> {
  if (!/^\d{6}$/.test(code)) throw new HttpError(400, "invalid-code", "Enter all 6 digits of the code.");
  const ref = codesCol().doc(uid);

  const outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return "missing" as const;
    const doc = snap.data() as CodeDoc;
    if (doc.expiresAt.toMillis() < Date.now()) return "expired" as const;
    if (doc.attempts >= CODE_POLICY.maxAttempts) return "locked" as const;
    const expected = Buffer.from(doc.hash, "hex");
    const actual = Buffer.from(hashCode(code, doc.salt), "hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      tx.update(ref, { attempts: doc.attempts + 1 });
      return "wrong" as const;
    }
    tx.delete(ref);
    tx.update(usersCol().doc(uid), {
      emailVerified: true,
      emailVerifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return "ok" as const;
  });

  if (outcome === "missing" || outcome === "expired")
    throw new HttpError(400, "code-expired", "This code has expired. Request a new code.");
  if (outcome === "locked") throw new HttpError(429, "too-many-attempts", "Too many incorrect attempts. Request a new code.");
  if (outcome === "wrong") throw new HttpError(400, "wrong-code", "That code isn't correct. Check the email and try again.");

  // Mirror onto the Firebase Auth record (best effort; Firestore is the source of truth).
  try {
    await adminAuth.updateUser(uid, { emailVerified: true });
  } catch (err) {
    console.warn("[auth] could not mirror emailVerified to Firebase Auth:", err instanceof Error ? err.message.slice(0, 120) : "");
  }
}
