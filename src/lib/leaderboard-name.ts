/**
 * The only form of a user's name shown publicly: first name + last initial.
 * Never the email, and never a name that looks derived from the email
 * (e.g. "nelsonajito" for nelsonajito123@…), which would leak the address.
 */
export function publicName(u: { name?: string; email?: string }): string {
  const raw = (u.name ?? "").trim();
  if (!raw || raw.includes("@")) return "Recycler";

  const parts = raw.split(/\s+/).filter(Boolean);
  const emailLocal = (u.email ?? "").split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  if (parts.length === 1 && emailLocal) {
    const single = parts[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const overlaps = single.length >= 4 && (emailLocal.startsWith(single) || single.startsWith(emailLocal));
    if (single === emailLocal || overlaps) return "Recycler";
  }

  const first = parts[0].slice(0, 20);
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
  return `${first}${lastInitial}`;
}
