import { pointsForReport } from "./points";
import type { SubmissionStatus, VerificationCheck } from "./types";

/**
 * Decides a submission's outcome from the AI assessment and server-measured
 * GPS distance. Pure and deterministic so it can be unit-tested. The AI is
 * treated as evidence only; these rules — not the model — decide points.
 */

export const POLICY = {
  /** Within this distance the location is considered "at the bin". */
  nearBinMeters: 100,
  /** Beyond this distance the report is rejected outright. */
  farFromBinMeters: 250,
  /** GPS fixes less accurate than this go to manual review. */
  maxAccuracyMeters: 100,
  /** Minimum model confidence for automatic verification. */
  minConfidence: 0.7,
} as const;

export type PolicyAssessment = {
  bottle_detected: boolean;
  bottle_count_estimate: number;
  material: "plastic" | "glass" | "metal" | "other" | "unknown";
  hand_visible: boolean;
  recycling_bin_visible: boolean;
  image_quality: "good" | "poor";
  confidence: number;
  reason: string;
  needs_manual_review: boolean;
};

export type PolicyInput = {
  declaredBottles: number;
  distanceMeters: number;
  gpsAccuracyMeters: number | null;
  duplicatePhoto: boolean;
  /** null when the AI assessment failed or returned invalid output. */
  assessment: PolicyAssessment | null;
};

export type PolicyDecision = {
  status: Exclude<SubmissionStatus, "pending">;
  points: number;
  checks: VerificationCheck[];
  explanation: string;
};

export function decideVerification(input: PolicyInput): PolicyDecision {
  const { assessment: a, distanceMeters: d } = input;
  const accuracyOk = input.gpsAccuracyMeters === null || input.gpsAccuracyMeters <= POLICY.maxAccuracyMeters;

  const gpsCheck: VerificationCheck =
    d <= POLICY.nearBinMeters && accuracyOk
      ? { id: "gps-proximity", outcome: "pass", detail: `Your device was about ${Math.round(d)} m from the selected bin.` }
      : d > POLICY.farFromBinMeters
        ? { id: "gps-proximity", outcome: "fail", detail: `Your device was about ${formatKm(d)} from the selected bin.` }
        : {
            id: "gps-proximity",
            outcome: "uncertain",
            detail: accuracyOk
              ? `Your device was about ${Math.round(d)} m from the selected bin.`
              : "Your GPS signal was not accurate enough to confirm the location.",
          };

  if (input.duplicatePhoto) {
    return {
      status: "not-verified",
      points: 0,
      checks: [gpsCheck, ...aiChecks(a)],
      explanation: "This photo has already been submitted. Each report needs a new photo taken at the bin.",
    };
  }

  if (!a) {
    return {
      status: "needs-review",
      points: 0,
      checks: [gpsCheck],
      explanation: "We couldn't assess the photo automatically, so it has been kept for a manual review. No points are added until it is reviewed.",
    };
  }

  const checks = [gpsCheck, ...aiChecks(a)];

  if (d > POLICY.farFromBinMeters) {
    return { status: "not-verified", points: 0, checks, explanation: "Your location didn't match the selected bin. Take the photo at the bin and try again." };
  }
  if (!a.bottle_detected || a.material !== "plastic") {
    return { status: "not-verified", points: 0, checks, explanation: "We couldn't see a plastic bottle being recycled in the photo." };
  }

  const reviewReasons = [
    gpsCheck.outcome !== "pass",
    !a.hand_visible,
    !a.recycling_bin_visible,
    a.image_quality === "poor",
    a.confidence < POLICY.minConfidence,
    a.needs_manual_review,
  ];
  if (reviewReasons.some(Boolean)) {
    return {
      status: "needs-review",
      points: 0,
      checks,
      explanation: "Some of the evidence was unclear, so this submission is waiting for a manual review. No points are added until it is reviewed.",
    };
  }

  // Never trust a single count: award for the smaller of declared and estimated, then cap.
  const bottles = Math.max(1, Math.min(input.declaredBottles, a.bottle_count_estimate || 1));
  return {
    status: "verified",
    points: pointsForReport(bottles),
    checks,
    explanation: "Evidence appears consistent with recycling at the selected bin. A single photo can't prove a deposit, so submissions may still be spot-checked.",
  };
}

function aiChecks(a: PolicyAssessment | null): VerificationCheck[] {
  if (!a) return [];
  const count = a.bottle_count_estimate;
  return [
    {
      id: "bottle-detected",
      outcome: a.bottle_detected && a.material === "plastic" ? "pass" : "fail",
      detail: a.bottle_detected
        ? `${count} ${a.material} bottle${count === 1 ? "" : "s"} detected in the photo.`
        : "No bottle being recycled was detected.",
    },
    {
      id: "hand-visible",
      outcome: a.hand_visible ? "pass" : "uncertain",
      detail: a.hand_visible ? "A hand holding the bottle is visible." : "No hand holding the bottle is clearly visible.",
    },
    {
      id: "bin-context",
      outcome: a.recycling_bin_visible ? "pass" : "fail",
      detail: a.recycling_bin_visible ? "A recycling bin is visible in the frame." : "No recycling bin could be identified in the frame.",
    },
  ];
}

function formatKm(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
