import type { Metadata } from "next";
import { AuthCardHeader, AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <AuthLayout
      headline="Join BotleValor"
      accent="Make Dili Cleaner."
      description="Create your account, start recycling plastic bottles at designated bins, earn points, and help build a cleaner and healthier Timor-Leste."
    >
      <AuthCardHeader
        title="Create your account"
        subtitle="Join BotleValor and start making a positive impact in your community."
      />
      <SignupForm />
    </AuthLayout>
  );
}
