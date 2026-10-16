import "server-only";
import { publicName } from "@/lib/leaderboard-name";
import type { LeaderboardEntry } from "@/lib/types";
import { usersCol, type UserRecord } from "./users";

/**
 * Public leaderboard by points. Privacy:
 * - only first name + last initial are exposed (never email or full name);
 * - names auto-derived from an email address are replaced with "Recycler";
 * - users who opted out in Settings are excluded;
 * - only verified accounts with points are listed.
 */
export async function listLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const snap = await usersCol()
    .where("points", ">", 0)
    .orderBy("points", "desc")
    .limit(limit * 3)
    .get();

  return snap.docs
    .map((doc) => doc.data() as UserRecord)
    .filter((u) => u.emailVerified && u.leaderboardOptOut !== true)
    .sort(
      (a, b) =>
        b.points - a.points ||
        (b.bottlesRecycled ?? 0) - (a.bottlesRecycled ?? 0) ||
        (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0),
    )
    .slice(0, limit)
    .map((u, i) => {
      const name = publicName(u);
      return { rank: i + 1, name, initials: initialsOf(name), points: u.points, bottles: u.bottlesRecycled ?? 0 };
    });
}

function initialsOf(name: string): string {
  return (
    name
      .replace(/\./g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "R"
  );
}
