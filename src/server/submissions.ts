import "server-only";
import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { distanceInMeters } from "@/lib/geo";
import { POINTS_RULE } from "@/lib/points";
import type { GeoPoint, LedgerEntry, Submission, VerificationCheck } from "@/lib/types";
import { decideVerification } from "@/lib/verification-policy";
import { getBin } from "./catalog";
import { db } from "./firebase-admin";
import { assessEvidence } from "./gemini";
import { HttpError } from "./http";
import { MAX_PHOTO_BYTES, isJpeg, saveSubmissionPhoto, submissionPhotoPath } from "./storage";
import { usersCol } from "./users";

export const SUBMISSION_LIMITS = {
  minIntervalMs: 30_000,
  maxPerDay: 30,
} as const;

const submissionsCol = (uid: string) => usersCol().doc(uid).collection("submissions");
const ledgerCol = (uid: string) => usersCol().doc(uid).collection("pointTransactions");
const photoHashes = () => db.collection("photoHashes");

type SubmissionDoc = {
  binId: string;
  binName: string;
  binArea: string;
  material: "plastic-bottle";
  bottleCount: number;
  bottleCountEstimated: number | null;
  status: Submission["status"];
  points: number;
  checks: VerificationCheck[];
  explanation: string;
  photoPath: string;
  photoSha256: string;
  deviceLocation: GeoPoint | null;
  distanceToBinMeters: number;
  ai: {
    ok: boolean;
    model?: string;
    reason?: string;
    confidence?: number;
    error?: string;
    usage?: { promptTokens: number; outputTokens: number; thinkingTokens: number; totalTokens: number };
  };
  createdAt: Timestamp;
};

export function toSubmission(id: string, d: SubmissionDoc): Submission {
  return {
    id,
    binId: d.binId,
    binName: d.binName,
    binArea: d.binArea,
    material: d.material,
    bottleCount: d.bottleCount,
    bottleCountEstimated: d.bottleCountEstimated ?? undefined,
    createdAt: d.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    status: d.status,
    deviceLocation: d.deviceLocation ?? undefined,
    distanceToBinMeters: d.distanceToBinMeters,
    checks: d.checks,
    explanation: d.explanation,
    points: d.points,
    hasPhoto: !!d.photoPath,
  };
}

export async function listSubmissions(uid: string, limit = 200): Promise<Submission[]> {
  const snap = await submissionsCol(uid).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((doc) => toSubmission(doc.id, doc.data() as SubmissionDoc));
}

export async function listLedger(uid: string, limit = 200): Promise<LedgerEntry[]> {
  const snap = await ledgerCol(uid).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      type: d.type,
      points: d.delta,
      createdAt: d.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      description: d.reason,
      submissionId: d.submissionId,
    } satisfies LedgerEntry;
  });
}

export async function getSubmissionPhotoPath(uid: string, submissionId: string): Promise<string | null> {
  if (!isUuid(submissionId)) return null;
  const snap = await submissionsCol(uid).doc(submissionId).get();
  return snap.exists ? ((snap.data() as SubmissionDoc).photoPath ?? null) : null;
}

export async function clearLocationHistory(uid: string): Promise<number> {
  const snap = await submissionsCol(uid).where("deviceLocation", "!=", null).get();
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.update(doc.ref, { deviceLocation: null }));
  await batch.commit();
  return snap.size;
}

export function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export type CreateSubmissionInput = {
  uid: string;
  requestId: string;
  binId: string;
  bottleCount: number;
  location: GeoPoint;
  storeLocation: boolean;
  photo: Buffer;
};

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

/**
 * Full evidence pipeline. Idempotent on `requestId`: a retry returns the
 * stored result and never re-runs the AI or re-awards points.
 */
