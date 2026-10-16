"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { Circle, CircleMarker, MapContainer, Marker, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { DILI_CENTER, distanceInMeters } from "@/lib/geo";
import type { GeoPoint, RecyclingBin } from "@/lib/types";

export type BinMapClientProps = {
  bins: RecyclingBin[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  userLocation?: GeoPoint | null;
  compact?: boolean;
  onTileError?: () => void;
};

const RECYCLE_GLYPH =
  '<path d="M10.2 7.3 12 4.2l1.8 3.1M16.9 12.6l1.8 3.1h-3.6M7.1 15.7H3.5l1.8-3.1" stroke="#fff" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.6 9.2 6.9 12.1M15.4 9.2l1.7 2.9M9.3 15.7h5.4" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>';

function pinIcon(variant: "default" | "real" | "selected" | "inactive") {
  const fill = variant === "inactive" ? "#8792a8" : variant === "selected" ? "#1b67de" : variant === "real" ? "#0f7a3b" : "#4cae78";
  const stroke = variant === "real" ? "#f2a900" : "#fff";
  const size = variant === "selected" ? 48 : variant === "real" ? 44 : 36;
  const ring =
    variant === "selected"
      ? '<circle cx="12" cy="10" r="11" fill="#1b67de" opacity=".18"/>'
      : "";
  return L.divIcon({
    className: "bv-marker",
    iconSize: [size, size * 1.2],
    iconAnchor: [size / 2, size * 1.15],
    html: `<svg viewBox="0 0 24 29" width="${size}" height="${size * 1.2}" aria-hidden="true" style="filter:drop-shadow(0 3px 4px rgba(10,27,69,.35))">${ring}<path d="M12 28s-9-8.6-9-16a9 9 0 0 1 18 0c0 7.4-9 16-9 16z" fill="${fill}" stroke="${stroke}" stroke-width="${variant === "real" ? 2.2 : 1.6}"/><g transform="translate(0 -1.5) scale(1)">${RECYCLE_GLYPH}</g></svg>`,
  });
}

/** Moves the map to the selected bin or the user's location when they change. */
function MapController({ selected, userLocation }: { selected: RecyclingBin | null; userLocation: GeoPoint | null }) {
  const map = useMap();
  const lastUser = useRef<GeoPoint | null>(null);

  useEffect(() => {
    if (selected) map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [map, selected]);

  useEffect(() => {
    if (!userLocation || userLocation === lastUser.current) return;
    lastUser.current = userLocation;
    // Only recentre on the user when they are reasonably close to the Dili service area.
    const nearDili =
      distanceInMeters(userLocation, { latitude: DILI_CENTER[0], longitude: DILI_CENTER[1] }) < 60000;
    if (nearDili) map.flyTo([userLocation.latitude, userLocation.longitude], 15, { duration: 0.6 });
  }, [map, userLocation]);

  return null;
}

export default function BinMapClient({ bins, selectedId, onSelect, userLocation = null, compact, onTileError }: BinMapClientProps) {
  const icons = useMemo(
    () => ({ default: pinIcon("default"), real: pinIcon("real"), selected: pinIcon("selected"), inactive: pinIcon("inactive") }),
    [],
  );
  const selected = bins.find((b) => b.id === selectedId) ?? null;

  return (
    <MapContainer
      center={DILI_CENTER}
      zoom={compact ? 13 : 14}
      minZoom={11}
      zoomControl={false}
      scrollWheelZoom={!compact}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        maxZoom={19}
        eventHandlers={{ tileerror: () => onTileError?.() }}
      />
      {compact ? null : <ZoomControl position="bottomright" />}
      {bins.map((bin) => (
        <Marker
          key={bin.id}
          position={[bin.latitude, bin.longitude]}
          icon={
            bin.id === selectedId ? icons.selected : !bin.isActive ? icons.inactive : bin.isSample ? icons.default : icons.real
          }
          title={`${bin.name}${bin.isSample ? " (sample)" : ""}${bin.isActive ? "" : " (unavailable)"}`}
          alt={bin.name}
          zIndexOffset={bin.id === selectedId ? 1000 : bin.isSample ? 0 : 500}
          eventHandlers={{ click: () => onSelect?.(bin.id) }}
          keyboard
        />
      ))}
      {userLocation ? (
        <>
          {userLocation.accuracy ? (
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={Math.min(userLocation.accuracy, 500)}
              pathOptions={{ color: "#2f7cf0", weight: 1, fillOpacity: 0.12 }}
            />
          ) : null}
          <CircleMarker
            center={[userLocation.latitude, userLocation.longitude]}
            radius={8}
            pathOptions={{ color: "#fff", weight: 3, fillColor: "#1b67de", fillOpacity: 1 }}
          />
        </>
      ) : null}
      <MapController selected={selected} userLocation={userLocation} />
    </MapContainer>
  );
}
