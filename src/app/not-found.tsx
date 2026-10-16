import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonClass } from "@/components/common/button";

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-linear-to-br from-white via-blue-50 to-green-50 px-4 text-center">
      <BrandLogo size="md" />
      <span className="flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <MapPinOff className="size-8" aria-hidden />
      </span>
      <div>
        <h1 className="text-3xl font-extrabold">Page not found</h1>
        <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonClass({ size: "lg" })}>
          Go to home
        </Link>
        <Link href="/dashboard" className={buttonClass({ variant: "secondary", size: "lg" })}>
          Open dashboard
        </Link>
      </div>
    </main>
  );
}
