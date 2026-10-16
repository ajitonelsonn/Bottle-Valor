"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { BadgeCheck, Camera, Crosshair, ExternalLink, FlaskConical, MapPin, Navigation, Ruler } from "lucide-react";
import { Button, buttonClass } from "@/components/common/button";
import { Dialog } from "@/components/common/dialog";
import { MATERIAL_LIST } from "@/lib/materials";
import { cn } from "@/lib/format";
import { formatCoordinates, formatDistance, osmDirectionsUrl } from "@/lib/geo";
import { actions } from "@/lib/store/app-store";
import type { DistanceUnit, GeoPoint, RecyclingBin } from "@/lib/types";

type BinDetailsProps = {
  bin: RecyclingBin;
  distanceMeters: number;
  distanceFromLabel: string;
  userLocation: GeoPoint | null;
  unit: DistanceUnit;
  showImage?: boolean;
};

/** Shared bin detail content used by the desktop panel and the mobile dialog. */
export function BinDetails({ bin, distanceMeters, distanceFromLabel, userLocation, unit, showImage = true }: BinDetailsProps) {
  const router = useRouter();

  function recycleHere() {
    actions.selectBin(bin.id);
    router.push("/recycle/capture");
  }

  return (
    <div>
      {showImage ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-blue-50">
          <Image src={bin.imageUrl} alt={bin.isSample ? `Sample illustration of ${bin.name}` : `Photo of ${bin.name}`} fill sizes="(min-width: 1024px) 380px, 90vw" unoptimized={bin.imageUrl.endsWith(".svg")} className="object-cover" />
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-green-700 shadow-card">
            <MapPin className="size-4" aria-hidden />
            {formatDistance(distanceMeters, unit)}
          </span>
        </div>
      ) : null}

      <div className={cn("flex items-start justify-between gap-3", showImage && "mt-4")}>
        <div>
          <h3 className="text-xl font-bold">{bin.name}</h3>
          <p className="text-sm text-muted">{bin.area}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            bin.isActive ? "bg-green-50 text-green-700" : "bg-canvas text-muted ring-1 ring-line",
          )}
        >
          <span className={cn("size-2 rounded-full", bin.isActive ? "bg-green-600" : "bg-subtle")} />
          {bin.isActive ? "Active" : "Unavailable"}
        </span>
      </div>

      {bin.isSample ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-dashed border-violet-600/30 bg-violet-50 px-3 py-2 text-xs text-ink-soft">
          <FlaskConical className="mt-px size-3.5 shrink-0 text-violet-600" aria-hidden />
          Sample bin. The position and photo are illustrative — not an official bin location.
        </p>
      ) : (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-xs text-ink-soft">
          <BadgeCheck className="mt-px size-3.5 shrink-0 text-green-600" aria-hidden />
          Real bin location confirmed by the BotleValor team.
        </p>
      )}
      {bin.description && !bin.isSample ? <p className="mt-3 text-sm text-ink-soft">{bin.description}</p> : null}

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-start gap-2.5">
          <Crosshair className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
          <div>
            <dt className="text-muted">Latitude, longitude</dt>
            <dd className="font-medium tabular-nums text-ink">{formatCoordinates(bin.latitude, bin.longitude)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Ruler className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
          <div>
            <dt className="text-muted">Distance</dt>
            <dd className="font-medium text-ink">
              {formatDistance(distanceMeters, unit)} <span className="font-normal text-muted">from {distanceFromLabel}</span>
            </dd>
          </div>
        </div>
      </dl>

      <p className="mt-4 text-sm font-semibold text-navy-900">Accepted materials</p>
      <ul className="mt-2 grid grid-cols-4 gap-2">
        {MATERIAL_LIST.map((m) => {
          const accepted = bin.supportedMaterials.includes(m.id);
          return (
            <li
              key={m.id}
              className={cn(
                "rounded-xl border px-1.5 py-2 text-center text-xs font-medium",
                accepted ? "border-blue-100 bg-blue-50 text-blue-700" : "border-line text-subtle",
              )}
            >
              {m.shortLabel}
              <span className="sr-only">{accepted ? " — accepted" : " — not accepted yet"}</span>
              {!accepted ? <span className="block text-[10px]" aria-hidden>Soon</span> : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-col gap-2">
        <Button onClick={recycleHere} disabled={!bin.isActive} full>
          <Camera className="size-4.5" aria-hidden /> {bin.isActive ? "Recycle here" : "Bin unavailable"}
        </Button>
        <a
          href={osmDirectionsUrl(bin, userLocation)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass({ variant: "secondary", full: true })}
        >
          <Navigation className="size-4.5" aria-hidden /> Get directions
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(opens OpenStreetMap in a new tab)</span>
        </a>
      </div>
    </div>
  );
}

export function BinDetailsDialog({
  open,
  onClose,
  ...details
}: Partial<BinDetailsProps> & { open: boolean; onClose: () => void } & Pick<BinDetailsProps, "unit" | "userLocation" | "distanceFromLabel">) {
  const { bin, distanceMeters } = details;
  return (
    <Dialog open={open && !!bin} onClose={onClose} title={bin?.name ?? "Bin details"} hideTitle>
      {bin && distanceMeters !== undefined ? <BinDetails {...details} bin={bin} distanceMeters={distanceMeters} /> : null}
    </Dialog>
  );
}
