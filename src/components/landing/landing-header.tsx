"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonClass } from "@/components/common/button";
import { PublicLanguageSelect } from "@/components/layout/language-select";
import { useAppState } from "@/lib/store/app-store";
import { cn } from "@/lib/format";

const LINKS = [
  { href: "#top", label: "Home" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#bins", label: "Recycle Bins" },
  { href: "#rewards", label: "Rewards" },
  { href: "#leaderboard", label: "Leaderboard" },
  { href: "#about", label: "About" },
];

export function LandingHeader() {
  const { session } = useAppState();
  const [open, setOpen] = useState(false);
  const signedIn = session.status === "signed-in";

  const cta = signedIn ? (
    <Link href="/dashboard" className={buttonClass({ size: "md" })}>
      <LayoutDashboard className="size-4.5" aria-hidden /> Dashboard
    </Link>
  ) : (
    <Link href="/login" className={buttonClass({ size: "md" })}>
      <LogIn className="size-4.5" aria-hidden /> Log in
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <span className="sm:hidden">
          <BrandLogo href="#top" size="sm" showTagline={false} priority />
        </span>
        <span className="hidden sm:block">
          <BrandLogo href="#top" size="md" showTagline={false} priority />
        </span>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="flex min-h-11 items-center rounded-xl px-3.5 text-[0.95rem] font-medium text-ink-soft hover:bg-blue-50 hover:text-navy-900"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <PublicLanguageSelect />
          </div>
          <div className="hidden sm:block">{cta}</div>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl border border-line bg-white text-navy-900 lg:hidden"
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      <div id="landing-mobile-menu" hidden={!open} className={cn("border-t border-line bg-white px-4 pb-5 pt-2 lg:hidden")}>
        <nav aria-label="Mobile">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-xl px-3 font-medium text-ink-soft hover:bg-blue-50"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-3 flex items-center gap-2">
          <PublicLanguageSelect />
          <div className="flex-1 [&>a]:w-full">{cta}</div>
        </div>
      </div>
    </header>
  );
}
