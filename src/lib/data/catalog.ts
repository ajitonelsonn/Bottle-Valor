"use client";

import { useSyncExternalStore } from "react";
import { apiFetch } from "@/lib/api/client";
import type { RecyclingBin, Reward } from "@/lib/types";

/** Loading state for public catalogue data served from Cloud Firestore. */
export type Resource<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

function createResource<T>(load: () => Promise<T>) {
  let value: Resource<T> = { status: "loading" };
  let inFlight: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const set = (v: Resource<T>) => {
    value = v;
    listeners.forEach((l) => l());
  };
  const fetchNow = () => {
    inFlight ??= load()
      .then((data) => set({ status: "ready", data }))
      .catch((err) => set({ status: "error", message: err instanceof Error ? err.message : "Couldn't load data." }))
      .finally(() => {
        inFlight = null;
      });
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    if (value.status === "loading") fetchNow();
    return () => {
      listeners.delete(l);
    };
  };
  const loading: Resource<T> = { status: "loading" };
  return {
    use: () => useSyncExternalStore(subscribe, () => value, () => loading),
    retry: () => {
      set({ status: "loading" });
      fetchNow();
    },
  };
}

const bins = createResource(async () => (await apiFetch<{ bins: RecyclingBin[] }>("/api/bins", { auth: false })).bins);
const rewards = createResource(async () => (await apiFetch<{ rewards: Reward[] }>("/api/rewards", { auth: false })).rewards);

export const useBins = bins.use;
export const retryBins = bins.retry;
export const useRewards = rewards.use;
export const retryRewards = rewards.retry;

/** The cheapest reward — used for "progress toward your next reward". */
export function featuredReward(list: Reward[] | undefined): Reward | null {
  if (!list?.length) return null;
  return [...list].sort((a, b) => a.pointsRequired - b.pointsRequired || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
}
