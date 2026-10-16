/**
 * Seeds the BotleValor catalogue (bins + rewards) into Cloud Firestore and
 * uploads their images to the PUBLIC Cloud Storage bucket.
 *
 * Idempotent: images are overwritten and documents upserted by ID.
 * Uses Application Default Credentials — run `gcloud auth application-default login` first.
 *
 *   npm run seed            (reads .env.local)
 *
 * Env: GOOGLE_CLOUD_PROJECT, GCS_PUBLIC_BUCKET
 */
import { readFileSync } from "node:fs";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { Storage } from "@google-cloud/storage";

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const publicBucket = process.env.GCS_PUBLIC_BUCKET;
if (!projectId || !publicBucket) {
  console.error("Set GOOGLE_CLOUD_PROJECT and GCS_PUBLIC_BUCKET (e.g. in .env.local).");
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const bucket = new Storage({ projectId }).bucket(publicBucket);

const seedDir = new URL("./seed-data/", import.meta.url);
const load = (name) => JSON.parse(readFileSync(new URL(`${name}.json`, seedDir), "utf8"));

const CONTENT_TYPES = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

/** Uploads seed-data/images/<imagePath> and returns its public URL. */
async function uploadImage(imagePath) {
  const ext = imagePath.split(".").pop().toLowerCase();
  const bytes = readFileSync(new URL(`images/${imagePath}`, seedDir));
  await bucket.file(imagePath).save(bytes, {
    resumable: false,
    contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
    metadata: { cacheControl: "public, max-age=86400" },
  });
  return `https://storage.googleapis.com/${publicBucket}/${imagePath}`;
}

async function upsert(collection, items) {
  const batch = db.batch();
  for (const { id, imagePath, ...data } of items) {
    const imageUrl = imagePath ? await uploadImage(imagePath) : data.imageUrl;
    const ref = db.collection(collection).doc(id);
    const snap = await ref.get();
    batch.set(
      ref,
      {
        ...data,
        imageUrl,
        updatedAt: FieldValue.serverTimestamp(),
        ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );
  }
  await batch.commit();
  console.log(`${collection}: upserted ${items.length} (images in gs://${publicBucket})`);
}

await upsert("bins", load("bins"));
await upsert("rewards", load("rewards"));
