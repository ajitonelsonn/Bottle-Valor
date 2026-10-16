import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronRight, MapPin } from "lucide-react";
import { MATERIALS } from "@/lib/materials";
import { cn } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import type { DistanceUnit, RecyclingBin } from "@/lib/types";

type BinCardProps = {
  bin: RecyclingBin;
  distanceMeters?: number;
  unit?: DistanceUnit;
  selected?: boolean;
  compact?: boolean;
  onSelect?: (id: string) => void;
  href?: string;
};

export function BinCard({ bin, distanceMeters, unit = "km", selected, compact, onSelect, href }: BinCardProps) {
  const content = (
    <>
      <span className={cn("relative shrink-0 overflow-hidden rounded-xl bg-blue-50", compact ? "size-14" : "h-18 w-22")}>
        <Image src={bin.imageUrl} alt="" fill sizes="96px" unoptimized={bin.imageUrl.endsWith(".svg")} className="object-cover" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-semibold text-navy-900">{bin.name}</span>
        {!bin.isSample ? (
          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
            <BadgeCheck className="size-3.5" aria-hidden /> Real location
          </span>
        ) : null}
        <span className="mt-0.5 flex items-center gap-1 text-sm text-muted">
          <MapPin className="size-3.5 shrink-0 text-green-600" aria-hidden />
          <span className="shrink-0 whitespace-nowrap">
            {distanceMeters !== undefined ? formatDistance(distanceMeters, unit) : bin.area}
          </span>
          {!compact && distanceMeters !== undefined ? <span className="min-w-0 truncate"> · {bin.area}</span> : null}
        </span>
        {!compact ? (
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            {bin.supportedMaterials.map((m) => (
              <span key={m} className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                {MATERIALS[m].shortLabel}
              </span>
            ))}
            {!bin.isActive ? (
              <span className="rounded-full bg-canvas px-2 py-0.5 font-medium text-muted ring-1 ring-line">Unavailable</span>
            ) : null}
          </span>
        ) : null}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </>
  );

  const classes = cn(
    "flex w-full items-center gap-3 rounded-2xl border p-2.5 pr-3 transition-colors",
    selected ? "border-green-400 bg-green-50" : "border-transparent hover:border-line hover:bg-canvas",
    !bin.isActive && "opacity-80",
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} aria-pressed={selected} onClick={() => onSelect?.(bin.id)}>
      {content}
    </button>
  );
}
