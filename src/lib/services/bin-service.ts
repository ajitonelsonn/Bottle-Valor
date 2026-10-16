import { distanceInMeters } from "@/lib/geo";
import type { GeoPoint, RecyclingBin } from "@/lib/types";

export type BinWithDistance = RecyclingBin & { distanceMeters: number };

/** Active bins first, real before sample, then nearest. */
export function sortByDistance(bins: RecyclingBin[], from: GeoPoint): BinWithDistance[] {
  return bins
    .map((bin) => ({ ...bin, distanceMeters: distanceInMeters(from, bin) }))
    .sort(
      (a, b) =>
        Number(b.isActive) - Number(a.isActive) ||
        Number(!!a.isSample) - Number(!!b.isSample) ||
        a.distanceMeters - b.distanceMeters,
    );
}
