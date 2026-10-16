import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EMAIL_PASSWORD_AUTH_ENABLED } from "@/lib/config";
import { AuthCardHeader, AuthLayout } from "@/components/auth/auth-layout";
import { OtpForm } from "@/components/auth/otp-form";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Email verification codes only exist for email + password sign-in, which is
  // switched off for now (Google-only). Google accounts never need this page.
  if (!EMAIL_PASSWORD_AUTH_ENABLED) redirect("/login");
  const params = await searchParams;
  const emailError = typeof params["email-error"] === "string" ? params["email-error"].slice(0, 200) : undefined;
  return (
    <AuthLayout
      badge="A Cleaner Dili, A Brighter Tomorrow"
      headline="Almost There!"
      accent="Verify Your Email."
      description="We've emailed you a 6-digit verification code. Check your inbox and enter the code to continue."
      motto="Small Actions. A Cleaner Timor."
    >
      <AuthCardHeader title="Check your email" subtitle={null} />
      <OtpForm initialError={emailError} />
    </AuthLayout>
  );
}
