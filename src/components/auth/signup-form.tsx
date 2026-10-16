"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/common/button";
import { Checkbox, PasswordField, TextField } from "@/components/common/form-field";
import { InlineAlert } from "@/components/common/toast";
import { EMAIL_PASSWORD_AUTH_ENABLED } from "@/lib/config";
import { signInWithGoogle, signUp } from "@/lib/firebase/auth-actions";
import { GoogleButton } from "./google-button";
import { OrDivider } from "./auth-layout";
import { LegalDialog, type LegalDoc } from "./legal-dialogs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<"name" | "email" | "password" | "confirm" | "terms" | "form", string>>;

export function SignupForm() {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [legal, setLegal] = useState<LegalDoc | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function onGoogle() {
    if (googleBusy || submitting) return;
    if (!agreed) {
      setErrors({ terms: "Please accept the Terms of Service and Privacy Policy." });
      return;
    }
    setGoogleBusy(true);
    setErrors({});
    const result = await signInWithGoogle();
    if (!result.ok) {
      setErrors({ form: result.error });
      setGoogleBusy(false);
      return;
    }
    if (!result.redirected) router.push("/dashboard");
  }

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function validate(): Errors {
    const next: Errors = {};
    if (values.name.trim().length < 2) next.name = "Enter your full name.";
    if (!EMAIL_RE.test(values.email.trim())) next.email = "Enter a valid email address, like name@example.com.";
    if (values.password.length < 6) next.password = "Use at least 6 characters.";
    if (!values.confirm) next.confirm = "Confirm your password.";
    else if (values.confirm !== values.password) next.confirm = "Passwords don't match.";
    if (!agreed) next.terms = "Please accept the Terms of Service and Privacy Policy.";
    return next;
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (submitting) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    const result = await signUp(values.name.trim(), values.email.trim(), values.password);
    if (!result.ok) {
      setErrors({ form: result.error });
      setSubmitting(false);
      return;
    }
    router.push(result.emailError ? `/verify?email-error=${encodeURIComponent(result.emailError)}` : "/verify");
  }

  return (
    <>
      {EMAIL_PASSWORD_AUTH_ENABLED ? (
        <>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {errors.form ? <InlineAlert tone="error">{errors.form}</InlineAlert> : null}
        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Enter your full name"
          icon={<User className="size-5" />}
          value={values.name}
          onChange={set("name")}
          error={errors.name}
        />
        <TextField
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Enter your email address"
          icon={<Mail className="size-5" />}
          value={values.email}
          onChange={set("email")}
          error={errors.email}
        />
        <PasswordField
          label="Password"
          name="new-password"
          autoComplete="new-password"
          placeholder="Create a password (min. 6 characters)"
          icon={<Lock className="size-5" />}
          value={values.password}
          onChange={set("password")}
          error={errors.password}
        />
        <PasswordField
          label="Confirm password"
          name="confirm-password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          icon={<Lock className="size-5" />}
          value={values.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
        />
        <Checkbox
          checked={agreed}
          onChange={setAgreed}
          error={errors.terms}
          label={
            <>
              I agree to the{" "}
              <button type="button" onClick={() => setLegal("terms")} className="font-semibold text-green-700 underline-offset-2 hover:underline">
                Terms of Service
              </button>{" "}
              and{" "}
              <button type="button" onClick={() => setLegal("privacy")} className="font-semibold text-green-700 underline-offset-2 hover:underline">
                Privacy Policy
              </button>
            </>
          }
        />
        <Button type="submit" size="lg" full loading={submitting} loadingText="Creating account…">
          Create account <ArrowRight className="size-5" aria-hidden />
        </Button>
      </form>


          <OrDivider />
        </>
      ) : (
        <div className="mb-4 space-y-4">
          {errors.form ? <InlineAlert tone="error">{errors.form}</InlineAlert> : null}
          <Checkbox
            checked={agreed}
            onChange={setAgreed}
            error={errors.terms}
            label={
              <>
                I agree to the{" "}
                <button type="button" onClick={() => setLegal("terms")} className="font-semibold text-green-700 underline-offset-2 hover:underline">
                    Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" onClick={() => setLegal("privacy")} className="font-semibold text-green-700 underline-offset-2 hover:underline">
                    Privacy Policy
                </button>
              </>
            }
          />
        </div>
      )}
      <GoogleButton onClick={onGoogle} loading={googleBusy} label="Sign up with Google" />
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-green-700 hover:underline">
          Log in
        </Link>
      </p>
      <LegalDialog doc={legal} onClose={() => setLegal(null)} />
    </>
  );
}
