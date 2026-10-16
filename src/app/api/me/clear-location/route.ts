import { handle, json, requireUser } from "@/server/http";
import { clearLocationHistory } from "@/server/submissions";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  const user = await requireUser(req);
  const cleared = await clearLocationHistory(user.uid);
  return json({ cleared });
});
