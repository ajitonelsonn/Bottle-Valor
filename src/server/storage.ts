import "server-only";
import { Storage } from "@google-cloud/storage";
import { env } from "./env";

const storage = new Storage({ projectId: env.projectId });
const uploads = storage.bucket(env.uploadsBucket);

export const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

/** True if the bytes start with a JPEG signature (FF D8 FF). */
export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export function submissionPhotoPath(uid: string, submissionId: string): string {
  return `submissions/${uid}/${submissionId}/original.jpg`;
}

/** Stores an evidence photo in the PRIVATE uploads bucket. */
export async function saveSubmissionPhoto(path: string, bytes: Buffer): Promise<void> {
  await uploads.file(path).save(bytes, {
    resumable: false,
    contentType: "image/jpeg",
    metadata: { cacheControl: "private, max-age=0, no-store" },
  });
}

export async function readSubmissionPhoto(path: string): Promise<Buffer | null> {
  const file = uploads.file(path);
  const [exists] = await file.exists();
  if (!exists) return null;
  const [bytes] = await file.download();
  return bytes;
}
