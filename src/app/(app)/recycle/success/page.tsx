import type { Metadata } from "next";
import { SuccessView } from "@/components/recycling/success-view";

export const metadata: Metadata = { title: "Points earned" };

export default function SuccessPage() {
  return <SuccessView />;
}
