"use client";

import { useCallback, useRef, useState } from "react";
import type { GeoPoint } from "@/lib/types";

export type GeoStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable" | "unsupported";

export type GeolocationState = {
  status: GeoStatus;
  position: GeoPoint | null;
  message: string | null;
};

/**
 * Browser geolocation, requested ONLY when `request()` is called after a
 * clear user action — never automatically on page load.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: "idle", position: null, message: null });
  const pending = useRef(false);

  const request = useCallback(() => {
    if (pending.current) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "unsupported", position: null, message: "This browser doesn't support location." });
      return;
    }
    pending.current = true;
    setState((s) => ({ ...s, status: "requesting", message: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pending.current = false;
        setState({
          status: "granted",
          position: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          message: null,
        });
      },
      (err) => {
        pending.current = false;
        if (err.code === err.PERMISSION_DENIED) {
          setState({
            status: "denied",
            position: null,
            message: "Location permission was denied. Allow location for this site in your browser settings, then try again.",
          });
        } else {
          setState({
            status: "unavailable",
            position: null,
            message:
              err.code === err.TIMEOUT
                ? "Getting your location took too long. Move to an open area and try again."
                : "Your location is currently unavailable. Check that location services are on and try again.",
          });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, []);

  const reset = useCallback(() => setState({ status: "idle", position: null, message: null }), []);

  return { ...state, request, reset };
}
