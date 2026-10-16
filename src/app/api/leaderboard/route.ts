import { handle, json } from "@/server/http";
import { listLeaderboard } from "@/server/leaderboard";

export const dynamic = "force-dynamic";

/** Public: top recyclers by points (first name + last initial only). */
export const GET = handle(async () => {
  const leaders = await listLeaderboard(10);
  return json({ leaders, updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=120" } });
});
