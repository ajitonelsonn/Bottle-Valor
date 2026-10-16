import { describe, expect, it } from "vitest";
import { POINTS_RULE, pointsForReport } from "@/lib/points";

describe("pointsForReport", () => {
  it("awards 1 point per bottle", () => {
    expect(pointsForReport(1)).toBe(1);
    expect(pointsForReport(2)).toBe(2);
  });
  it("caps at 3 points per report", () => {
    expect(pointsForReport(3)).toBe(3);
    expect(pointsForReport(10)).toBe(POINTS_RULE.maxPerReport);
    expect(pointsForReport(1000)).toBe(3);
  });
  it("never awards less than 1 or fractional points", () => {
    expect(pointsForReport(0)).toBe(1);
    expect(pointsForReport(-5)).toBe(1);
    expect(pointsForReport(2.9)).toBe(2);
    expect(pointsForReport(Number.NaN)).toBe(1);
  });
});
