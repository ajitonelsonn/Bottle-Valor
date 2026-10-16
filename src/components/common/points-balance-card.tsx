import Link from "next/link";
import { ArrowUp, ChevronRight } from "lucide-react";
import { cn, formatPoints } from "@/lib/format";
import { PointsCoin } from "./points-coin";

export function PointsBalanceCard({
  points,
  trend,
  caption = "Your points",
  href,
  note,
  className,
  size = "md",
}: {
  points: number;
  trend?: string;
  caption?: string;
  href?: string;
  note?: string;
  className?: string;
  size?: "md" | "lg";
}) {
  const content = (
    <>
      <PointsCoin size={size === "lg" ? 92 : 72} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ink-soft">{caption}</p>
        </div>
        <p
          className={cn(
            "font-display font-extrabold leading-none text-navy-950",
            size === "lg" ? "mt-1 text-5xl" : "mt-1 text-[2.6rem]",
          )}
        >
          {points.toLocaleString("en")}
          <span className="ml-1.5 text-xl font-bold text-ink-soft">pts</span>
        </p>
        {trend ? (
          <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-green-700">
            <ArrowUp className="size-4" aria-hidden />
            {trend}
          </p>
        ) : null}
        {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
      </div>
      {href ? <ChevronRight className="size-6 shrink-0 text-gold-600" aria-hidden /> : null}
    </>
  );
  const classes = cn(
    "flex items-center gap-4 rounded-card border border-gold-100 bg-linear-to-br from-gold-50 to-[#fff3d6] p-5",
    href && "transition-shadow hover:shadow-card",
    className,
  );
  return href ? (
    <Link href={href} className={classes} aria-label={`${formatPoints(points)} — view history`}>
      {content}
    </Link>
  ) : (
    <section className={classes} aria-label="Points balance">
      {content}
    </section>
  );
}
