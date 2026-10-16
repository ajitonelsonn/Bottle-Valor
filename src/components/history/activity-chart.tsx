"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { SelectField } from "@/components/common/form-field";
import { cn } from "@/lib/format";
import type { Submission } from "@/lib/types";

type Bucket = { label: string; value: number };

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function bucketsFor(submissions: Submission[], key: string): Bucket[] {
  const [year, month] = key.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const short = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short" });
  const ranges = [
    [1, 7],
    [8, 14],
    [15, 21],
    [22, 28],
    [29, daysInMonth],
  ].filter(([start]) => start <= daysInMonth);
  return ranges.map(([start, end]) => ({
    label: `${short} ${start}–${end}`,
    value: submissions
      .filter((s) => {
        const d = new Date(s.createdAt);
        return s.status === "verified" && monthKey(d) === key && d.getDate() >= start && d.getDate() <= end;
      })
      .reduce((sum, s) => sum + s.bottleCount, 0),
  }));
}

/**
 * Single-series bar chart of verified bottles per week. One brand hue,
 * 4px rounded data-ends on the baseline, recessive grid, hover/focus
 * tooltip per bar and a screen-reader table.
 */
export function ActivityChart({ submissions }: { submissions: Submission[] }) {
  const months = useMemo(() => {
    const keys = Array.from(new Set(submissions.map((s) => monthKey(new Date(s.createdAt))))).sort().reverse();
    return keys.length ? keys : [monthKey(new Date())];
  }, [submissions]);
  const [month, setMonth] = useState(months[0]);
  const [active, setActive] = useState<number | null>(null);
  const selectedMonth = months.includes(month) ? month : months[0];
  const data = bucketsFor(submissions, selectedMonth);
  const max = Math.max(4, ...data.map((d) => d.value));
  const ticks = [0, Math.round(max / 2), max];
  const monthLabel = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <section className="card p-5" aria-labelledby="activity-chart-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="activity-chart-title" className="flex items-center gap-2 text-lg font-bold">
          <BarChart3 className="size-5 text-blue-600" aria-hidden /> Bottles verified per week
        </h2>
        <SelectField
          label="Month"
          hideLabel
          value={selectedMonth}
          onChange={(e) => {
            setMonth(e.target.value);
            setActive(null);
          }}
          options={months.map((m) => ({ value: m, label: monthLabel(m) }))}
          className="w-36"
        />
      </div>

      <div className="mt-5 flex gap-3" aria-hidden>
        <div className="flex h-44 flex-col justify-between pb-6 text-right text-xs tabular-nums text-subtle">
          {[...ticks].reverse().map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {t}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {[...ticks].reverse().map((t) => (
              <span key={t} className={cn("h-px w-full", t === 0 ? "bg-line-strong" : "bg-line")} />
            ))}
          </div>
          <div className="relative flex h-44 items-end gap-2 sm:gap-4">
            {data.map((d, i) => (
              <div key={d.label} className="relative flex h-full flex-1 flex-col items-center justify-end">
                <div className="relative flex w-full flex-1 items-end justify-center pb-0">
                  <span
                    className={cn(
                      "w-full max-w-12 rounded-t-[4px] transition-colors",
                      active === i ? "bg-green-700" : "bg-green-600",
                    )}
                    style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 4 : 0 }}
                  />
                  {d.value ? (
                    <span
                      className="absolute text-xs font-semibold tabular-nums text-ink-soft"
                      style={{ bottom: `calc(${(d.value / max) * 100}% + 4px)` }}
                    >
                      {d.value}
                    </span>
                  ) : null}
                  {active === i ? (
                    <span className="absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg bg-navy-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-raised">
                      {d.label}: {d.value} bottle{d.value === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  {/* Hit target larger than the bar */}
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-0"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onClick={() => setActive(active === i ? null : i)}
                    aria-hidden
                  />
                </div>
                <span className="mt-2 h-4 whitespace-nowrap text-[11px] text-muted sm:text-xs">{d.label.split(" ")[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Verified bottles per week in {monthLabel(selectedMonth)}</caption>
        <thead>
          <tr>
            <th scope="col">Week</th>
            <th scope="col">Bottles verified</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">Demo data · verified submissions only.</p>
    </section>
  );
}
