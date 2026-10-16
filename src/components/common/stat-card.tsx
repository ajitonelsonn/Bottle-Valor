import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/format";

export type StatTone = "gold" | "blue" | "green" | "violet" | "teal";

const TONES: Record<StatTone, { card: string; icon: string }> = {
  gold: { card: "bg-gold-50 border-gold-100", icon: "bg-gold-100 text-gold-600" },
  blue: { card: "bg-blue-50 border-blue-100", icon: "bg-white text-blue-600" },
  green: { card: "bg-green-50 border-green-100", icon: "bg-white text-green-600" },
  violet: { card: "bg-violet-50 border-violet-600/10", icon: "bg-white text-violet-600" },
  teal: { card: "bg-teal-50 border-teal-100", icon: "bg-white text-teal-600" },
};

export function StatCard({
  label,
  value,
  icon,
  tone = "blue",
  trend,
  href,
  footnote,
  className,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: StatTone;
  trend?: string;
  href?: string;
  footnote?: string;
  className?: string;
}) {
  const body = (
    <>
      <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", TONES[tone].icon)}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1.6rem] font-extrabold leading-tight text-navy-900 font-display">{value}</span>
        <span className="block text-sm text-muted">{label}</span>
        {trend ? (
          <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-green-700">
            <ArrowUp className="size-3.5" aria-hidden />
            {trend}
          </span>
        ) : null}
        {footnote ? <span className="mt-1 block text-[11px] text-subtle">{footnote}</span> : null}
      </span>
      {href ? <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden /> : null}
    </>
  );
  const classes = cn(
    "flex items-center gap-3.5 rounded-card border p-4 transition-shadow",
    TONES[tone].card,
    href && "hover:shadow-card",
    className,
  );
  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
