"use client";

import { cn } from "@/lib/format";

export function Switch({
  checked,
  onChange,
  label,
  describedBy,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  describedBy?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        "before:absolute before:-inset-2 before:content-['']",
        checked ? "bg-green-600" : "bg-line-strong",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-5.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[1.375rem]" : "translate-x-[0.25rem]",
        )}
      />
    </button>
  );
}
