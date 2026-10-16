import type { DateFormat, TimeFormat } from "@/lib/types";

const LOCALE = "en-GB";

/** Formats an ISO date using the user's date-format preference. */
export function formatDate(iso: string, format: DateFormat = "medium"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  if (format === "iso") {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  if (format === "dmy") {
    return d.toLocaleDateString(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(iso: string, format: TimeFormat = "24h"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: format === "12h",
  });
}

export function formatDateTime(iso: string, dateFormat: DateFormat = "medium", timeFormat: TimeFormat = "24h") {
  return `${formatDate(iso, dateFormat)} · ${formatTime(iso, timeFormat)}`;
}

export function formatPoints(points: number, withSign = false): string {
  const sign = withSign && points > 0 ? "+" : "";
  return `${sign}${points.toLocaleString("en")} ${Math.abs(points) === 1 ? "pt" : "pts"}`;
}

export function formatKg(kg: number): string {
  return `${kg < 10 ? kg.toFixed(2) : kg.toFixed(1)} kg`;
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "BV"
  );
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
