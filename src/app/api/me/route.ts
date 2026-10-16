import { z } from "zod";
import { HttpError, handle, json, requireUser } from "@/server/http";
import { listLedger, listSubmissions } from "@/server/submissions";
import { ensureUser, getUserRecord, toProfile, updateEditableProfile } from "@/server/users";

export const dynamic = "force-dynamic";

/** The signed-in user's profile, submissions and points ledger. */
export const GET = handle(async (req) => {
  const user = await requireUser(req, { verified: false });
  const record = await ensureUser(user);
  const profile = toProfile(user.uid, record);
  if (!record.emailVerified) return json({ profile, submissions: [], ledger: [] });
  const [submissions, ledger] = await Promise.all([listSubmissions(user.uid), listLedger(user.uid)]);
  return json({ profile, submissions, ledger }, { headers: { "Cache-Control": "private, no-store" } });
});

const PatchSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    bio: z.string().trim().max(140).optional(),
    language: z.enum(["en"]).optional(), // only English ships today
    showOnLeaderboard: z.boolean().optional(),
  })
  .strict();

export const PATCH = handle(async (req) => {
  const user = await requireUser(req);
  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "invalid-profile", "Please check the profile details and try again.");
  const { showOnLeaderboard, ...rest } = parsed.data;
  await updateEditableProfile(user.uid, {
    ...rest,
    ...(showOnLeaderboard === undefined ? {} : { leaderboardOptOut: !showOnLeaderboard }),
  });
  const record = await getUserRecord(user.uid);
  return json({ profile: toProfile(user.uid, record!) });
});
