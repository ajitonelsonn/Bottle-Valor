"use client";

import { FirebaseError } from "firebase/app";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { ApiError, apiFetch } from "@/lib/api/client";
import { firebaseAuth } from "@/lib/firebase/client";
import { actions } from "@/lib/store/app-store";
import type { UserProfile } from "@/lib/types";

/** Real Firebase Authentication + server-side 6-digit email verification. */

export type AuthResult = { ok: true } | { ok: false; error: string };

function friendly(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-email":
        return "Incorrect email or password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Try logging in instead.";
      case "auth/weak-password":
        return "Choose a stronger password (at least 6 characters).";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a few minutes and try again.";
      case "auth/network-request-failed":
        return "You appear to be offline. Check your connection and try again.";
      case "auth/operation-not-allowed":
      case "auth/configuration-not-found":
        return "Email sign-in isn't enabled for BotleValor yet.";
      case "auth/requires-recent-login":
        return "Please log in again before changing your password.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Google sign-in was cancelled.";
      case "auth/account-exists-with-different-credential":
        return "This email is already registered with a password. Log in with your email and password.";
      case "auth/unauthorized-domain":
        return "Google sign-in isn't allowed on this website address yet.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  return "Something went wrong. Please try again.";
}

/** Signs in. `needsVerification` is true until the 6-digit code is confirmed. */
export async function signIn(email: string, password: string): Promise<AuthResult & { needsVerification?: boolean }> {
  try {
    await signInWithEmailAndPassword(firebaseAuth(), email, password);
    const me = await apiFetch<{ profile: UserProfile }>("/api/me");
    if (!me.profile.emailVerified) {
      // Send a fresh code; a "too soon" limit just means a recent code is still valid.
      await apiFetch("/api/auth/send-code", { method: "POST", body: "{}" }).catch(() => undefined);
      return { ok: true, needsVerification: true };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}

/**
 * Google sign-in. Google has already verified the email, so these accounts
 * don't need the 6-digit code (the server checks this from the ID token).
 * Falls back to a full-page redirect when the browser blocks popups.
 */
export async function signInWithGoogle(): Promise<AuthResult & { redirected?: boolean }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(firebaseAuth(), provider);
  } catch (err) {
    if (err instanceof FirebaseError && err.code === "auth/popup-blocked") {
      await signInWithRedirect(firebaseAuth(), provider);
      return { ok: true, redirected: true };
    }
    if (err instanceof FirebaseError && err.code === "auth/operation-not-allowed") {
      return { ok: false, error: "Google sign-in isn't enabled for BotleValor yet." };
    }
    return { ok: false, error: friendly(err) };
  }
  try {
    await apiFetch("/api/me");
    await actions.refreshAccount();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}

export async function signUp(name: string, email: string, password: string): Promise<AuthResult & { emailError?: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth(), email, password);
    await updateProfile(cred.user, { displayName: name });
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
  // Account exists now; report email problems separately so the user can resend.
  try {
    await apiFetch("/api/auth/send-code", { method: "POST", body: JSON.stringify({ name }) });
    return { ok: true };
  } catch (err) {
    return { ok: true, emailError: friendly(err) };
  }
}

export async function resendCode(): Promise<AuthResult> {
  try {
    await apiFetch("/api/auth/send-code", { method: "POST", body: "{}" });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}

export async function verifyCode(code: string): Promise<AuthResult> {
  try {
    await apiFetch("/api/auth/verify-code", { method: "POST", body: JSON.stringify({ code }) });
    await firebaseAuth().currentUser?.getIdToken(true);
    await actions.refreshAccount();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendly(err) };
  }
}

/** Firebase sends the reset link itself. The response never reveals whether an account exists. */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    await sendPasswordResetEmail(firebaseAuth(), email);
    return { ok: true };
  } catch (err) {
    if (err instanceof FirebaseError && err.code === "auth/user-not-found") return { ok: true };
    return { ok: false, error: friendly(err) };
  }
}

export async function changePassword(current: string, next: string): Promise<AuthResult> {
  const user = firebaseAuth().currentUser;
  if (!user?.email) return { ok: false, error: "Please log in again." };
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
    await updatePassword(user, next);
    return { ok: true };
  } catch (err) {
    if (err instanceof FirebaseError && (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password")) {
      return { ok: false, error: "Your current password is incorrect." };
    }
    return { ok: false, error: friendly(err) };
  }
}
