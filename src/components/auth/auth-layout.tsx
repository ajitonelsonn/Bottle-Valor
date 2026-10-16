import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Gift, Leaf, Lock, Star } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { PublicLanguageSelect } from "@/components/layout/language-select";

const FEATURES = [
  { icon: Leaf, title: "Recycle bottles", body: "Use designated recycling bins around Dili.", tone: "bg-green-100 text-green-600" },
  { icon: Star, title: "Earn points", body: "Earn 1–3 points for each verified report.", tone: "bg-gold-100 text-gold-500" },
  { icon: Gift, title: "Future rewards", body: "Points for vouchers and benefits — coming soon.", tone: "bg-blue-100 text-blue-600" },
];

export function AuthLayout({
  headline,
  accent,
  description,
  motto = "A Cleaner Dili, A Brighter Tomorrow.",
  badge,
  children,
}: {
  headline: string;
  accent: string;
  description: ReactNode;
  motto?: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-linear-to-br from-white via-blue-50 to-green-50 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Visual panel (desktop) */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image src="/images/bg-image.png" alt="" fill loading="eager" sizes="(min-width: 1024px) 55vw, 1px" className="object-cover object-[72%_center]" />
        <div className="absolute inset-0 bg-linear-to-b from-white via-white/80 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-white/70 via-white/30 to-transparent" />
        <div className="relative flex h-full flex-col px-12 pb-10 pt-10 xl:px-16">
          <BrandLogo size="lg" priority />
          {badge ? (
            <p className="mt-10 inline-flex w-fit items-center gap-2 rounded-full bg-green-100/80 px-4 py-1.5 text-sm font-semibold text-green-800">
              <Leaf className="size-4" aria-hidden /> {badge}
            </p>
          ) : null}
          <p className={`${badge ? "mt-5" : "mt-14"} font-display text-5xl font-extrabold leading-[1.05] text-navy-900 xl:text-6xl`}>
            {headline}
            <br />
            <span className="text-green-600">{accent}</span>
          </p>
          <div className="mt-5 max-w-lg text-lg text-ink-soft">{description}</div>
          <ul className="mt-8 grid max-w-xl grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, body, tone }) => (
              <li key={title}>
                <span className={`flex size-14 items-center justify-center rounded-full ${tone}`}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <p className="mt-3 font-display font-bold text-navy-900">{title}</p>
                <p className="mt-1 text-sm text-ink-soft">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-auto flex w-fit items-center gap-3 rounded-2xl bg-green-800/70 px-5 py-4 font-display text-lg text-white backdrop-blur">
            <Leaf className="size-6" aria-hidden />
            {motto}
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <div className="flex min-h-dvh flex-col">
        <div className="relative lg:hidden">
          <div className="absolute inset-0 overflow-hidden">
            <Image src="/images/bg-image.png" alt="" fill loading="eager" sizes="(max-width: 1023px) 100vw, 1px" className="object-cover object-[70%_60%]" />
            <div className="absolute inset-0 bg-linear-to-b from-white/70 via-white/60 to-[#f5f9fd]" />
          </div>
          <div className="relative flex items-center justify-between px-4 pb-10 pt-4 sm:px-6">
            <Link href="/" className="flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-navy-900">
              <ArrowLeft className="size-4" aria-hidden /> Home
            </Link>
            <PublicLanguageSelect />
          </div>
        </div>

        <div className="hidden justify-between px-8 pt-6 lg:flex">
          <Link href="/" className="flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-navy-900 hover:text-green-700">
            <ArrowLeft className="size-4" aria-hidden /> Back to home
          </Link>
          <PublicLanguageSelect />
        </div>

        <main id="main-content" className="-mt-6 flex flex-1 flex-col items-center px-4 pb-10 sm:px-6 lg:mt-0 lg:justify-center lg:py-8">
          <div className="w-full max-w-auth rounded-panel border border-line bg-white px-5 py-7 shadow-raised sm:px-9 sm:py-9">
            {children}
          </div>
          <p className="mt-5 flex items-center gap-2 text-center text-xs text-muted">
            <Lock className="size-3.5" aria-hidden />
            Your account is protected by Firebase Authentication. We never ask for your password by email.
          </p>
        </main>
      </div>
    </div>
  );
}

export function AuthCardHeader({ title, subtitle }: { title: string; subtitle: ReactNode }) {
  return (
    <div className="mb-7 text-center">
      <BrandLogo variant="stacked" size="md" href="/" />
      <h1 className="mt-5 text-[1.7rem] font-extrabold">{title}</h1>
      <div className="mt-1.5 text-[0.95rem] text-muted">{subtitle}</div>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-4 text-sm text-muted" aria-hidden>
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
