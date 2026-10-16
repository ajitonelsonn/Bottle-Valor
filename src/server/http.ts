import "server-only";
import { NextResponse } from "next/server";
import { adminAuth } from "./firebase-admin";
import { ensureUser, getUserRecord } from "./users";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export type AuthedUser = {
  uid: string;
  email: string;
  name?: string;
  /** True when a trusted identity provider (Google) has verified the email. */
  emailTrusted: boolean;
};

/** Providers whose verified emails don't need our 6-digit code. */
const TRUSTED_PROVIDERS = new Set(["google.com"]);

/**
 * Verifies the Firebase ID token sent as `Authorization: Bearer <token>`.
 * With `verified` (default), the account must also have completed the
 * 6-digit email verification recorded in Firestore.
 */
export async function requireUser(req: Request, { verified = true } = {}): Promise<AuthedUser> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "unauthenticated", "Please sign in.");
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    throw new HttpError(401, "unauthenticated", "Your session has expired. Please sign in again.");
  }
  if (!decoded.email) throw new HttpError(403, "no-email", "This account has no email address.");
  const provider = decoded.firebase?.sign_in_provider ?? "";
  const user: AuthedUser = {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name as string | undefined,
    emailTrusted: decoded.email_verified === true && TRUSTED_PROVIDERS.has(provider),
  };
  if (verified) {
    let record = await getUserRecord(user.uid);
    if (!record?.emailVerified && user.emailTrusted) record = await ensureUser(user);
    if (!record?.emailVerified) throw new HttpError(403, "email-not-verified", "Please verify your email first.");
  }
  return user;
}

/** Wraps a route handler: maps HttpError to JSON and hides unexpected internals. */
export function handle<Args extends unknown[]>(fn: (req: Request, ...args: Args) => Promise<Response>) {
  return async (req: Request, ...args: Args): Promise<Response> => {
    try {
      return await fn(req, ...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
      }
      // Log a sanitized message only — never request bodies, tokens or images.
      console.error("[api] unexpected error:", err instanceof Error ? err.message : String(err));
      return NextResponse.json(
        { error: { code: "internal", message: "Something went wrong. Please try again." } },
        { status: 500 },
      );
    }
  };
}

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
