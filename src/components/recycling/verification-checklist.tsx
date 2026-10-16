import { AlertCircle, CheckCircle2, Hand, MapPin, Milk, Trash2, XCircle } from "lucide-react";
import { cn } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import type { CheckOutcome, VerificationCheck, VerificationCheckId } from "@/lib/types";

const CHECK_ICONS: Record<VerificationCheckId, typeof Hand> = {
  "gps-proximity": MapPin,
  "bottle-detected": Milk,
  "hand-visible": Hand,
  "bin-context": Trash2,
};

const OUTCOME: Record<CheckOutcome, { Icon: typeof CheckCircle2; className: string; row: string; sr: string }> = {
  pass: { Icon: CheckCircle2, className: "text-green-600", row: "", sr: "passed" },
  fail: { Icon: XCircle, className: "text-danger-600", row: "bg-danger-50", sr: "failed" },
  uncertain: { Icon: AlertCircle, className: "text-warning-600", row: "bg-warning-50", sr: "unclear" },
};

export function VerificationChecklist({
  checks,
  showDetails = true,
  className,
}: {
  checks: VerificationCheck[];
  showDetails?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-line rounded-2xl border border-line bg-white", className)}>
      {checks.map((check) => {
        const Icon = CHECK_ICONS[check.id];
        const o = OUTCOME[check.outcome];
        return (
          <li key={check.id} className={cn("flex items-start gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl", o.row)}>
            <Icon className="mt-0.5 size-5 shrink-0 text-ink-soft" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {t.checks[check.id]}
                <span className="sr-only"> — {o.sr}</span>
              </p>
              {showDetails ? <p className="text-sm text-muted">{check.detail}</p> : null}
            </div>
            <o.Icon className={cn("mt-0.5 size-5 shrink-0", o.className)} aria-hidden />
          </li>
        );
      })}
    </ul>
  );
}
