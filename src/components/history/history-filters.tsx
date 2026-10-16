"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/common/button";
import { SelectField } from "@/components/common/form-field";
import { inputClass } from "@/components/common/form-field";
import { AVAILABLE_MATERIALS } from "@/lib/materials";
import type { MaterialId, SubmissionStatus } from "@/lib/types";

export type DateRange = "all" | "7d" | "30d" | "month" | "custom";

export type HistoryFilterState = {
  search: string;
  status: "all" | SubmissionStatus;
  material: "all" | MaterialId;
  range: DateRange;
  from: string;
  to: string;
};

export const DEFAULT_FILTERS: HistoryFilterState = {
  search: "",
  status: "all",
  material: "all",
  range: "all",
  from: "",
  to: "",
};

export function isFiltered(f: HistoryFilterState) {
  return JSON.stringify(f) !== JSON.stringify(DEFAULT_FILTERS);
}

export function HistoryFilters({
  value,
  onChange,
}: {
  value: HistoryFilterState;
  onChange: (next: HistoryFilterState) => void;
}) {
  const set = <K extends keyof HistoryFilterState>(key: K, v: HistoryFilterState[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <label className="relative">
          <span className="sr-only">Search by bin or submission ID</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            value={value.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Search bin or submission ID…"
            className={inputClass(false, true) + " min-h-11"}
          />
        </label>
        <SelectField
          label="Status"
          hideLabel
          value={value.status}
          onChange={(e) => set("status", e.target.value as HistoryFilterState["status"])}
          options={[
            { value: "all", label: "All statuses" },
            { value: "verified", label: "Verified" },
            { value: "needs-review", label: "Needs review" },
            { value: "not-verified", label: "Not verified" },
            { value: "pending", label: "Pending" },
          ]}
        />
        <SelectField
          label="Material"
          hideLabel
          value={value.material}
          onChange={(e) => set("material", e.target.value as HistoryFilterState["material"])}
          options={[{ value: "all", label: "All materials" }, ...AVAILABLE_MATERIALS.map((m) => ({ value: m.id, label: m.label }))]}
        />
        <SelectField
          label="Date range"
          hideLabel
          value={value.range}
          onChange={(e) => set("range", e.target.value as DateRange)}
          options={[
            { value: "all", label: "All time" },
            { value: "7d", label: "Last 7 days" },
            { value: "30d", label: "Last 30 days" },
            { value: "month", label: "This month" },
            { value: "custom", label: "Custom range…" },
          ]}
        />
      </div>
      {value.range === "custom" ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-ink-soft">
            From
            <input
              type="date"
              value={value.from}
              max={value.to || undefined}
              onChange={(e) => set("from", e.target.value)}
              className={inputClass() + " mt-1 min-h-11"}
            />
          </label>
          <label className="text-sm font-medium text-ink-soft">
            To
            <input
              type="date"
              value={value.to}
              min={value.from || undefined}
              onChange={(e) => set("to", e.target.value)}
              className={inputClass() + " mt-1 min-h-11"}
            />
          </label>
        </div>
      ) : null}
      {isFiltered(value) ? (
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
          <X className="size-4" aria-hidden /> Clear filters
        </Button>
      ) : null}
    </div>
  );
}

export function applyHistoryFilters<T extends { id: string; binName: string; status: SubmissionStatus; material: MaterialId; createdAt: string }>(
  items: T[],
  f: HistoryFilterState,
  now = new Date(),
): T[] {
  const q = f.search.trim().toLowerCase();
  const fromTime = f.from ? new Date(`${f.from}T00:00:00`).getTime() : null;
  const toTime = f.to ? new Date(`${f.to}T23:59:59`).getTime() : null;
  return items.filter((s) => {
    const t = new Date(s.createdAt).getTime();
    if (f.status !== "all" && s.status !== f.status) return false;
    if (f.material !== "all" && s.material !== f.material) return false;
    if (q && !s.binName.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
    if (f.range === "7d" && now.getTime() - t > 7 * 86400000) return false;
    if (f.range === "30d" && now.getTime() - t > 30 * 86400000) return false;
    if (f.range === "month") {
      const d = new Date(s.createdAt);
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
    }
    if (f.range === "custom") {
      if (fromTime !== null && t < fromTime) return false;
      if (toTime !== null && t > toTime) return false;
    }
    return true;
  });
}
