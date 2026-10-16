import { HttpError, handle, requireUser } from "@/server/http";
import { readSubmissionPhoto } from "@/server/storage";
import { getSubmissionPhotoPath } from "@/server/submissions";

export const dynamic = "force-dynamic";

/** Streams the owner's own evidence photo. Photos are never public. */
export const GET = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  const path = await getSubmissionPhotoPath(user.uid, id); // scoped to the caller's own submissions
  const bytes = path ? await readSubmissionPhoto(path) : null;
  if (!bytes) throw new HttpError(404, "not-found", "Photo not found.");
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=300" },
  });
});
