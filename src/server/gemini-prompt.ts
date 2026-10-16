/**
 * Prompt and response schema for the evidence assessment. Kept free of
 * imports so scripts (e.g. token measurement) can reuse the exact prompt.
 */
// JSON schema sent to the model (validated again with zod on return).
export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    bottle_detected: { type: "boolean" },
    bottle_count_estimate: { type: "integer", minimum: 0 },
    material: { type: "string", enum: ["plastic", "glass", "metal", "other", "unknown"] },
    hand_visible: { type: "boolean" },
    recycling_bin_visible: { type: "boolean" },
    image_quality: { type: "string", enum: ["good", "poor"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reason: { type: "string" },
    needs_manual_review: { type: "boolean" },
  },
  required: [
    "bottle_detected",
    "bottle_count_estimate",
    "material",
    "hand_visible",
    "recycling_bin_visible",
    "image_quality",
    "confidence",
    "reason",
    "needs_manual_review",
  ],
};

export const PROMPT = `You are assisting a bottle-recycling programme in Dili, Timor-Leste.
Assess this single photo as EVIDENCE that a person is depositing plastic bottles into a recycling bin or bottle-collection cage.
Report ONLY what is clearly visible. Do not guess or assume.
- bottle_detected: a bottle being deposited is clearly visible.
- bottle_count_estimate: how many bottles the person is depositing (not bottles already inside the bin).
- material: the material of those bottles.
- hand_visible: a human hand holding or releasing the bottle(s) is visible.
- recycling_bin_visible: a recycling bin or bottle-collection cage is visible.
- image_quality: "poor" if dark, blurry or heavily obstructed.
- confidence: your overall confidence in this assessment (0–1).
- reason: one short, neutral sentence describing what is visible. No personal descriptions of people.
- needs_manual_review: true if anything is ambiguous.`;

export function userInstruction(declaredBottles: number): string {
  return `${PROMPT}\nThe user says they are depositing ${declaredBottles} bottle(s). Count independently.`;
}
