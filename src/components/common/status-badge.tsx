import { CheckCircle2, Clock, Eye, XCircle } from "lucide-react";
import { t } from "@/lib/i18n/messages";
import { cn } from "@/lib/format";
import type { SubmissionStatus } from "@/lib/types";

const STYLES: Record<SubmissionStatus, { className: string; Icon: typeof CheckCircle2 }> = {
  verified: { className: "bg-green-50 text-green-700 ring-green-100", Icon: CheckCircle2 },
  "needs-review": { className: "bg-warning-50 text-warning-700 ring-warning-100", Icon: Eye },
  "not-verified": { className: "bg-danger-50 text-danger-700 ring-danger-100", Icon: XCircle },
  pending: { className: "bg-blue-50 text-blue-700 ring-blue-100", Icon: Clock },
};

export function StatusBadge({ status, className }: { status: SubmissionStatus; className?: string }) {
  const { className: tone, Icon } = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {t.status[status]}
    </span>
  );
}
