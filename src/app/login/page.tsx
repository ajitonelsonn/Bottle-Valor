import type { Metadata } from "next";
import { AuthCardHeader, AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const signedOut = params["signed-out"] === "1";
  return (
    <AuthLayout
      headline="Small Actions"
      accent="Make a Big Difference."
      description="Recycle plastic bottles at designated bins around Dili, earn points, and help create a cleaner and healthier Timor-Leste."
    >
      <AuthCardHeader title="Welcome back" subtitle="Log in to continue recycling and earning points." />
      <LoginForm next={next} signedOut={signedOut} />
    </AuthLayout>
  );
}
