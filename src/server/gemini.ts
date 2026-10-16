import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "./env";
import { RESPONSE_SCHEMA, userInstruction } from "./gemini-prompt";

/**
 * Server-only Gemini client on Google Cloud Agent Platform (Vertex AI),
 * authenticated with ADC locally and the Cloud Run service account in
 * production. No API key is used and nothing here reaches the browser.
 */
const ai = new GoogleGenAI({ enterprise: true, project: env.projectId, location: env.geminiLocation });

export const EvidenceAssessmentSchema = z.object({
  bottle_detected: z.boolean(),
  bottle_count_estimate: z.number().int().min(0).max(100),
  material: z.enum(["plastic", "glass", "metal", "other", "unknown"]),
  hand_visible: z.boolean(),
  recycling_bin_visible: z.boolean(),
  image_quality: z.enum(["good", "poor"]),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(500),
  needs_manual_review: z.boolean(),
});

export type EvidenceAssessment = z.infer<typeof EvidenceAssessmentSchema>;



export type TokenUsage = { promptTokens: number; outputTokens: number; thinkingTokens: number; totalTokens: number };

export type AssessmentResult =
  | { ok: true; assessment: EvidenceAssessment; model: string; usage: TokenUsage }
  | { ok: false; error: string };

export async function assessEvidence(image: Buffer, declaredBottles: number): Promise<AssessmentResult> {
  try {
    const res = await ai.models.generateContent({
      model: env.geminiModel,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image.toString("base64") } },
            { text: userInstruction(declaredBottles) },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
        temperature: 0,
        maxOutputTokens: 400,
        abortSignal: AbortSignal.timeout(30_000),
      },
    });
    const raw = res.text ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Model returned malformed JSON." };
    }
    const result = EvidenceAssessmentSchema.safeParse(parsed);
    if (!result.success) return { ok: false, error: "Model response failed schema validation." };
    const u = res.usageMetadata;
    const usage: TokenUsage = {
      promptTokens: u?.promptTokenCount ?? 0,
      outputTokens: u?.candidatesTokenCount ?? 0,
      thinkingTokens: u?.thoughtsTokenCount ?? 0,
      totalTokens: u?.totalTokenCount ?? 0,
    };
    return { ok: true, assessment: result.data, model: res.modelVersion ?? env.geminiModel, usage };
  } catch (err) {
    // Sanitized: no request payload or credentials.
    const message = err instanceof Error ? err.message.slice(0, 200) : "unknown error";
    console.error("[gemini] request failed:", message);
    return { ok: false, error: "AI assessment unavailable." };
  }
}
