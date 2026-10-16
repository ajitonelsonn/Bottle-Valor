import { cn } from "@/lib/format";

export function ProgressBar({
  value,
  max,
  label,
  className,
  tone = "green",
}: {
  value: number;
  max: number;
  label: string;
  className?: string;
  tone?: "green" | "gold";
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-line", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700",
          tone === "green" ? "bg-linear-to-r from-green-500 to-green-700" : "bg-linear-to-r from-gold-400 to-gold-600",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
