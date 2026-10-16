import "server-only";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { env } from "./env";

const app =
  getApps()[0] ??
  initializeApp({
    credential: applicationDefault(),
    projectId: env.projectId,
  });

export const adminAuth = getAuth(app);
export const db = getFirestore(app);
