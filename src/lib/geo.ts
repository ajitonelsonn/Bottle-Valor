import type { DistanceUnit, GeoPoint } from "@/lib/types";

/** Reference point used for distances before the user shares their location. */
export const DEMO_REFERENCE_POINT: GeoPoint & { label: string } = {
  latitude: -8.5586,
  longitude: 125.5736,
  label: "central Dili",
};

export const DILI_CENTER: [number, number] = [-8.5536, 125.5736];

/** Great-circle distance in metres (haversine). */
export function distanceInMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(meters: number, unit: DistanceUnit = "km"): string {
  if (unit === "mi") {
    const miles = meters / 1609.344;
    if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
    return `${miles < 10 ? miles.toFixed(1) : Math.round(miles).toLocaleString("en")} mi`;
  }
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString("en")} km`;
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/** OpenStreetMap directions link (walking) from an optional origin to the bin. */
export function osmDirectionsUrl(to: GeoPoint, from?: GeoPoint | null): string {
  const dest = `${to.latitude},${to.longitude}`;
  const origin = from ? `${from.latitude},${from.longitude}` : "";
  const params = new URLSearchParams({
    engine: "fossgis_osrm_foot",
    route: `${origin};${dest}`,
  });
  return `https://www.openstreetmap.org/directions?${params.toString()}`;
}

export function osmViewUrl(point: GeoPoint, zoom = 17): string {
  return `https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=${zoom}/${point.latitude}/${point.longitude}`;
}
