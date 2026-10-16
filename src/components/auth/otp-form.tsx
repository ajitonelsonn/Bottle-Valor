"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ClipboardEvent, type SubmitEvent, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { LoadingState } from "@/components/common/states";
import { Button, buttonClass } from "@/components/common/button";
import { InlineAlert, useToast } from "@/components/common/toast";
import { cn } from "@/lib/format";
import { resendCode, verifyCode } from "@/lib/firebase/auth-actions";
import { useAppState } from "@/lib/store/app-store";
import { OrDivider } from "./auth-layout";

const LENGTH = 6;
const RESEND_SECONDS = 60;

export function OtpForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const { session, hydrated } = useAppState();
  const email = session.status === "signed-out" ? null : session.email;
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  function focusBox(index: number) {
    const el = inputs.current[Math.max(0, Math.min(LENGTH - 1, index))];
    el?.focus();
    el?.select();
  }

  function setDigit(index: number, value: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function onChange(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      setDigit(index, "");
      return;
    }
    if (clean.length > 1) {
      fill(index, clean);
      return;
    }
    setError(null);
    setDigit(index, clean);
    if (index < LENGTH - 1) focusBox(index + 1);
  }

  function fill(start: number, text: string) {
    const chars = text.replace(/\D/g, "").slice(0, LENGTH - start).split("");
    if (!chars.length) return;
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, i) => (next[start + i] = c));
      return next;
    });
    setError(null);
    focusBox(start + chars.length);
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      setDigit(index - 1, "");
      focusBox(index - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(index + 1);
    }
  }

  function onPaste(index: number, e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    fill(index, e.clipboardData.getData("text"));
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (submitting) return;
    const code = digits.join("");
    if (code.length < LENGTH) {
      setError("Enter all 6 digits of the code.");
      focusBox(digits.findIndex((d) => !d));
      return;
    }
    setSubmitting(true);
    const result = await verifyCode(code);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    notify({ tone: "success", title: "Email verified", body: "Welcome to BotleValor!" });
    router.push("/dashboard");
  }

  async function resend() {
    if (resending || secondsLeft > 0) return;
    setResending(true);
    const result = await resendCode();
    setResending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setSecondsLeft(RESEND_SECONDS);
    setDigits(Array(LENGTH).fill(""));
    focusBox(0);
    notify({ tone: "success", title: "New code sent", body: `Check ${email ?? "your inbox"} — the code expires in 10 minutes.` });
  }

  if (!hydrated) return <LoadingState label="Loading…" />;
  if (session.status === "signed-in") {
    return (
      <InlineAlert tone="success" title="Your email is already verified">
        <Link href="/dashboard" className="font-semibold text-green-800 underline">
          Continue to your dashboard
        </Link>
      </InlineAlert>
    );
  }
  if (session.status === "signed-out") {
    return (
      <>
        <InlineAlert tone="info" title="Please log in first">
          Log in or create an account, and we&apos;ll email you a verification code.
        </InlineAlert>
        <div className="mt-5 flex flex-col gap-3">
          <Link href="/login" className={buttonClass({ size: "lg", full: true })}>
            Log in
          </Link>
          <Link href="/signup" className={buttonClass({ variant: "secondary", size: "lg", full: true })}>
            Create an account
          </Link>
        </div>
      </>
    );
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <>
      <p className="-mt-3 mb-6 text-center text-[0.95rem] text-muted">
        We&apos;ve sent a 6-digit verification code to
        <br />
        <strong className="font-semibold text-navy-900">{email ?? "your email address"}</strong>.
        <br />
        Enter the code below to continue.
      </p>

      <form onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend className="sr-only">Verification code</legend>
          <div className="flex justify-between gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={d}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={(e) => onPaste(i, e)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                pattern="[0-9]*"
                maxLength={LENGTH}
                aria-label={`Digit ${i + 1} of ${LENGTH}`}
                aria-invalid={error ? true : undefined}
                autoFocus={i === 0}
                className={cn(
                  "aspect-[4/5] w-full min-w-0 max-w-16 rounded-2xl border-2 bg-white text-center font-display text-2xl font-bold text-navy-900 transition-colors",
                  "focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100",
                  error ? "border-danger-600" : d ? "border-green-400" : "border-line-strong",
                )}
              />
            ))}
          </div>
        </fieldset>
        {error ? (
          <p role="alert" className="mt-3 text-center text-sm font-medium text-danger-700">
            {error}
          </p>
        ) : null}

        <p className="mt-5 text-center text-sm text-muted" aria-live="polite">
          Didn&apos;t receive the code?{" "}
          {secondsLeft > 0 ? (
            <>
              Resend in <span className="font-semibold tabular-nums text-green-700">{mm}:{ss}</span>
            </>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={resending}
              className="min-h-10 rounded-lg px-1 font-semibold text-green-700 hover:underline disabled:text-subtle"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          )}
        </p>

        <Button type="submit" size="lg" full loading={submitting} loadingText="Verifying…" className="mt-5">
          Verify email <ArrowRight className="size-5" aria-hidden />
        </Button>
        <p className="mt-3 flex items-start justify-center gap-2 text-center text-xs text-muted">
          <Info className="mt-px size-3.5 shrink-0 text-blue-600" aria-hidden />
          The code expires in 10 minutes. Check your spam folder if it doesn&apos;t arrive.
        </p>
      </form>

      <OrDivider />
      <Link href="/login" className={buttonClass({ variant: "secondary", size: "lg", full: true })}>
        <ArrowLeft className="size-5" aria-hidden /> Back to login
      </Link>
    </>
  );
}
