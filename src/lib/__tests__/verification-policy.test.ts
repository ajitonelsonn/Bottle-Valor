import { describe, expect, it } from "vitest";
import { POLICY, decideVerification, type PolicyAssessment, type PolicyInput } from "@/lib/verification-policy";

const good: PolicyAssessment = {
  bottle_detected: true,
  bottle_count_estimate: 2,
  material: "plastic",
  hand_visible: true,
  recycling_bin_visible: true,
  image_quality: "good",
  confidence: 0.92,
  reason: "Two plastic bottles held over a bin.",
  needs_manual_review: false,
};

const base: PolicyInput = {
  declaredBottles: 2,
  distanceMeters: 20,
  gpsAccuracyMeters: 10,
  duplicatePhoto: false,
  assessment: good,
};

const decide = (patch: Partial<PolicyInput> = {}, ai: Partial<PolicyAssessment> = {}) =>
  decideVerification({ ...base, ...patch, assessment: patch.assessment === null ? null : { ...good, ...ai } });

describe("decideVerification", () => {
  it("verifies clean evidence near the bin", () => {
    const d = decide();
    expect(d.status).toBe("verified");
    expect(d.points).toBe(2);
    expect(d.checks.every((c) => c.outcome === "pass")).toBe(true);
  });

  it("awards for the smaller of declared and AI-estimated bottles", () => {
    expect(decide({ declaredBottles: 5 }, { bottle_count_estimate: 1 }).points).toBe(1);
    expect(decide({ declaredBottles: 1 }, { bottle_count_estimate: 10 }).points).toBe(1);
  });

  it("never exceeds 3 points even if the model counts many bottles", () => {
    expect(decide({ declaredBottles: 10 }, { bottle_count_estimate: 50 }).points).toBe(3);
  });

  it("rejects photos far from the bin", () => {
    const d = decide({ distanceMeters: POLICY.farFromBinMeters + 1 });
    expect(d.status).toBe("not-verified");
    expect(d.points).toBe(0);
  });

  it("sends borderline distance or poor GPS to review with 0 points", () => {
    expect(decide({ distanceMeters: POLICY.nearBinMeters + 50 }).status).toBe("needs-review");
    expect(decide({ gpsAccuracyMeters: POLICY.maxAccuracyMeters + 1 }).status).toBe("needs-review");
    expect(decide({ distanceMeters: 150 }).points).toBe(0);
  });

  it("rejects when no plastic bottle is detected", () => {
    expect(decide({}, { bottle_detected: false }).status).toBe("not-verified");
    expect(decide({}, { material: "glass" }).status).toBe("not-verified");
  });

  it("requires a visible hand and bin, good quality and confidence", () => {
    expect(decide({}, { hand_visible: false }).status).toBe("needs-review");
    expect(decide({}, { recycling_bin_visible: false }).status).toBe("needs-review");
    expect(decide({}, { image_quality: "poor" }).status).toBe("needs-review");
    expect(decide({}, { confidence: POLICY.minConfidence - 0.01 }).status).toBe("needs-review");
    expect(decide({}, { needs_manual_review: true }).status).toBe("needs-review");
  });

  it("rejects duplicate photos regardless of AI result", () => {
    const d = decide({ duplicatePhoto: true });
    expect(d.status).toBe("not-verified");
    expect(d.points).toBe(0);
  });

  it("sends AI failures to manual review without points", () => {
    const d = decideVerification({ ...base, assessment: null });
    expect(d.status).toBe("needs-review");
    expect(d.points).toBe(0);
  });

  it("only ever awards points for verified status", () => {
    const cases = [
      decide({ distanceMeters: 5000 }),
      decide({}, { hand_visible: false }),
      decide({ duplicatePhoto: true }),
      decideVerification({ ...base, assessment: null }),
    ];
    for (const c of cases) expect(c.points).toBe(0);
  });
});
