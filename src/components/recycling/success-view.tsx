"use client";

import Link from "next/link";
import { CalendarDays, Camera, CheckCircle2, ClipboardList, FileText, Leaf, MapPin, Milk } from "lucide-react";
import { buttonClass } from "@/components/common/button";
import { PointsCoin } from "@/components/common/points-coin";
import { ProgressBar } from "@/components/common/progress-bar";
import { EmptyState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDateTime, formatPoints } from "@/lib/format";
import { MATERIALS } from "@/lib/materials";
import { pointsBalance } from "@/lib/selectors";
import { featuredReward, useRewards } from "@/lib/data/catalog";
import { useAppState } from "@/lib/store/app-store";
import { RecycleStepper } from "./recycle-stepper";

const CONFETTI = [
  "left-[8%] top-[12%] bg-gold-400 rotate-12",
  "left-[16%] top-[24%] bg-blue-500 -rotate-12",
  "left-[30%] top-[6%] bg-green-400 rotate-45",
  "right-[10%] top-[16%] bg-blue-500 rotate-12",
  "right-[18%] top-[26%] bg-gold-400 -rotate-45",
  "right-[32%] top-[4%] bg-green-500 rotate-6",
];

/**
 * Celebration screen. It only DISPLAYS the result — points were credited
 * once, through the ledger, when verification completed.
 */
export function SuccessView() {
  const { activeSubmissionId, submissions, ledger, settings } = useAppState();
  const rewardsRes = useRewards();
  const submission = submissions.find((s) => s.id === activeSubmissionId);

  if (!submission || submission.status !== "verified") {
    return (
      <div className="card mx-auto max-w-xl">
        <EmptyState
          icon={<Camera className="size-7" aria-hidden />}
          title="No verified submission to show"
          description="When a recycling submission is verified, your points summary appears here."
          action={
            <>
              <Link href="/recycle/capture" className={buttonClass()}>
                Recycle a bottle
              </Link>
              <Link href="/history" className={buttonClass({ variant: "secondary" })}>
                View history
              </Link>
            </>
          }
        />
      </div>
    );
  }

  const total = pointsBalance(ledger);
  const reward = featuredReward(rewardsRes.status === "ready" ? rewardsRes.data : undefined);

  return (
    <div className="mx-auto max-w-xl">
      <RecycleStepper current={3} />

      <section className="relative mt-6 overflow-hidden rounded-panel bg-linear-to-b from-blue-50 via-white to-green-50 px-5 pb-6 pt-8 text-center shadow-card" aria-labelledby="success-title">
        {CONFETTI.map((c) => (
          <span key={c} aria-hidden className={`absolute h-2.5 w-4 rounded-sm opacity-80 ${c}`} />
        ))}
        <PointsCoin size={110} className="relative mx-auto animate-pop-in" />
        <h1 id="success-title" className="relative mt-4 text-4xl font-extrabold">
          Great job!
        </h1>
        <p className="relative mx-auto mt-2 max-w-sm text-muted">
          Evidence appears consistent with recycling at the selected bin. Thank you for helping keep Dili clean.
        </p>

        <div className="relative mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl bg-green-100/70 p-4">
            <p className="text-sm font-semibold text-green-800">You earned</p>
            <p className="font-display text-3xl font-extrabold text-green-700">{formatPoints(submission.points, true)}</p>
          </div>
          <div className="rounded-2xl bg-gold-50 p-4 ring-1 ring-gold-100">
            <p className="text-sm font-semibold text-ink-soft">New balance</p>
            <p className="font-display text-3xl font-extrabold text-navy-950">{formatPoints(total)}</p>
          </div>
        </div>
        <p className="relative mt-3 text-center text-xs text-muted">1 point per bottle, up to 3 points per report. Points have no monetary value.</p>
      </section>

      <section className="card mt-5 p-5" aria-labelledby="summary-title">
        <h2 id="summary-title" className="text-lg font-bold">
          Submission summary
        </h2>
        <dl className="mt-3 divide-y divide-line text-sm">
          <SummaryRow icon={<MapPin className="size-4.5" />} label="Recycling bin" value={submission.binName} />
          <SummaryRow
            icon={<CalendarDays className="size-4.5" />}
            label="Date & time"
            value={formatDateTime(submission.createdAt, settings.dateFormat, settings.timeFormat)}
          />
          <SummaryRow
            icon={<Milk className="size-4.5" />}
            label="Material"
            value={`${MATERIALS[submission.material].label} × ${submission.bottleCount}`}
          />
          <SummaryRow icon={<CheckCircle2 className="size-4.5" />} label="Status" value={<StatusBadge status={submission.status} />} />
          <SummaryRow icon={<ClipboardList className="size-4.5" />} label="Submission ID" value={<code className="text-xs">{submission.id}</code>} />
        </dl>
      </section>

      {reward ? (
      <section className="card mt-5 p-5" aria-label="Progress to next reward">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p>
            <span className="block text-muted">Next reward</span>
            <span className="font-bold text-navy-900">{reward.title}</span>
          </p>
          <p className="font-semibold tabular-nums text-ink-soft">
            {Math.min(total, reward.pointsRequired)} / {reward.pointsRequired} pts
          </p>
        </div>
        <ProgressBar value={total} max={reward.pointsRequired} label={`Progress toward ${reward.title}`} className="mt-3" />
        <p className="mt-2 text-xs text-muted">Rewards are coming soon — redemption isn&apos;t available yet.</p>
      </section>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <Link href="/recycle/capture" className={buttonClass({ size: "lg", full: true })}>
          <Camera className="size-5" aria-hidden /> Recycle another bottle
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/bins" className={buttonClass({ variant: "secondary", size: "lg", className: "whitespace-nowrap px-3" })}>
            <MapPin className="size-5" aria-hidden /> Find bins
          </Link>
          <Link href="/history" className={buttonClass({ variant: "secondary", size: "lg", className: "whitespace-nowrap px-3" })}>
            <FileText className="size-5" aria-hidden /> View history
          </Link>
        </div>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
        <Leaf className="size-4 text-green-600" aria-hidden /> Small actions make a cleaner and healthier Timor-Leste.
      </p>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-blue-600" aria-hidden>
        {icon}
      </span>
      <dt className="w-28 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 font-medium text-ink">{value}</dd>
    </div>
  );
}
