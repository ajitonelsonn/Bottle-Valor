"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  /** Hide the visual title (still announced to screen readers). */
  hideTitle?: boolean;
  dismissible?: boolean;
};

const SIZES = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

/**
 * Accessible modal built on the native <dialog> element: focus is trapped,
 * Escape closes it, and focus returns to the trigger automatically.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  icon,
  hideTitle,
  dismissible = true,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-visible bg-transparent p-0 text-ink open:animate-pop-in",
        SIZES[size],
      )}
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-panel bg-white shadow-raised">
          <div className="flex items-start gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
            {icon ? <div className="shrink-0">{icon}</div> : null}
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className={cn("text-xl font-bold", hideTitle && "sr-only")}>
                {title}
              </h2>
              {description ? (
                <div id={descId} className="mt-1 text-sm text-muted">
                  {description}
                </div>
              ) : null}
            </div>
            {dismissible ? (
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 -mt-1 flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-navy-900"
                aria-label="Close dialog"
              >
                <X className="size-5" aria-hidden />
              </button>
            ) : null}
          </div>
          {children ? <div className="overflow-y-auto px-5 py-4 sm:px-6">{children}</div> : <div className="h-4" />}
          {footer ? (
            <div className="flex flex-col-reverse gap-2 border-t border-line bg-canvas/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
