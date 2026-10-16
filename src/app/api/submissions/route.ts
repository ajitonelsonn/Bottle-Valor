import { z } from "zod";
import { HttpError, handle, json, requireUser } from "@/server/http";
import { MAX_PHOTO_BYTES } from "@/server/storage";
import { createSubmission } from "@/server/submissions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Meta = z
  .object({
    requestId: z.uuid(),
    binId: z.string().min(1).max(100),
    bottleCount: z.number().int().min(1).max(10),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().min(0).max(100_000).optional(),
    }),
    storeLocation: z.boolean(),
  })
  .strict();

/**
 * Submit recycling evidence (camera photo + GPS). The server stores the
 * photo privately, asks Gemini to assess it, applies the verification
 * policy and awards points atomically. Clients cannot set the outcome.
 */
export const POST = handle(async (req) => {
  const user = await requireUser(req);
  const form = await req.formData().catch(() => null);
  if (!form) throw new HttpError(400, "invalid-request", "Invalid submission.");
  const photo = form.get("photo");
  let rawMeta: unknown = null;
  try {
    rawMeta = JSON.parse(String(form.get("meta") ?? "null"));
  } catch {
    rawMeta = null;
  }
  const meta = Meta.safeParse(rawMeta);
  if (!meta.success) throw new HttpError(400, "invalid-request", "Invalid submission details.");
  if (!(photo instanceof Blob) || photo.size === 0 || photo.size > MAX_PHOTO_BYTES || photo.type !== "image/jpeg") {
    throw new HttpError(400, "invalid-photo", "The photo must be a JPEG taken with the camera (max 6 MB).");
  }
  const submission = await createSubmission({
    uid: user.uid,
    ...meta.data,
    photo: Buffer.from(await photo.arrayBuffer()),
  });
  return json({ submission });
});
