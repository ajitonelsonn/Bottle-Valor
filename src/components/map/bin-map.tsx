"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LocateFixed, Loader2, MapPinOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/common/button";
import { LoadingState } from "@/components/common/states";
import { cn } from "@/lib/format";
import type { BinMapClientProps } from "./bin-map-client";

// Leaflet touches `window`, so the map only renders on the client.
const BinMapClient = dynamic(() => import("./bin-map-client"), {
  ssr: false,
  loading: () => <LoadingState label="Loading map…" className="h-full bg-blue-50" />,
});

type BinMapProps = Omit<BinMapClientProps, "onTileError"> & {
  className?: string;
  /** Called by the locate button; omit to hide the button. */
  onLocate?: () => void;
  locating?: boolean;
  showLegend?: boolean;
  label?: string;
};

const TILE_ERROR_THRESHOLD = 4;

export function BinMap({ className, onLocate, locating, showLegend = true, label = "Map of recycling bins in Dili", ...props }: BinMapProps) {
  const [tileErrors, setTileErrors] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const failed = tileErrors >= TILE_ERROR_THRESHOLD;

  return (
    <section aria-label={label} className={cn("relative isolate overflow-hidden rounded-card border border-line bg-blue-50", className)}>
      <BinMapClient key={attempt} {...props} onTileError={() => setTileErrors((n) => n + 1)} />

      {onLocate ? (
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          className="absolute right-3 top-3 z-[1000] flex size-11 items-center justify-center rounded-xl border border-line bg-white text-navy-900 shadow-card hover:bg-blue-50 disabled:text-subtle"
          aria-label="Use my location"
          title="Use my location"
        >
          {locating ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <LocateFixed className="size-5" aria-hidden />}
        </button>
      ) : null}

      {showLegend ? (
        <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex flex-wrap items-center gap-3 rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-ink-soft shadow-card">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-green-700 ring-2 ring-gold-500" /> Real bin
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-green-400 ring-2 ring-white" /> Sample bin
          </span>
          {props.userLocation ? (
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-blue-600 ring-2 ring-white" /> You
            </span>
          ) : null}
        </div>
      ) : null}

      {failed ? (
        <div className="absolute inset-0 z-[1100] flex flex-col items-center justify-center gap-3 bg-white/95 p-6 text-center" role="alert">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
            <MapPinOff className="size-6" aria-hidden />
          </span>
          <p className="font-display text-lg font-bold text-navy-900">The map couldn&apos;t load</p>
          <p className="max-w-xs text-sm text-muted">
            OpenStreetMap tiles aren&apos;t loading. Check your internet connection — you can still use the bin list.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setTileErrors(0);
              setAttempt((a) => a + 1);
            }}
          >
            <RefreshCw className="size-4" aria-hidden /> Try again
          </Button>
        </div>
      ) : null}
    </section>
  );
}
