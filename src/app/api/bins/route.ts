import { listBins } from "@/server/catalog";
import { handle, json } from "@/server/http";

export const dynamic = "force-dynamic";

/** Public: the recycling-bin map. */
export const GET = handle(async () => {
  const bins = await listBins();
  return json({ bins }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
});
