"use client";

import { Globe } from "lucide-react";
import { useToast } from "@/components/common/toast";
import { LANGUAGES } from "@/lib/i18n/messages";
import { actions, useAppState } from "@/lib/store/app-store";
import type { LanguageCode } from "@/lib/types";
import { cn } from "@/lib/format";

/**
 * Compact language picker. Only English ships today; the other
 * languages are listed (disabled) to show where localisation will plug in.
 */
export function LanguageSelect({ className }: { className?: string }) {
  const { settings } = useAppState();
  const { notify } = useToast();
  return (
    <label
      className={cn(
        "relative flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-white pl-3 pr-2 text-sm font-semibold text-navy-900 shadow-card focus-within:ring-4 focus-within:ring-blue-100",
        className,
      )}
    >
      <Globe className="size-4 text-blue-600" aria-hidden />
      <span className="sr-only">Language</span>
      <select
        value={settings.language}
        onChange={(e) => {
          const code = e.target.value as LanguageCode;
          actions.updateSettings((s) => ({ ...s, language: code }));
          notify({ tone: "info", title: "Language updated", body: "More languages are coming soon." });
        }}
        className="cursor-pointer appearance-none bg-transparent pr-1 font-semibold focus:outline-none"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} disabled={!l.available}>
            {l.short}
            {l.available ? "" : " — soon"}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Static variant for public pages (no app state). */
export function PublicLanguageSelect({ className }: { className?: string }) {
  return (
    <label
      className={cn(
        "flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-white/90 pl-3 pr-2 text-sm font-semibold text-navy-900 shadow-card backdrop-blur focus-within:ring-4 focus-within:ring-blue-100",
        className,
      )}
    >
      <Globe className="size-4 text-blue-600" aria-hidden />
      <span className="sr-only">Language</span>
      <select defaultValue="en" className="cursor-pointer appearance-none bg-transparent pr-1 font-semibold focus:outline-none">
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} disabled={!l.available}>
            {l.short}
            {l.available ? "" : " — soon"}
          </option>
        ))}
      </select>
    </label>
  );
}
