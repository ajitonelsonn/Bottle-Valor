"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CameraOff, CheckCircle2, Laptop, MapPin, Smartphone, Tablet } from "lucide-react";
import { buttonClass } from "@/components/common/button";
import { Dialog } from "@/components/common/dialog";
import { PageHeader } from "@/components/common/page-header";
import { PHOTO_TIPS } from "./photo-tips";

/** Shown on laptops/desktops: the capture workflow is phone/tablet only. */
export function DesktopOnlyNotice() {
  const router = useRouter();
  return (
    <>
      <PageHeader title="Recycle Now" description="Take a photo at a recycling bin to earn points." />
      <div className="grid gap-5 lg:grid-cols-2" aria-hidden>
        <div className="card p-6 opacity-60">
          <p className="flex items-center gap-2 font-semibold text-green-700">
            <MapPin className="size-5" /> Selected bin
          </p>
          <div className="mt-4 h-40 rounded-2xl bg-blue-50" />
        </div>
        <div className="card p-6 opacity-60">
          <p className="font-display text-lg font-bold text-navy-900">Tips for a successful photo</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {PHOTO_TIPS.map((tip) => (
              <li key={tip} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" /> {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Dialog
        open
        onClose={() => router.push("/dashboard")}
        title="Please use a phone or tablet to recycle a bottle."
        hideTitle
        size="sm"
      >
        <div className="text-center">
          <div className="relative mx-auto flex h-36 w-56 items-center justify-center rounded-3xl bg-linear-to-b from-green-50 to-blue-50">
            <Laptop className="size-24 text-navy-800" strokeWidth={1.25} aria-hidden />
            <span className="absolute left-1/2 top-[38%] flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-danger-50 text-danger-600 ring-4 ring-white">
              <CameraOff className="size-5" aria-hidden />
            </span>
            <Smartphone className="absolute -right-2 bottom-4 size-12 rotate-6 text-green-600" strokeWidth={1.5} aria-hidden />
          </div>
          <p className="mt-5 font-display text-2xl font-extrabold leading-tight text-navy-900">
            Please use a phone or tablet to recycle a bottle.
          </p>
          <p className="mt-3 text-[0.95rem] text-muted">
            Recycle Now uses your device&apos;s camera and location to capture evidence at the bin, so it&apos;s only
            available on mobile phones and tablets. Open BotleValor on your phone when you&apos;re at a recycling bin.
          </p>
          <p className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-ink-soft">
            <Smartphone className="size-4 text-green-600" aria-hidden /> Phone
            <span className="text-subtle">or</span>
            <Tablet className="size-4 text-green-600" aria-hidden /> Tablet required
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/dashboard" className={buttonClass({ size: "lg", full: true })}>
              Back to dashboard
            </Link>
            <Link href="/bins" className={buttonClass({ variant: "secondary", size: "lg", full: true })}>
              <MapPin className="size-5" aria-hidden /> View recycling bins
            </Link>
          </div>
        </div>
      </Dialog>
    </>
  );
}
