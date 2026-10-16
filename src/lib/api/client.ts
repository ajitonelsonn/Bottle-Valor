"use client";

import { firebaseAuth } from "@/lib/firebase/client";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Calls the BotleValor API, attaching the signed-in user's Firebase ID token. */
export async function apiFetch<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const h = new Headers(headers);
  if (auth) {
    const user = firebaseAuth().currentUser;
    if (!user) throw new ApiError(401, "unauthenticated", "Please sign in.");
    h.set("Authorization", `Bearer ${await user.getIdToken()}`);
  }
  if (rest.body && !(rest.body instanceof FormData) && !h.has("Content-Type")) h.set("Content-Type", "application/json");
  let res: Response;
  try {
    res = await fetch(path, { ...rest, headers: h });
  } catch {
    throw new ApiError(0, "network", "You appear to be offline. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.code ?? "error", data?.error?.message ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

/** Downloads a private photo with the user's token and returns a local object URL. */
export async function fetchPrivateImage(path: string): Promise<string> {
  const user = firebaseAuth().currentUser;
  if (!user) throw new ApiError(401, "unauthenticated", "Please sign in.");
  const res = await fetch(path, { headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
  if (!res.ok) throw new ApiError(res.status, "photo", "Photo unavailable.");
  return URL.createObjectURL(await res.blob());
}
