import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

export type ButtonVariant = "primary" | "secondary" | "soft" | "ghost" | "danger" | "danger-outline" | "white";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-linear-to-r from-green-500 to-green-700 text-white shadow-button hover:from-green-600 hover:to-green-800 disabled:from-green-400 disabled:to-green-400 disabled:shadow-none",
  secondary:
    "border-[1.5px] border-navy-900 bg-white text-navy-900 hover:bg-blue-50 disabled:border-line-strong disabled:text-subtle",
  soft: "bg-green-50 text-green-800 hover:bg-green-100 disabled:text-subtle",
  ghost: "text-ink-soft hover:bg-canvas hover:text-navy-900 disabled:text-subtle",
  danger: "bg-danger-600 text-white hover:bg-danger-700 disabled:bg-danger-100 disabled:text-danger-700",
  "danger-outline":
    "border-[1.5px] border-danger-600 bg-white text-danger-600 hover:bg-danger-50 disabled:border-line-strong disabled:text-subtle",
  white: "bg-white text-green-700 hover:bg-green-50 shadow-card",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3.5 text-sm gap-1.5 rounded-control",
  md: "min-h-11 px-5 text-[0.95rem] gap-2 rounded-control",
  lg: "min-h-13 px-6 text-base gap-2.5 rounded-2xl",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  full = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; full?: boolean; className?: string } = {}) {
  return cn(
    "inline-flex select-none items-center justify-center font-semibold transition-colors duration-150 disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    full && "w-full",
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  loading?: boolean;
  loadingText?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, full, loading, loadingText, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass({ variant, size, full, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
});
