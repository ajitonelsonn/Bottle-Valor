import { LEVELS } from "@/lib/config";
import { MATERIALS } from "@/lib/materials";
import type { LedgerEntry, Submission } from "@/lib/types";

/** Balance is always derived from the ledger, never edited directly. */
export function pointsBalance(ledger: LedgerEntry[]): number {
  return ledger.reduce((sum, e) => sum + e.points, 0);
}

function isSameMonth(iso: string, now: Date) {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function isWithinDays(iso: string, days: number, now: Date) {
  return now.getTime() - new Date(iso).getTime() <= days * 86400000;
}

export type RecyclingStats = {
  points: number;
  pointsThisMonth: number;
  pointsThisWeek: number;
  bottles: number;
  bottlesThisMonth: number;
  plasticKg: number;
  plasticKgThisMonth: number;
  co2Kg: number;
  co2KgThisMonth: number;
  daysActive: number;
  submissions: number;
};

export function computeStats(submissions: Submission[], ledger: LedgerEntry[], now = new Date()): RecyclingStats {
  const verified = submissions.filter((s) => s.status === "verified");
  const thisMonth = verified.filter((s) => isSameMonth(s.createdAt, now));
  const count = (list: Submission[]) => list.reduce((sum, s) => sum + s.bottleCount, 0);
  const kg = (list: Submission[]) => list.reduce((sum, s) => sum + MATERIALS[s.material].kgPerItem * s.bottleCount, 0);
  const co2 = (list: Submission[]) => list.reduce((sum, s) => sum + MATERIALS[s.material].co2KgPerItem * s.bottleCount, 0);
  const days = new Set(submissions.map((s) => s.createdAt.slice(0, 10)));
  return {
    points: pointsBalance(ledger),
    pointsThisMonth: ledger.filter((e) => isSameMonth(e.createdAt, now)).reduce((a, e) => a + e.points, 0),
    pointsThisWeek: ledger.filter((e) => isWithinDays(e.createdAt, 7, now)).reduce((a, e) => a + e.points, 0),
    bottles: count(verified),
    bottlesThisMonth: count(thisMonth),
    plasticKg: kg(verified),
    plasticKgThisMonth: kg(thisMonth),
    co2Kg: co2(verified),
    co2KgThisMonth: co2(thisMonth),
    daysActive: days.size,
    submissions: submissions.length,
  };
}

export function levelForPoints(points: number) {
  let index = 0;
  LEVELS.forEach((level, i) => {
    if (points >= level.minPoints) index = i;
  });
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const progress = next ? (points - current.minPoints) / (next.minPoints - current.minPoints) : 1;
  return { current, next, index, progress: Math.max(0, Math.min(1, progress)) };
}

export function sortByNewest<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
