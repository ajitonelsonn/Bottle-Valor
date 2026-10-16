"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Check, ClipboardList, Copy, MapPin, Milk, Ruler, Star } from "lucide-react";
import { Button } from "@/components/common/button";
import { Dialog } from "@/components/common/dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDateTime, formatPoints } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import { MATERIALS } from "@/lib/materials";
import { useAppState } from "@/lib/store/app-store";
import { EvidenceImage } from "./evidence-image";
import { submissionTitle } from "./submission-card";
import { VerificationChecklist } from "./verification-checklist";

export function SubmissionDetailsDialog({ submissionId, onClose }: { submissionId: string | null; onClose: () => void }) {
  const { submissions, settings } = useAppState();
  const submission = submissions.find((s) => s.id === submissionId) ?? null;
  const [copied, setCopied] = useState(false);

  async function copyId() {
    if (!submission) return;
    try {
      await navigator.clipboard.writeText(submission.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog
      open={!!submission}
      onClose={onClose}
      title="Submission details"
      description={submission ? submissionTitle(submission) : undefined}
      size="lg"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {submission ? (
        <div className="grid gap-5 sm:grid-cols-[minmax(0,15rem)_1fr]">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-blue-50">
              <EvidenceImage submissionId={submission.id} alt="Recycling evidence" hasPhoto={submission.hasPhoto} />
              <StatusBadge status={submission.status} className="absolute right-2 top-2 shadow-card" />
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <Row icon={<CalendarDays className="size-4.5" />} label="Date & time">
              {formatDateTime(submission.createdAt, settings.dateFormat, settings.timeFormat)}
            </Row>
            <Row icon={<MapPin className="size-4.5" />} label="Recycling bin">
              <span className="block">{submission.binName}</span>
              <Link href={`/bins?bin=${encodeURIComponent(submission.binId)}`} className="font-semibold text-blue-600 hover:underline" onClick={onClose}>
                View on map
              </Link>
            </Row>
            <Row icon={<Milk className="size-4.5" />} label="Material">
              {MATERIALS[submission.material].label}
              <span className="block text-muted">
                {submission.bottleCount} bottle{submission.bottleCount === 1 ? "" : "s"} reported
                {submission.bottleCountEstimated !== undefined ? ` · ${submission.bottleCountEstimated} detected` : ""}
              </span>
            </Row>
            <Row icon={<Star className="size-4.5" />} label="Points">
              <span className={submission.points > 0 ? "font-bold text-green-700" : undefined}>
                {formatPoints(submission.points, true)}
              </span>
              {submission.status === "needs-review" ? <span className="block text-xs text-muted">Points are added only if the review passes.</span> : null}
            </Row>
            {submission.distanceToBinMeters !== undefined ? (
              <Row icon={<Ruler className="size-4.5" />} label="Device distance">
                {formatDistance(submission.distanceToBinMeters, settings.distanceUnit)} from the bin (at capture)
              </Row>
            ) : null}
            <Row icon={<ClipboardList className="size-4.5" />} label="Submission ID">
              <span className="flex items-center gap-2">
                <code className="text-xs">{submission.id}</code>
                <button
                  type="button"
                  onClick={copyId}
                  className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-navy-900"
                  aria-label={copied ? "Submission ID copied" : "Copy submission ID"}
                >
                  {copied ? <Check className="size-4 text-green-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                </button>
              </span>
            </Row>
          </dl>

          {submission.checks ? (
            <div className="sm:col-span-2">
              <h3 className="mb-2 text-base font-bold">Evidence checks</h3>
              {submission.explanation ? <p className="mb-3 text-sm text-ink-soft">{submission.explanation}</p> : null}
              <VerificationChecklist checks={submission.checks} />
              <p className="mt-2 text-xs text-muted">
                Checks assess photo and location evidence; they can&apos;t prove a deposit on their own.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
      <span className="mt-0.5 text-blue-600" aria-hidden>
        {icon}
      </span>
      <dt className="w-28 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 font-medium text-ink">{children}</dd>
    </div>
  );
}
