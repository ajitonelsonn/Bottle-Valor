"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/** Firebase web config — public identifiers; security comes from Auth + server checks. */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let auth: Auth | null = null;

export function firebaseAuth(): Auth {
  if (!auth) {
    const app = getApps()[0] ?? initializeApp(config);
    auth = getAuth(app);
  }
  return auth;
}
