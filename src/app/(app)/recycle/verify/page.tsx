import type { Metadata } from "next";
import { VerificationFlow } from "@/components/recycling/verification-flow";

export const metadata: Metadata = { title: "Verification" };

export default function VerifyPage() {
  return <VerificationFlow />;
}
