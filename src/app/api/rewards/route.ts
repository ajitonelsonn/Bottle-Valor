import { listRewards } from "@/server/catalog";
import { handle, json } from "@/server/http";

export const dynamic = "force-dynamic";

/** Public: reward catalogue (redemption disabled). */
export const GET = handle(async () => {
  const rewards = await listRewards();
  return json({ rewards }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
});
