"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, List, LocateFixed, Map as MapIcon, Milk, Search, X } from "lucide-react";
import Link from "next/link";
import { Button, buttonClass } from "@/components/common/button";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/states";
import { InlineAlert } from "@/components/common/toast";
import { BinMap } from "@/components/map/bin-map";
import { cn } from "@/lib/format";
import { DEMO_REFERENCE_POINT, DILI_CENTER, distanceInMeters } from "@/lib/geo";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";
import { MATERIAL_LIST } from "@/lib/materials";
import { retryBins, useBins } from "@/lib/data/catalog";
import { sortByDistance } from "@/lib/services/bin-service";
import { useAppState } from "@/lib/store/app-store";
import type { MaterialId } from "@/lib/types";
import { BinCard } from "./bin-card";
import { BinDetails, BinDetailsDialog } from "./bin-details";

export function BinsExplorer({ initialBinId }: { initialBinId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useAppState();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const geo = useGeolocation();

  const load = useBins();
  const [query, setQuery] = useState("");
  const [material, setMaterial] = useState<"all" | MaterialId>("all");
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedId, setSelectedId] = useState<string | null>(initialBinId ?? null);
  const [dialogOpen, setDialogOpen] = useState(!!initialBinId);

  const locationAllowed = settings.privacy.useLocation;
  const reference = geo.position ?? DEMO_REFERENCE_POINT;
  const fromLabel = geo.position ? "your location" : DEMO_REFERENCE_POINT.label;
  const farFromDili =
    !!geo.position && distanceInMeters(geo.position, { latitude: DILI_CENTER[0], longitude: DILI_CENTER[1] }) > 60000;

  const allBins = useMemo(() => (load.status === "ready" ? sortByDistance(load.data, reference) : []), [load, reference]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allBins.filter(
      (b) =>
        (material === "all" || b.supportedMaterials.includes(material)) &&
        (!q || b.name.toLowerCase().includes(q) || b.area.toLowerCase().includes(q)),
    );
  }, [allBins, query, material]);
  const selected = allBins.find((b) => b.id === selectedId) ?? null;

  function select(id: string) {
    setSelectedId(id);
    setDialogOpen(true);
    router.replace(`${pathname}?bin=${encodeURIComponent(id)}`, { scroll: false });
  }

  function closeDialog() {
    setDialogOpen(false);
    router.replace(pathname, { scroll: false });
  }

  function clearFilters() {
    setQuery("");
    setMaterial("all");
  }

  const toolbar = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search bins by name or area</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bin name or area…"
            className="min-h-12 w-full rounded-2xl border border-line-strong bg-white pl-11 pr-10 text-[0.95rem] shadow-card placeholder:text-subtle focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-canvas"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </label>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={geo.request}
            loading={geo.status === "requesting"}
            loadingText="Locating…"
            disabled={!locationAllowed}
            title={locationAllowed ? undefined : "Location is turned off in Settings"}
            className="flex-1 sm:flex-none"
          >
            <LocateFixed className="size-4.5" aria-hidden /> {geo.position ? "Update location" : "Near me"}
          </Button>
          <div role="group" aria-label="View" className="flex rounded-control border border-line-strong bg-white p-1">
            {(
              [
                { id: "map", label: "Map", Icon: MapIcon },
                { id: "list", label: "List", Icon: List },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => setView(id)}
                className={cn(
                  "flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold",
                  view === id ? "bg-green-600 text-white" : "text-ink-soft hover:bg-canvas",
                )}
              >
                <Icon className="size-4" aria-hidden /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div role="group" aria-label="Filter by material" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          aria-pressed={material === "all"}
          onClick={() => setMaterial("all")}
          className={chipClass(material === "all")}
        >
          <LayoutGrid className="size-4" aria-hidden /> All bins
        </button>
        {MATERIAL_LIST.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={material === m.id}
            disabled={!m.available}
            onClick={() => setMaterial(m.id)}
            className={chipClass(material === m.id, !m.available)}
          >
            {m.id === "plastic-bottle" ? <Milk className="size-4" aria-hidden /> : null}
            {m.shortLabel}
            {!m.available ? <span className="rounded-full bg-canvas px-1.5 text-[10px] uppercase">Soon</span> : null}
          </button>
        ))}
      </div>
    </div>
  );

  const alerts = (
    <div className="space-y-3 empty:hidden">
      {!locationAllowed ? (
        <InlineAlert
          tone="info"
          title="Location is turned off"
          action={
            <Link href="/settings" className={buttonClass({ variant: "secondary", size: "sm" })}>
              Open settings
            </Link>
          }
        >
          Turn on &ldquo;Use my location&rdquo; in Settings to see distances from where you are.
        </InlineAlert>
      ) : null}
      {geo.status === "denied" || geo.status === "unavailable" || geo.status === "unsupported" ? (
        <InlineAlert
          tone="warning"
          title={geo.status === "denied" ? "Location permission denied" : "Location unavailable"}
          action={
            geo.status !== "unsupported" ? (
              <Button size="sm" variant="secondary" onClick={geo.request}>
                Try again
              </Button>
            ) : undefined
          }
        >
          {geo.message} Distances are shown from {DEMO_REFERENCE_POINT.label}.
        </InlineAlert>
      ) : null}
      {farFromDili ? (
        <InlineAlert tone="info" title="You appear to be outside Dili">
          Distances are measured from your real location. All bins are in Dili.
        </InlineAlert>
      ) : null}
    </div>
  );

  function renderList(className?: string) {
    if (load.status === "loading") return <LoadingState label="Loading bins…" />;
    if (load.status === "error")
      return (
        <ErrorState
          title="Couldn't load bins"
          description="Check your connection and try again."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                retryBins();
              }}
            >
              Try again
            </Button>
          }
        />
      );
    if (!allBins.length)
      return (
        <EmptyState
          title="No bins published yet"
          description="Recycling bins will appear here once they are added."
        />
      );
    if (!filtered.length)
      return (
        <EmptyState
          icon={<Search className="size-7" aria-hidden />}
          title="No bins match your search"
          description="Try a different name or area, or clear the filters."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      );
    return (
      <ul className={cn("space-y-1.5", className)}>
        {filtered.map((bin) => (
          <li key={bin.id}>
            <BinCard
              bin={bin}
              distanceMeters={bin.distanceMeters}
              unit={settings.distanceUnit}
              selected={bin.id === selectedId}
              onSelect={select}
            />
          </li>
        ))}
      </ul>
    );
  }

  const detailProps = {
    distanceFromLabel: fromLabel,
    userLocation: geo.position,
    unit: settings.distanceUnit,
  };
  const selectedWithDistance = selected ? allBins.find((b) => b.id === selected.id) : undefined;

  return (
    <>
      <PageHeader title="Recycling Bin Map" description="Find nearby recycling bins and help keep Dili clean." />

      <div className="space-y-4">
        {toolbar}
        {geo.position ? null : (
          <p className="flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm text-ink-soft">
            <LocateFixed className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden />
            <span>Distances are from {DEMO_REFERENCE_POINT.label} until you tap &ldquo;Near me&rdquo;.</span>
          </p>
        )}
        {alerts}

        {view === "map" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]">
            <BinMap
              bins={filtered}
              selectedId={selectedId}
              onSelect={select}
              userLocation={geo.position}
              onLocate={locationAllowed ? geo.request : undefined}
              locating={geo.status === "requesting"}
              className="h-[52vh] min-h-80 lg:h-[calc(100dvh-17rem)] lg:min-h-[32rem]"
            />
            <div className="flex flex-col gap-4">
              <section className="card flex flex-col p-3 lg:max-h-[24rem]" aria-labelledby="nearby-title">
                <h2 id="nearby-title" className="px-2 pb-2 pt-1 text-lg font-bold">
                  Nearby recycling bins
                  {load.status === "ready" ? <span className="ml-2 text-sm font-medium text-muted">({filtered.length})</span> : null}
                </h2>
                <div className="min-h-0 overflow-y-auto">{renderList()}</div>
              </section>
              {isDesktop && selectedWithDistance ? (
                <section className="card shrink-0 p-4" aria-label="Selected bin">
                  <BinDetails bin={selectedWithDistance} distanceMeters={selectedWithDistance.distanceMeters} showImage={false} {...detailProps} />
                </section>
              ) : null}
            </div>
          </div>
        ) : (
          <section className="card p-3 sm:p-4" aria-label="Bin list">
            {load.status === "ready" && filtered.length ? (
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((bin) => (
                  <li key={bin.id} className="rounded-2xl border border-line">
                    <BinCard bin={bin} distanceMeters={bin.distanceMeters} unit={settings.distanceUnit} selected={bin.id === selectedId} onSelect={select} />
                  </li>
                ))}
              </ul>
            ) : (
              renderList()
            )}
          </section>
        )}
      </div>

      <BinDetailsDialog
        open={dialogOpen && (!isDesktop || view === "list")}
        onClose={closeDialog}
        bin={selectedWithDistance}
        distanceMeters={selectedWithDistance?.distanceMeters}
        {...detailProps}
      />
    </>
  );
}

function chipClass(active: boolean, disabled?: boolean) {
  return cn(
    "flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition-colors",
    active
      ? "border-green-600 bg-green-600 text-white"
      : disabled
        ? "cursor-not-allowed border-line bg-white text-subtle"
        : "border-line bg-white text-ink-soft hover:border-line-strong hover:bg-canvas",
  );
}
