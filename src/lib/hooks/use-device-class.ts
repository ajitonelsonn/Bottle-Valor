"use client";

import { useSyncExternalStore } from "react";

export type DeviceClass = "unknown" | "handheld" | "desktop";

/**
 * Decides whether this is a phone/tablet ("handheld") or a laptop/desktop.
 *
 * Layer 1, input capability: a primary coarse pointer with no hover (plus
 * the UA Client Hints `mobile` flag). This is easy to fake with browser
 * DevTools device emulation.
 *
 * Layer 2, real hardware: the GPU name reported by WebGL. DevTools emulation
 * and page zoom cannot change it, so a desktop GPU (NVIDIA, AMD, Intel,
 * Apple M-series, software renderers) always counts as desktop.
 *
 * A further hardware check (rear-facing camera) runs when the camera starts.
 * See capture-flow.tsx.
 */
const HANDHELD_QUERY = "(pointer: coarse) and (hover: none)";

const DESKTOP_GPU =
  /(nvidia|geforce|quadro|rtx|radeon|\bamd\b|intel|iris|uhd graphics|hd graphics|apple m\d|llvmpipe|swiftshader|software|virtualbox|vmware|parallels|microsoft basic)/i;

let gpuCache: string | null | undefined;

/** The unmasked GPU renderer string, or null if the browser doesn't expose it. */
export function gpuRenderer(): string | null {
  if (gpuCache !== undefined) return gpuCache;
  gpuCache = null;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      gpuCache = typeof name === "string" ? name : null;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    gpuCache = null;
  }
  return gpuCache;
}

export function hasDesktopGpu(): boolean {
  const name = gpuRenderer();
  return !!name && DESKTOP_GPU.test(name);
}

function getSnapshot(): DeviceClass {
  if (hasDesktopGpu()) return "desktop";
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
