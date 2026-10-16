/**
 * Points rule (single source of truth):
 * each verified report earns 1 point per bottle deposited,
 * with a minimum of 1 and a maximum of 3 points per report.
 *   1 bottle  → 1 pt
 *   2 bottles → 2 pts
 *   3+ bottles → 3 pts
 */
export const POINTS_RULE = {
  pointsPerBottle: 1,
  minPerReport: 1,
  maxPerReport: 3,
  /** Upper bound for the bottle counter in the capture UI. */
  maxBottlesPerReport: 10,
} as const;

export function pointsForReport(bottleCount: number): number {
  const bottles = Math.max(1, Math.floor(bottleCount || 0));
  return Math.min(POINTS_RULE.maxPerReport, Math.max(POINTS_RULE.minPerReport, bottles * POINTS_RULE.pointsPerBottle));
}

export const POINTS_RULE_TEXT = "Each verified report earns 1–3 points: 1 point per bottle, up to 3 points per report.";
