"use client";

import Link from "next/link";
import { ArrowRight, Camera, LayoutDashboard, MapPin, User } from "lucide-react";
import { buttonClass } from "@/components/common/button";
import { useAppState } from "@/lib/store/app-store";

/** True once Firebase reports a fully signed-in (verified) user. */
export function useSignedIn(): boolean {
  const { hydrated, session } = useAppState();
  return hydrated && session.status === "signed-in";
}

/** Hero buttons: "Get Started / Log In" for visitors, app shortcuts for signed-in users. */
export function HeroCtas() {
  const signedIn = useSignedIn();
  if (signedIn) {
    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/recycle/capture" className={buttonClass({ size: "lg", className: "sm:min-w-52" })}>
          <Camera className="size-5" aria-hidden /> Recycle a Bottle
        </Link>
        <Link href="/dashboard" className={buttonClass({ variant: "secondary", size: "lg", className: "sm:min-w-44" })}>
          <LayoutDashboard className="size-5" aria-hidden /> Go to Dashboard
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link href="/signup" className={buttonClass({ size: "lg", className: "sm:min-w-52" })}>
        Get Started <ArrowRight className="size-5" aria-hidden />
      </Link>
      <Link href="/login" className={buttonClass({ variant: "secondary", size: "lg", className: "sm:min-w-44" })}>
        <User className="size-5" aria-hidden /> Log In
      </Link>
    </div>
  );
}

/** Closing call-to-action band. */
export function CtaBand() {
  const signedIn = useSignedIn();
  const outline = "border-[1.5px] border-white/70 bg-none bg-transparent text-white shadow-none hover:bg-white/10";
  return (
    <>
      <h2 className="text-3xl font-extrabold text-white">
        {signedIn ? "Ready for your next bottle?" : "Ready to recycle your first bottle?"}
      </h2>
      <p className="mt-3 text-green-50">
        {signedIn
          ? "Head to a BotleValor bin, take one photo and earn up to 3 points per report."
          : "Create an account in a minute and start earning points at bins around Dili."}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {signedIn ? (
          <>
            <Link href="/recycle/capture" className={buttonClass({ variant: "white", size: "lg" })}>
              <Camera className="size-5" aria-hidden /> Recycle a Bottle
            </Link>
            <Link href="/bins" className={buttonClass({ size: "lg", className: outline })}>
              <MapPin className="size-5" aria-hidden /> Find a Bin
            </Link>
          </>
        ) : (
          <>
            <Link href="/signup" className={buttonClass({ variant: "white", size: "lg" })}>
              Get Started <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link href="/login" className={buttonClass({ size: "lg", className: outline })}>
              Log In
            </Link>
          </>
        )}
      </div>
    </>
  );
}
