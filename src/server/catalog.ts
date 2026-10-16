import "server-only";
import type { MaterialId, RecyclingBin, Reward } from "@/lib/types";
import { db } from "./firebase-admin";

/** Reads the public bin catalogue from Firestore `bins`. */
export async function listBins(): Promise<RecyclingBin[]> {
  const snap = await db.collection("bins").get();
  return snap.docs.map((doc) => toBin(doc.id, doc.data()));
}

export async function getBin(id: string): Promise<RecyclingBin | null> {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return null;
  const doc = await db.collection("bins").doc(id).get();
  return doc.exists ? toBin(doc.id, doc.data()!) : null;
}

function toBin(id: string, d: FirebaseFirestore.DocumentData): RecyclingBin {
  return {
    id,
    name: String(d.name ?? ""),
    area: String(d.area ?? ""),
    description: d.description ? String(d.description) : undefined,
    imageUrl: String(d.imageUrl ?? ""),
    latitude: Number(d.latitude),
    longitude: Number(d.longitude),
    supportedMaterials: (Array.isArray(d.supportedMaterials) ? d.supportedMaterials : ["plastic-bottle"]) as MaterialId[],
    isActive: d.isActive !== false,
    isSample: d.isSample === true,
  };
}

/** Reads the reward catalogue from Firestore `rewards`. Redemption stays disabled. */
export async function listRewards(): Promise<Reward[]> {
  const snap = await db.collection("rewards").orderBy("sortOrder").get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      title: String(d.title ?? ""),
      subtitle: String(d.subtitle ?? ""),
      description: String(d.description ?? ""),
      category: d.category,
      pointsRequired: Number(d.pointsRequired ?? 0),
      status: d.status === "demo" ? "demo" : "coming-soon",
      imageUrl: String(d.imageUrl ?? ""),
      popular: d.popular === true,
      redemptionEnabled: false,
      sortOrder: Number(d.sortOrder ?? 0),
    } satisfies Reward;
  });
}
