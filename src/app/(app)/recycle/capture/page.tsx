import type { Metadata } from "next";
import { CaptureFlow } from "@/components/recycling/capture-flow";

export const metadata: Metadata = { title: "Recycle Now" };

export default function CapturePage() {
  return <CaptureFlow />;
}