export async function createSubmission(input: CreateSubmissionInput): Promise<Submission> {
  const { uid, requestId } = input;
  const ref = submissionsCol(uid).doc(requestId);

  const existing = await ref.get();
  if (existing.exists) return toSubmission(existing.id, existing.data() as SubmissionDoc);

  // --- Validate input ---
  if (input.photo.length === 0 || input.photo.length > MAX_PHOTO_BYTES || !isJpeg(input.photo)) {
    throw new HttpError(400, "invalid-photo", "The photo must be a JPEG taken with the camera (max 6 MB).");
  }
  const bottles = Math.floor(input.bottleCount);
  if (!(bottles >= 1 && bottles <= POINTS_RULE.maxBottlesPerReport)) {
    throw new HttpError(400, "invalid-bottle-count", `Bottle count must be between 1 and ${POINTS_RULE.maxBottlesPerReport}.`);
  }
  const bin = await getBin(input.binId);
  if (!bin || !bin.isActive) throw new HttpError(400, "invalid-bin", "That recycling bin isn't available.");

  // --- Rate limits (checked again inside the transaction) ---
  const userSnap = await usersCol().doc(uid).get();
  assertRateLimits(userSnap.data());

  // --- Evidence processing ---
  const photoSha256 = createHash("sha256").update(input.photo).digest("hex");
  const duplicatePhoto = (await photoHashes().doc(photoSha256).get()).exists;
  const distance = distanceInMeters(input.location, bin);
  const photoPath = submissionPhotoPath(uid, requestId);
  await saveSubmissionPhoto(photoPath, input.photo);

  const ai = duplicatePhoto ? null : await assessEvidence(input.photo, bottles);
  const decision = decideVerification({
    declaredBottles: bottles,
    distanceMeters: distance,
    gpsAccuracyMeters: input.location.accuracy ?? null,
    duplicatePhoto,
    assessment: ai?.ok ? ai.assessment : null,
  });

  // --- Atomic write: submission + photo hash + ledger + cached totals ---
  await db.runTransaction(async (tx) => {
    const [again, userInTx, hashSnap] = await Promise.all([
      tx.get(ref),
      tx.get(usersCol().doc(uid)),
      tx.get(photoHashes().doc(photoSha256)),
    ]);
    if (again.exists) return; // a concurrent retry already finished
    assertRateLimits(userInTx.data());

    // A photo hash claimed in the meantime turns this into a duplicate.
    const raceDuplicate = !duplicatePhoto && hashSnap.exists;
    const final = raceDuplicate
      ? decideVerification({
          declaredBottles: bottles,
          distanceMeters: distance,
          gpsAccuracyMeters: input.location.accuracy ?? null,
          duplicatePhoto: true,
          assessment: null,
        })
      : decision;

    const doc: SubmissionDoc = {
      binId: bin.id,
      binName: bin.name,
      binArea: bin.area,
      material: "plastic-bottle",
      bottleCount: bottles,
      bottleCountEstimated: ai?.ok ? ai.assessment.bottle_count_estimate : null,
      status: final.status,
      points: final.points,
      checks: final.checks,
      explanation: final.explanation,
      photoPath,
      photoSha256,
      deviceLocation: input.storeLocation ? sanitizeLocation(input.location) : null,
      distanceToBinMeters: Math.round(distance),
      ai: ai?.ok
        ? { ok: true, model: ai.model, reason: ai.assessment.reason, confidence: ai.assessment.confidence, usage: ai.usage }
        : { ok: false, error: duplicatePhoto ? "skipped: duplicate photo" : (ai?.error ?? "not run") },
      createdAt: Timestamp.now(),
    };
    tx.create(ref, doc);
    if (!hashSnap.exists) tx.create(photoHashes().doc(photoSha256), { uid, submissionId: requestId, createdAt: Timestamp.now() });

    const today = dayKey();
    const prev = userInTx.data() ?? {};
    const userUpdate: Record<string, unknown> = {
      lastSubmissionAt: FieldValue.serverTimestamp(),
      submissionDay: today,
      submissionDayCount: prev.submissionDay === today ? (prev.submissionDayCount ?? 0) + 1 : 1,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (final.status === "verified" && final.points > 0) {
      // Ledger doc ID = submission ID → a submission can credit points at most once.
      tx.create(ledgerCol(uid).doc(requestId), {
        type: "earn",
        delta: final.points,
        reason: `${bottles} plastic bottle${bottles === 1 ? "" : "s"} recycled`,
        submissionId: requestId,
        createdAt: FieldValue.serverTimestamp(),
      });
      userUpdate.points = FieldValue.increment(final.points);
      userUpdate.bottlesRecycled = FieldValue.increment(bottles);
    }
    tx.update(usersCol().doc(uid), userUpdate);
  });

  const saved = await ref.get();
  return toSubmission(saved.id, saved.data() as SubmissionDoc);
}

function assertRateLimits(user: FirebaseFirestore.DocumentData | undefined) {
  if (!user) throw new HttpError(403, "no-profile", "Your profile isn't set up yet. Please sign in again.");
  const last = user.lastSubmissionAt?.toMillis?.() ?? 0;
  if (Date.now() - last < SUBMISSION_LIMITS.minIntervalMs) {
    throw new HttpError(429, "too-fast", "Please wait a moment before submitting another report.");
  }
  if (user.submissionDay === dayKey() && (user.submissionDayCount ?? 0) >= SUBMISSION_LIMITS.maxPerDay) {
    throw new HttpError(429, "daily-limit", "You've reached today's report limit. Thank you — try again tomorrow!");
  }
}

function sanitizeLocation(p: GeoPoint): GeoPoint {
  return {
    latitude: Math.round(p.latitude * 1e6) / 1e6,
    longitude: Math.round(p.longitude * 1e6) / 1e6,
    ...(p.accuracy !== undefined ? { accuracy: Math.round(p.accuracy) } : {}),
  };
}
