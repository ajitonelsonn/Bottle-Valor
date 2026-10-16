"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import { NAV_ITEMS, isNavActive } from "./nav-items";

export function MobileNavigation() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.mobile);
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid h-bottomnav max-w-lg grid-cols-5">
        {items.map((item) => {
          const active = isNavActive(pathname, item);
          const Icon = item.icon;
          const primary = item.href === "/recycle/capture";
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                  active ? "text-green-700" : "text-muted hover:text-navy-900",
                )}
              >
                {primary ? (
                  <span
                    className={cn(
                      "-mt-6 flex size-13 items-center justify-center rounded-full border-4 border-white text-white shadow-button",
                      active ? "bg-green-700" : "bg-linear-to-br from-green-500 to-green-700",
                    )}
                  >
                    <Icon className="size-6" aria-hidden />
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                      active && "bg-green-100",
                    )}
                  >
                    <Icon className="size-[1.3rem]" aria-hidden />
                  </span>
                )}
                {item.shortLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
