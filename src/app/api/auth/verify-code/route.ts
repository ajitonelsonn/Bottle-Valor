import { z } from "zod";
import { verifyCode } from "@/server/email-codes";
import { HttpError, handle, json, requireUser } from "@/server/http";

export const dynamic = "force-dynamic";

const Body = z.object({ code: z.string().regex(/^\d{6}$/) }).strict();

export const POST = handle(async (req) => {
  const user = await requireUser(req, { verified: false });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) throw new HttpError(400, "invalid-code", "Enter all 6 digits of the code.");
  await verifyCode(user.uid, body.data.code);
  return json({ verified: true });
});
