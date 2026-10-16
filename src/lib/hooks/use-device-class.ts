"use client";

import { useSyncExternalStore } from "react";

export type DeviceClass = "unknown" | "handheld" | "desktop";

/**
 * Detects phones/tablets by input capability rather than user-agent strings:
 * a primary coarse pointer with no hover is a touch-first handheld device.
 * The UA Client Hints `mobile` flag is used only as an additional signal.
 */
const HANDHELD_QUERY = "(pointer: coarse) and (hover: none)";

function getSnapshot(): DeviceClass {
  const touchFirst = window.matchMedia(HANDHELD_QUERY).matches;
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  const uaHintMobile = nav.userAgentData?.mobile === true;
  return touchFirst || uaHintMobile ? "handheld" : "desktop";
}

function subscribe(callback: () => void) {
  const mql = window.matchMedia(HANDHELD_QUERY);
  mql.addEventListener("change", callback);
  window.addEventListener("resize", callback);
  return () => {
    mql.removeEventListener("change", callback);
    window.removeEventListener("resize", callback);
  };
}

export function useDeviceClass(): DeviceClass {
  return useSyncExternalStore(subscribe, getSnapshot, () => "unknown");
}
