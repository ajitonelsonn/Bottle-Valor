"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { Button } from "@/components/common/button";
import { Dialog } from "@/components/common/dialog";
import { Checkbox, PasswordField, TextField } from "@/components/common/form-field";
import { InlineAlert } from "@/components/common/toast";
import { requestPasswordReset, signIn, signInWithGoogle } from "@/lib/firebase/auth-actions";
import { EMAIL_PASSWORD_AUTH_ENABLED } from "@/lib/config";
import { useAppState } from "@/lib/store/app-store";
import { GoogleButton } from "./google-button";
import { OrDivider } from "./auth-layout";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function LoginForm({ next, signedOut }: { next?: string; signedOut?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const { hydrated, session } = useAppState();

  // Already signed in (e.g. returning from Google's redirect flow) → continue.
  useEffect(() => {
    if (!hydrated) return;
    if (session.status === "signed-in") router.replace(safeNext(next));
    else if (session.status === "pending-verification" && !submitting) router.replace("/verify");
  }, [hydrated, session.status, next, router, submitting]);

  async function onGoogle() {
    if (googleBusy || submitting) return;
    setGoogleBusy(true);
    setErrors({});
    const result = await signInWithGoogle();
    if (!result.ok) {
      setErrors({ form: result.error });
      setGoogleBusy(false);
      return;
    }
    if (!result.redirected) router.push(safeNext(next));
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (submitting) return;
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) nextErrors.email = "Enter a valid email address, like name@example.com.";
    if (!password) nextErrors.password = "Enter your password.";
    else if (password.length < 6) nextErrors.password = "Passwords are at least 6 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    if (!result.ok) {
      setErrors({ form: result.error });
      setSubmitting(false);
      return;
    }
    router.push(result.needsVerification ? "/verify" : safeNext(next));
  }

  return (
    <>
      {signedOut ? (
        <InlineAlert tone="success" title="You've signed out" className="mb-5">
          You have been signed out. Log in again to continue.
        </InlineAlert>
      ) : null}
      {next && !signedOut ? (
        <InlineAlert tone="info" className="mb-5">
          Please sign in to continue.
        </InlineAlert>
      ) : null}

      {EMAIL_PASSWORD_AUTH_ENABLED ? (
      <>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {errors.form ? <InlineAlert tone="error">{errors.form}</InlineAlert> : null}
        <TextField
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Enter your email address"
          icon={<Mail className="size-5" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          icon={<Lock className="size-5" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Checkbox label="Remember me on this device" checked={remember} onChange={setRemember} />
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="min-h-10 rounded-lg px-1 text-sm font-semibold text-blue-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" size="lg" full loading={submitting} loadingText="Logging in…">
          Log in <ArrowRight className="size-5" aria-hidden />
        </Button>

      </form>

      <OrDivider />
      </>
      ) : errors.form ? (
        <InlineAlert tone="error" className="mb-4">
          {errors.form}
        </InlineAlert>
      ) : null}
      <GoogleButton onClick={onGoogle} loading={googleBusy} />
      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-green-700 hover:underline">
          Sign up
        </Link>
      </p>

      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} initialEmail={email} />
    </>
  );
}

function ForgotPasswordDialog({ open, onClose, initialEmail }: { open: boolean; onClose: () => void; initialEmail: string }) {
  return (
    <Dialog open={open} onClose={onClose} title="Reset your password" description="We'll help you get back into your account." size="sm">
      {open ? <ForgotPasswordBody onClose={onClose} initialEmail={initialEmail} /> : null}
    </Dialog>
  );
}

function ForgotPasswordBody({ onClose, initialEmail }: { onClose: () => void; initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (busy) return;
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setBusy(true);
    const result = await requestPasswordReset(email.trim());
    setBusy(false);
    if (!result.ok) setError(result.error);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <InlineAlert tone="success" title="Check your email">
          If an account exists for <strong>{email.trim()}</strong>, a password reset link is on its way. Check your spam
          folder if it doesn&apos;t arrive within a few minutes.
        </InlineAlert>
        <Button full onClick={onClose}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField
        label="Email address"
        type="email"
        autoComplete="email"
        icon={<Mail className="size-5" />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
      />
      <Button type="submit" full loading={busy} loadingText="Sending…">
        Send reset link
      </Button>
    </form>
  );
}
