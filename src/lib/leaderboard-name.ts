/**
 * The only form of a user's name shown publicly: first name + last initial.
 * Never the email, and never a name that was auto-generated from the email.
 */
export function publicName(u: { name?: string; email?: string }): string {
  const raw = (u.name ?? "").trim();
  const emailLocal = (u.email ?? "").split("@")[0]?.toLowerCase();
  if (!raw || raw.toLowerCase() === emailLocal || raw.includes("@")) return "Recycler";
  const parts = raw.split(/\s+/).filter(Boolean);
  const first = parts[0].slice(0, 20);
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
  return `${first}${lastInitial}`;
}
