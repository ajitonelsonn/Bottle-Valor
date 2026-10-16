"use client";

import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { cn, formatDateTime, formatPoints } from "@/lib/format";
import { useAppState } from "@/lib/store/app-store";
import type { Submission } from "@/lib/types";
import { EvidenceImage } from "./evidence-image";

export function submissionTitle(s: Submission): string {
  switch (s.status) {
    case "verified":
      return `${s.bottleCount} plastic bottle${s.bottleCount === 1 ? "" : "s"} recycled`;
    case "needs-review":
      return "Submission under review";
    case "not-verified":
      return "Submission not verified";
    default:
      return "Verification pending";
  }
}

export function SubmissionCard({
  submission,
  onOpen,
  compact,
}: {
  submission: Submission;
  onOpen: (id: string) => void;
  compact?: boolean;
}) {
  const { settings } = useAppState();
  return (
    <button
      type="button"
      onClick={() => onOpen(submission.id)}
      className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-canvas"
      aria-label={`${submissionTitle(submission)} at ${submission.binName}, ${formatDateTime(submission.createdAt, settings.dateFormat, settings.timeFormat)}. View details`}
    >
      <span className={cn("relative shrink-0 overflow-hidden rounded-xl bg-blue-50", compact ? "size-12" : "size-14")}>
        <EvidenceImage submissionId={submission.id} alt="" hasPhoto={submission.hasPhoto} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-navy-900">{submissionTitle(submission)}</span>
        <span className="block truncate text-sm text-muted">{submission.binName}</span>
        <span className="block text-xs text-subtle">{formatDateTime(submission.createdAt, settings.dateFormat, settings.timeFormat)}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {submission.status === "verified" ? (
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-sm font-bold text-green-700">
            {formatPoints(submission.points, true)}
          </span>
        ) : (
          <StatusBadge status={submission.status} />
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </button>
  );
}
