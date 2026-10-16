import { z } from "zod";
import { EMAIL_PASSWORD_AUTH_ENABLED } from "@/lib/config";
import { sendCode } from "@/server/email-codes";
import { HttpError, handle, json, requireUser } from "@/server/http";
import { ensureUser, updateEditableProfile } from "@/server/users";

export const dynamic = "force-dynamic";

const Body = z.object({ name: z.string().trim().max(80).optional() }).strict();

/** Sends a 6-digit verification code to the signed-in user's email. */
export const POST = handle(async (req) => {
  if (!EMAIL_PASSWORD_AUTH_ENABLED) {
    throw new HttpError(403, "email-auth-disabled", "Email sign-in is temporarily unavailable. Please continue with Google.");
  }
  const user = await requireUser(req, { verified: false });
  const body = Body.safeParse(await req.json().catch(() => ({})));
  const record = await ensureUser({ ...user, name: body.success ? (body.data.name ?? user.name) : user.name });
  if (record.emailVerified) return json({ alreadyVerified: true });
  const name = body.success ? body.data.name : undefined;
  if (name && name.length >= 2 && name !== record.name) await updateEditableProfile(user.uid, { name });
  const result = await sendCode(user.uid, user.email);
  return json({ sent: true, ...result });
});
