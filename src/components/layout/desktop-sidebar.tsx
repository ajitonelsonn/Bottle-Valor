"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { NAV_ITEMS, isNavActive } from "./nav-items";

export function DesktopSidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col overflow-hidden border-r border-line bg-linear-to-b from-white via-white to-blue-50 lg:flex">
      <div className="px-6 pb-6 pt-6">
        <BrandLogo href="/dashboard" size="md" priority />
      </div>
      <nav aria-label="Main navigation" className="px-4">
        <ul className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center gap-3.5 rounded-2xl px-4 text-[1.02rem] font-medium transition-colors",
                    active
                      ? "bg-green-100/70 font-semibold text-green-700"
                      : "text-ink-soft hover:bg-blue-50 hover:text-navy-900",
                  )}
                >
                  <Icon className={cn("size-[1.35rem]", active ? "text-green-600" : "text-muted")} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="relative mt-auto">
        <div className="relative z-10 flex items-center gap-3 px-6 pb-4">
          <span className="flex size-11 items-center justify-center rounded-full bg-white text-green-600 shadow-card">
            <Leaf className="size-5" aria-hidden />
          </span>
          <p className="font-display text-[1.05rem] font-medium leading-snug text-ink-soft">{t.brand.motto}</p>
        </div>
        <div className="relative h-48 [mask-image:linear-gradient(to_top,black_55%,transparent)]">
          <Image
            src="/images/bg-image.png"
            alt=""
            fill
            sizes="272px"
            className="object-cover object-[88%_70%]"
          />
        </div>
      </div>
    </aside>
  );
}
