import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/format";
import { t } from "@/lib/i18n/messages";

type BrandLogoProps = {
  variant?: "horizontal" | "stacked" | "mark";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  href?: string | null;
  className?: string;
  /** Load the mark eagerly (above-the-fold placements). */
  priority?: boolean;
};

const MARK = { sm: 36, md: 48, lg: 72 };
const WORD = { sm: "text-xl", md: "text-[1.65rem]", lg: "text-4xl" };

/**
 * BotleValor brand lockup. Uses the supplied logo artwork (cropped mark from
 * `ilustration/logo.png`) with the wordmark set in the brand colours.
 */
export function BrandLogo({
  variant = "horizontal",
  size = "md",
  showTagline = true,
  href = "/",
  className,
  priority,
}: BrandLogoProps) {
  const markPx = MARK[size];
  const mark = (
    <Image
      src="/images/logo-mark.png"
      alt=""
      width={markPx}
      height={Math.round(markPx * (720 / 770))}
      className="logo-blend shrink-0"
      loading={priority ? "eager" : undefined}
      style={{ width: markPx, height: "auto" }}
      quality={90}
    />
  );

  const word = (
    <span className="flex flex-col leading-none">
      <span className={cn("font-display font-extrabold tracking-tight", WORD[size])}>
        <span className="text-navy-800">Botle</span>
        <span className="text-green-600">Valor</span>
      </span>
      {showTagline ? (
        <span className={cn("mt-1 font-medium text-muted", size === "lg" ? "text-sm" : "text-[0.68rem]")}>
          {t.brand.tagline}
        </span>
      ) : null}
    </span>
  );

  const content =
    variant === "mark" ? (
      mark
    ) : variant === "stacked" ? (
      <span className="flex flex-col items-center gap-2 text-center">
        {mark}
        {word}
      </span>
    ) : (
      <span className="flex items-center gap-2.5">
        {mark}
        {word}
      </span>
    );

  if (href === null) {
    return (
      <span className={cn("inline-flex", className)} aria-label={`${t.brand.name} — ${t.brand.tagline}`}>
        {content}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn("inline-flex rounded-xl", className)}
      aria-label={`${t.brand.name} home`}
    >
      {content}
    </Link>
  );
}
