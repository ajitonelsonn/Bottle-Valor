"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  FileText,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button, buttonClass } from "@/components/common/button";
import { EmptyState, ErrorState } from "@/components/common/states";
import { PointsCoin } from "@/components/common/points-coin";
import { ApiError, apiFetch } from "@/lib/api/client";
import { cn, formatPoints } from "@/lib/format";
import { VERIFICATION_STAGES, type VerificationStage } from "@/lib/services/recycling-service";
import { actions, getPendingCapture, useAppState } from "@/lib/store/app-store";
import type { Submission } from "@/lib/types";
import { EvidenceImage } from "./evidence-image";
import { PhotoTips } from "./photo-tips";
import { RecycleStepper } from "./recycle-stepper";
import { VerificationChecklist } from "./verification-checklist";

/** Uploads in progress — prevents duplicate requests (e.g. React StrictMode re-running effects). */
const inFlight = new Set<string>();

type UploadError = { message: string; retryable: boolean };

export function VerificationFlow() {
  const { activeSubmissionId, submissions, settings } = useAppState();
  const submission = submissions.find((s) => s.id === activeSubmissionId) ?? null;
  const pending = getPendingCapture();
  const pendingId = !submission && pending && pending.requestId === activeSubmissionId ? pending.requestId : null;
  const [stage, setStage] = useState<VerificationStage>("location");
  const [error, setError] = useState<UploadError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const storeLocation = settings.privacy.saveLocationWithSubmissions;

  useEffect(() => {
    const capture = getPendingCapture();
    if (!pendingId || !capture || capture.requestId !== pendingId || inFlight.has(pendingId)) return;
    inFlight.add(pendingId);
    // The server runs these steps in one request; advance the indicator while we wait.
    const timers = [window.setTimeout(() => setStage("image"), 1200), window.setTimeout(() => setStage("duplicates"), 6000)];
    const form = new FormData();
    form.append("photo", capture.photo, "evidence.jpg");
    form.append(
      "meta",
      JSON.stringify({
        requestId: capture.requestId, // idempotency key: retries never double-award
        binId: capture.binId,
        bottleCount: capture.bottleCount,
        location: capture.location,
        storeLocation,
      }),
    );
    apiFetch<{ submission: Submission }>("/api/submissions", { method: "POST", body: form })
      .then(({ submission: result }) => actions.receiveSubmission(result))
      .catch((err) => {
        const status = err instanceof ApiError ? err.status : 0;
        setError({
          message: err instanceof Error ? err.message : "Something went wrong.",
          retryable: status === 0 || status === 429 || status >= 500,
        });
      })
      .finally(() => {
        inFlight.delete(pendingId);
        timers.forEach((t) => window.clearTimeout(t));
      });
  }, [pendingId, attempt, storeLocation]);

  if (pendingId && error) {
    return (
      <div className="card mx-auto max-w-xl">
        <ErrorState
          title="We couldn't submit your report"
          description={error.message}
          action={
            <>
              {error.retryable ? (
                <Button
                  onClick={() => {
                    setError(null);
                    setStage("location");
                    setAttempt((a) => a + 1);
                  }}
                >
                  <RefreshCw className="size-4" aria-hidden /> Try again
                </Button>
              ) : null}
              <Link href="/recycle/capture" className={buttonClass({ variant: error.retryable ? "secondary" : "primary" })}>
                <Camera className="size-4" aria-hidden /> Retake photo
              </Link>
            </>
          }
        />
      </div>
    );
  }

  if (pendingId) {
    return (
      <div className="mx-auto max-w-xl">
        <Progress submissionId={pendingId} stage={stage} />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="card mx-auto max-w-xl">
        <EmptyState
          icon={<Camera className="size-7" aria-hidden />}
          title="Nothing to verify yet"
          description="Take a photo at a recycling bin first. Verification starts automatically after you submit."
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

  return (
    <div className="mx-auto max-w-xl">
      <Result submission={submission} />
    </div>
  );
}

function Progress({ submissionId, stage }: { submissionId: string; stage: VerificationStage }) {
  const activeIndex = VERIFICATION_STAGES.findIndex((s) => s.id === stage);
  return (
    <>
      <RecycleStepper current={1} />
      <div className="mt-6 text-center">
        <h1 className="text-[1.75rem] font-extrabold">Verifying your submission</h1>
        <p className="mt-1.5 text-muted">We&apos;re assessing your photo and location for the selected bin.</p>
      </div>
      <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-panel bg-navy-950 shadow-card">
        <EvidenceImage submissionId={submissionId} alt="Your evidence photo being assessed" />
        <span aria-hidden className="absolute inset-x-0 h-1 animate-scan bg-green-400 shadow-[0_0_24px_6px_rgba(76,194,124,0.7)]" />
      </div>
      <ol className="card mt-5 divide-y divide-line" aria-live="polite">
        {VERIFICATION_STAGES.map((s, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={s.id} className="flex items-start gap-3 p-4">
              {done ? (
                <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-green-600" aria-hidden />
              ) : active ? (
                <Loader2 className="mt-0.5 size-6 shrink-0 animate-spin text-green-600" aria-hidden />
              ) : (
                <span className="mt-0.5 size-6 shrink-0 rounded-full border-2 border-line" aria-hidden />
              )}
              <div>
                <p className={cn("font-semibold", done || active ? "text-navy-900" : "text-muted")}>
                  {i + 1}. {s.label}
                  <span className="sr-only">{done ? " — done" : active ? " — in progress" : " — waiting"}</span>
                </p>
                <p className="text-sm text-muted">{s.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
        <Sparkles className="size-5 shrink-0" aria-hidden />
        This may take a few seconds. Please keep this page open.
      </p>
    </>
  );
}

function Result({ submission }: { submission: Submission }) {
  const { ledger } = useAppState();
  const status = submission.status;
  const verified = status === "verified";
  const review = status === "needs-review";
  const credited = ledger.some((e) => e.submissionId === submission.id);

  const header = verified
    ? { Icon: CheckCircle2, tone: "bg-green-100 text-green-600", title: "Evidence appears consistent", color: "text-green-700" }
    : review
      ? { Icon: Eye, tone: "bg-warning-100 text-warning-600", title: "Needs review", color: "text-warning-700" }
      : { Icon: XCircle, tone: "bg-danger-100 text-danger-600", title: "Not verified", color: "text-danger-700" };

  return (
    <>
      <RecycleStepper current={verified ? 2 : 1} failedAt={status === "not-verified" ? 1 : undefined} />

      <div className="mt-6 text-center">
        <span className={cn("mx-auto flex size-20 animate-pop-in items-center justify-center rounded-full", header.tone)}>
          <header.Icon className="size-11" aria-hidden />
        </span>
        <h1 className={cn("mt-4 text-3xl font-extrabold", header.color)}>{header.title}</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">{submission.explanation}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,12rem)_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-blue-50 sm:aspect-auto">
          <EvidenceImage submissionId={submission.id} alt="Your evidence photo" hasPhoto={submission.hasPhoto} />
        </div>
        {submission.checks ? <VerificationChecklist checks={submission.checks} /> : null}
      </div>

      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
        <MapPin className="size-4 text-green-600" aria-hidden /> {submission.binName}
      </p>

      {verified ? (
        <div className="mt-5 flex items-center gap-4 rounded-card border border-gold-100 bg-gold-50 p-4">
          <PointsCoin size={56} />
          <div>
            <p className="text-sm font-semibold text-ink-soft">Points earned</p>
            <p className="font-display text-3xl font-extrabold text-navy-950">{formatPoints(submission.points, true)}</p>
            {credited ? <p className="text-xs text-muted">Added to your balance.</p> : null}
          </div>
        </div>
      ) : null}

      {status === "not-verified" ? (
        <>
          <div className="mt-5 flex gap-3 rounded-2xl border border-danger-100 bg-danger-50 p-4">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger-600" aria-hidden />
            <div className="text-sm">
              <p className="font-semibold text-danger-700">What went wrong</p>
              <p className="mt-0.5 text-ink-soft">
                The recycling bin wasn&apos;t clearly visible, or your location didn&apos;t match the selected bin. No
                points were added.
              </p>
            </div>
          </div>
          <PhotoTips className="mt-4" />
        </>
      ) : null}

      {review ? (
        <p className="mt-5 rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm text-ink-soft">
          Your submission is saved in your history as <strong>Needs review</strong>. No points are added until a reviewer
          confirms the evidence.
        </p>
      ) : null}

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-canvas px-3 py-2 text-xs text-ink-soft">
        <Info className="mt-px size-3.5 shrink-0 text-blue-600" aria-hidden />
        Assessed with Google Gemini and BotleValor&apos;s verification rules. A photo is evidence, not proof — reports may be
        spot-checked.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {verified ? (
          <>
            <Link href="/recycle/success" className={buttonClass({ size: "lg", full: true })}>
              See your points <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link href="/history" className={buttonClass({ variant: "secondary", size: "lg", full: true })}>
              <FileText className="size-5" aria-hidden /> View history
            </Link>
          </>
        ) : status === "not-verified" ? (
          <>
            <Link href="/recycle/capture" className={buttonClass({ size: "lg", full: true })}>
              <Camera className="size-5" aria-hidden /> Try again
            </Link>
            <Link href="/bins" className={buttonClass({ variant: "secondary", size: "lg", full: true })}>
              <MapPin className="size-5" aria-hidden /> Find nearby bins
            </Link>
          </>
        ) : (
          <>
            <Link href="/history" className={buttonClass({ size: "lg", full: true })}>
              <FileText className="size-5" aria-hidden /> View history
            </Link>
            <Link href="/recycle/capture" className={buttonClass({ variant: "secondary", size: "lg", full: true })}>
              <Camera className="size-5" aria-hidden /> Recycle another bottle
            </Link>
          </>
        )}
      </div>
    </>
  );
}
