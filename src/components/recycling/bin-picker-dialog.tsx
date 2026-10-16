"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "@/components/common/button";
import { Dialog } from "@/components/common/dialog";
import { cn } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import type { BinWithDistance } from "@/lib/services/bin-service";
import type { DistanceUnit } from "@/lib/types";

export function BinPickerDialog({
  open,
  onClose,
  bins,
  selectedId,
  onSelect,
  unit,
  fromLabel,
}: {
  open: boolean;
  onClose: () => void;
  bins: BinWithDistance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  unit: DistanceUnit;
  fromLabel: string;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Choose a recycling bin"
      description={`Pick the bin you're recycling at. Distances from ${fromLabel}.`}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      }
    >
      <ul className="space-y-1.5" aria-label="Recycling bins">
        {bins.map((bin) => {
          const selected = bin.id === selectedId;
          return (
            <li key={bin.id}>
              <button
                type="button"
                disabled={!bin.isActive}
                aria-pressed={selected}
                onClick={() => {
                  onSelect(bin.id);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  selected ? "border-green-400 bg-green-50" : "border-line hover:bg-canvas",
                )}
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-blue-50">
                  <Image src={bin.imageUrl} alt="" fill sizes="48px" unoptimized={bin.imageUrl.endsWith(".svg")} className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-navy-900">{bin.name}</span>
                  <span className="block text-sm text-muted">
                    {bin.isActive ? formatDistance(bin.distanceMeters, unit) : "Temporarily unavailable"}
                  </span>
                </span>
                {selected ? <Check className="size-5 text-green-600" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
