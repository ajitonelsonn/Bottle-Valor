"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  CameraOff,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  LocateFixed,
  Lock,
  MapPin,
  MapPinOff,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  Zap,
  ZapOff,
} from "lucide-react";
import { Button, buttonClass } from "@/components/common/button";
import { LoadingState } from "@/components/common/states";
import { InlineAlert } from "@/components/common/toast";
import { POINTS_RULE, POINTS_RULE_TEXT, pointsForReport } from "@/lib/points";
import { DEMO_REFERENCE_POINT, formatDistance } from "@/lib/geo";
import { useDeviceClass } from "@/lib/hooks/use-device-class";
import { useGeolocation, type GeoStatus } from "@/lib/hooks/use-geolocation";
import { retryBins, useBins } from "@/lib/data/catalog";
import { sortByDistance } from "@/lib/services/bin-service";
import { actions, useAppState } from "@/lib/store/app-store";
import type { GeoPoint } from "@/lib/types";
import { BinPickerDialog } from "./bin-picker-dialog";
import { DesktopOnlyNotice } from "./desktop-only-notice";
import { PhoneQrCode } from "./phone-qr-code";
import { PhotoTips } from "./photo-tips";
import { RecycleStepper } from "./recycle-stepper";

export function CaptureFlow() {
  const device = useDeviceClass();
  if (device === "unknown") return <LoadingState label="Checking your device…" />;
  if (device === "desktop") return <DesktopOnlyNotice />;
  return <HandheldCapture />;
}

type CameraError = "denied" | "unavailable" | "in-use" | "unsupported" | "insecure" | "no-rear-camera";
type Phase =
  | { kind: "intro" }
  | { kind: "starting" }
  | { kind: "live" }
  | { kind: "review"; photoUrl: string }
  | { kind: "paused" }
  | { kind: "error"; error: CameraError };

const CAMERA_ERRORS: Record<CameraError, { title: string; body: string; retry: boolean }> = {
  denied: {
    title: "Camera access was denied",
    body: "BotleValor needs your camera to take the evidence photo. Allow camera access for this site in your browser settings, then try again.",
    retry: true,
  },
  unavailable: {
    title: "No camera available",
    body: "We couldn't find a working camera on this device. Check that your camera is enabled and not blocked, then try again.",
    retry: true,
  },
  "in-use": {
    title: "Camera is busy",
    body: "Another app may be using the camera. Close other camera apps and try again.",
    retry: true,
  },
  unsupported: {
    title: "This browser can't use the camera",
    body: "Your browser doesn't support live camera capture. Please open BotleValor in an up-to-date browser such as Chrome or Safari.",
    retry: false,
  },
  "no-rear-camera": {
    title: "A phone or tablet back camera is required",
    body: "Recycling evidence must be taken with the back camera of a phone or tablet. Laptop and desktop webcams can't be used, including in browser phone-emulation mode.",
    retry: false,
  },
  insecure: {
    title: "A secure connection is required",
    body: "Camera access only works over HTTPS (or localhost). Open BotleValor using a secure https:// address and try again.",
    retry: false,
  },
};

/**
 * True when the camera faces away from the user (a phone or tablet back
 * camera). This is real hardware information, so browser device emulation
 * can't fake it: laptop webcams never report "environment".
 */
function isRearCamera(track: MediaStreamTrack | undefined): boolean {
  if (!track) return false;
  const settings = track.getSettings?.() as MediaTrackSettings | undefined;
  if (settings?.facingMode) return settings.facingMode === "environment";
  const caps = track.getCapabilities?.() as (MediaTrackCapabilities & { facingMode?: string[] }) | undefined;
  if (caps?.facingMode?.length) return caps.facingMode.includes("environment");
  // Last resort: camera name (English, Portuguese, Indonesian).
  return /\b(back|rear|environment|traseira|trás|belakang)\b|facing back/i.test(track.label);
}

function mapCameraError(err: unknown): CameraError {
  const name = err instanceof DOMException || err instanceof Error ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return "denied";
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return "in-use";
  return "unavailable";
}

function HandheldCapture() {
  const router = useRouter();
  const { selectedBinId, settings } = useAppState();
  const binsRes = useBins();
  const geo = useGeolocation();

  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bottleCount, setBottleCount] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoRef = useRef<string | null>(null);
  const photoBlobRef = useRef<Blob | null>(null);
  const submittedRef = useRef(false);

  const locationAllowed = settings.privacy.useLocation;
  const reference: GeoPoint = geo.position ?? DEMO_REFERENCE_POINT;
  const bins = useMemo(
    () => (binsRes.status === "ready" ? sortByDistance(binsRes.data, reference) : []),
    [binsRes, reference],
  );
  const bin = bins.find((b) => b.id === selectedBinId && b.isActive) ?? bins.find((b) => b.isActive) ?? null;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setTorchOn(false);
  }, []);

  const releasePhoto = useCallback(() => {
    if (photoRef.current && !submittedRef.current) URL.revokeObjectURL(photoRef.current);
    photoRef.current = null;
  }, []);

  const startCamera = useCallback(
    async () => {
      if (!window.isSecureContext) {
        setPhase({ kind: "error", error: "insecure" });
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setPhase({ kind: "error", error: "unsupported" });
        return;
      }
      stopStream();
      setPhase({ kind: "starting" });
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
        });
        const track = stream.getVideoTracks()[0];
        if (!isRearCamera(track)) {
          // Not a phone/tablet back camera (e.g. laptop webcam under DevTools emulation).
          stream.getTracks().forEach((t) => t.stop());
          setPhase({ kind: "error", error: "no-rear-camera" });
          return;
        }
        streamRef.current = stream;
        const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        setTorchSupported(!!caps.torch);
        setPhase({ kind: "live" });
      } catch (err) {
        setPhase({ kind: "error", error: mapCameraError(err) });
      }
    },
    [stopStream],
  );

  // Attach the live stream once the <video> element is on screen.
  useEffect(() => {
    const video = videoRef.current;
    if (phase.kind !== "live" || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => undefined);
  }, [phase.kind]);

  // Stop the camera when the page is hidden, and always on unmount.
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden" && streamRef.current) {
        stopStream();
        setPhase({ kind: "paused" });
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopStream();
      releasePhoto();
    };
  }, [stopStream, releasePhoto]);

  function begin() {
    // Permissions are requested only now, after the user starts the flow.
    if (locationAllowed && geo.status !== "granted" && geo.status !== "requesting") geo.request();
    void startCamera();
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((on) => !on);
    } catch {
      setTorchSupported(false);
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        releasePhoto();
        const url = URL.createObjectURL(blob);
        photoRef.current = url;
        photoBlobRef.current = blob;
        stopStream(); // finished capturing — release the camera
        setPhase({ kind: "review", photoUrl: url });
      },
      "image/jpeg",
      0.85,
    );
  }

  function retake() {
    releasePhoto();
    void startCamera();
  }

  function submit() {
    if (phase.kind !== "review" || !bin || !geo.position || !photoBlobRef.current || submitting) return;
    setSubmitting(true);
    submittedRef.current = true;
    actions.setPendingCapture({
      requestId: crypto.randomUUID(),
      binId: bin.id,
      bottleCount,
      location: geo.position,
      photo: photoBlobRef.current,
      photoUrl: phase.photoUrl,
    });
    router.push("/recycle/verify");
  }

  const fromLabel = geo.position ? "your location" : DEMO_REFERENCE_POINT.label;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-[1.75rem] font-extrabold">Recycle Now</h1>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Plastic bottles</span>
      </div>
      <RecycleStepper current={0} />

      {/* Selected bin */}
      <section className="card mt-5 flex items-center gap-3 p-4" aria-labelledby="selected-bin-label">
        <MapPin className="size-6 shrink-0 text-green-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p id="selected-bin-label" className="text-sm font-semibold text-green-700">
            Selected bin
          </p>
          {bin ? (
            <>
              <p className="truncate font-bold text-navy-900">{bin.name}</p>
              <p className="text-sm text-muted">
                {formatDistance(bin.distanceMeters, settings.distanceUnit)} from {fromLabel}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">
              {binsRes.status === "loading" ? (
                "Loading recycling bins…"
              ) : binsRes.status === "error" ? (
                <>
                  Couldn&apos;t load bins.{" "}
                  <button type="button" onClick={retryBins} className="font-semibold text-blue-600 underline">
                    Try again
                  </button>
                </>
              ) : (
                "No active bins are available."
              )}
            </p>
          )}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={phase.kind === "review" && submitting}
            className="mt-1 flex min-h-9 items-center gap-0.5 text-sm font-semibold text-blue-600 hover:underline"
          >
            Change bin <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
        {bin ? (
          <span className="relative size-18 shrink-0 overflow-hidden rounded-xl bg-blue-50">
            <Image src={bin.imageUrl} alt="" fill sizes="72px" unoptimized={bin.imageUrl.endsWith(".svg")} className="object-cover" />
          </span>
        ) : null}
      </section>

      {/* GPS status */}
      {locationAllowed ? (
        <GpsStatus status={geo.status} accuracy={geo.position?.accuracy} message={geo.message} onRetry={geo.request} />
      ) : (
        <InlineAlert
          tone="warning"
          className="mt-3"
          title="Location is turned off"
          action={
            <Link href="/settings" className={buttonClass({ variant: "secondary", size: "sm" })}>
              Open settings
            </Link>
          }
        >
          Recycling evidence needs your location to check you&apos;re at the bin. Turn on &ldquo;Use my location&rdquo; in
          Settings to continue.
        </InlineAlert>
      )}

      {/* Main stage */}
      <div className="mt-4">
        {phase.kind === "intro" || phase.kind === "paused" ? (
          <section className="card p-5" aria-labelledby="start-title">
            <h2 id="start-title" className="text-xl font-bold">
              {phase.kind === "paused" ? "Camera paused" : "Before you start"}
            </h2>
            {phase.kind === "paused" ? (
              <p className="mt-1 text-sm text-muted">We turned the camera off while the app was in the background.</p>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Stand at the selected bin. Take one photo with your <strong>hand</strong>, the <strong>plastic bottle</strong>{" "}
                and the <strong>recycling bin</strong> together in the frame.
              </p>
            )}
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <Camera className="size-5" aria-hidden />
                </span>
                <span>
                  <strong className="block text-ink">Camera access</strong>
                  <span className="text-muted">To take the evidence photo. Photos are stored privately and never made public.</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <LocateFixed className="size-5" aria-hidden />
                </span>
                <span>
                  <strong className="block text-ink">Location access</strong>
                  <span className="text-muted">To check you&apos;re near the selected bin when you take the photo.</span>
                </span>
              </li>
            </ul>
            <Button size="lg" full className="mt-5" onClick={begin} disabled={!bin}>
              <Camera className="size-5" aria-hidden /> {phase.kind === "paused" ? "Resume camera" : "Start camera"}
            </Button>
          </section>
        ) : null}

        {phase.kind === "starting" ? (
          <div className="card flex aspect-[3/4] max-h-[70dvh] w-full items-center justify-center">
            <LoadingState label="Starting camera…" />
          </div>
        ) : null}

        {phase.kind === "live" ? (
          <section aria-label="Camera viewfinder" className="relative overflow-hidden rounded-panel bg-navy-950">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              aria-label="Live camera preview"
              className="aspect-[3/4] max-h-[70dvh] w-full object-cover"
            />
            {/* Framing guide */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="absolute inset-[9%_7%_22%] rounded-3xl">
                <span className="absolute left-0 top-0 size-10 rounded-tl-3xl border-l-4 border-t-4 border-white/90" />
                <span className="absolute right-0 top-0 size-10 rounded-tr-3xl border-r-4 border-t-4 border-white/90" />
                <span className="absolute bottom-0 left-0 size-10 rounded-bl-3xl border-b-4 border-l-4 border-white/90" />
                <span className="absolute bottom-0 right-0 size-10 rounded-br-3xl border-b-4 border-r-4 border-white/90" />
              </div>
            </div>
            <p className="absolute inset-x-4 top-4 flex items-center gap-2.5 rounded-2xl bg-navy-950/75 px-4 py-2.5 text-sm font-medium text-white backdrop-blur">
              <ScanLine className="size-5 shrink-0" aria-hidden />
              Fit your hand, the bottle and the recycling bin in the frame
            </p>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-around bg-linear-to-t from-navy-950/80 to-transparent px-6 pb-5 pt-10">
              <div className="w-16">
                {torchSupported ? (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    aria-pressed={torchOn}
                    className="flex flex-col items-center gap-1 text-xs font-medium text-white"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                      {torchOn ? <Zap className="size-5" aria-hidden /> : <ZapOff className="size-5" aria-hidden />}
                    </span>
                    Flash
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={capture}
                aria-label="Take photo"
                className="flex size-20 items-center justify-center rounded-full border-4 border-green-400 bg-white/20 p-1.5 backdrop-blur focus-visible:outline-white"
              >
                <span className="size-full rounded-full bg-white" />
              </button>
              <div className="w-16" aria-hidden />
            </div>
          </section>
        ) : null}

        {phase.kind === "review" ? (
          <section aria-labelledby="review-title" className="card overflow-hidden">
            <div className="relative bg-navy-950">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL from the camera */}
              <img src={phase.photoUrl} alt="Your captured evidence photo" className="aspect-[3/4] max-h-[60dvh] w-full object-cover" />
            </div>
            <div className="p-5">
              <h2 id="review-title" className="text-xl font-bold">
                Check your photo
              </h2>
              <p className="mt-1 text-sm text-muted">
                Is your hand, the bottle and the bin clearly visible? If not, retake the photo. Next, we&apos;ll assess the
                evidence — a photo alone doesn&apos;t prove a deposit.
              </p>

              {!geo.position ? (
                <InlineAlert tone="warning" className="mt-4" title="Location needed to continue">
                  {geo.status === "requesting"
                    ? "Still getting your location…"
                    : "We need your location to check you're at the selected bin."}
                </InlineAlert>
              ) : null}

              <BottleCounter value={bottleCount} onChange={setBottleCount} />

              <p className="mt-4 rounded-2xl bg-canvas p-3 text-xs text-muted">
                When you continue, this photo and your location are uploaded securely, assessed by Google Gemini and
                checked against the selected bin. Photos are stored privately and deleted after 180 days.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button variant="secondary" size="lg" onClick={retake} disabled={submitting}>
                  <RefreshCw className="size-5" aria-hidden /> Retake
                </Button>
                <Button size="lg" onClick={submit} disabled={!geo.position || !bin} loading={submitting} loadingText="Submitting…">
                  Continue <ArrowRight className="size-5" aria-hidden />
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {phase.kind === "error" ? (
          <section className="card p-6 text-center" role="alert" aria-labelledby="camera-error-title">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
              {phase.error === "insecure" ? (
                <Lock className="size-7" aria-hidden />
              ) : phase.error === "unsupported" ? (
                <ShieldAlert className="size-7" aria-hidden />
              ) : (
                <CameraOff className="size-7" aria-hidden />
              )}
            </span>
            <h2 id="camera-error-title" className="mt-4 text-xl font-bold">
              {CAMERA_ERRORS[phase.error].title}
            </h2>
            <p className="mt-2 text-sm text-muted">{CAMERA_ERRORS[phase.error].body}</p>
            <p className="mt-2 text-xs text-subtle">For fair verification, photos must be taken live with the camera.</p>
            {phase.error === "no-rear-camera" ? <PhoneQrCode /> : null}
            <div className="mt-5 flex flex-col gap-2">
              {CAMERA_ERRORS[phase.error].retry ? (
                <Button size="lg" full onClick={() => void startCamera()}>
                  <RefreshCw className="size-5" aria-hidden /> Try again
                </Button>
              ) : null}
              <Link href="/dashboard" className={buttonClass({ variant: "secondary", size: "lg", full: true })}>
                Back to dashboard
              </Link>
            </div>
          </section>
        ) : null}
      </div>

      <PhotoTips className="mt-4" />

      <BinPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        bins={bins}
        selectedId={bin?.id ?? null}
        onSelect={(id) => actions.selectBin(id)}
        unit={settings.distanceUnit}
        fromLabel={fromLabel}
      />
    </div>
  );
}

function GpsStatus({
  status,
  accuracy,
  message,
  onRetry,
}: {
  status: GeoStatus;
  accuracy?: number;
  message: string | null;
  onRetry: () => void;
}) {
  if (status === "idle") {
    return (
      <p className="mt-3 flex items-center gap-2 rounded-xl bg-canvas px-3 py-2.5 text-sm text-muted">
        <LocateFixed className="size-4" aria-hidden /> Location will be requested when you start the camera.
      </p>
    );
  }
  if (status === "requesting") {
    return (
      <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Getting your GPS location…
      </p>
    );
  }
  if (status === "granted") {
    return (
      <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-medium text-green-800">
        <MapPin className="size-4" aria-hidden /> GPS location acquired
        {accuracy ? <span className="font-normal text-green-700">· accurate to ±{Math.round(accuracy)} m</span> : null}
      </p>
    );
  }
  return (
    <InlineAlert
      tone={status === "denied" ? "error" : "warning"}
      className="mt-3"
      title={status === "denied" ? "Location access denied" : "Location unavailable"}
      action={
        status !== "unsupported" ? (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            <MapPinOff className="size-4" aria-hidden /> Retry location
          </Button>
        ) : undefined
      }
    >
      {message} Location is required to submit recycling evidence.
    </InlineAlert>
  );
}

/** How many bottles are going into the bin — drives the 1–3 point award. */
function BottleCounter({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const points = pointsForReport(value);
  return (
    <fieldset className="mt-4 rounded-2xl border border-line p-4">
      <legend className="px-1 text-sm font-semibold text-navy-900">How many bottles are you recycling?</legend>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(1, value - 1))}
            disabled={value <= 1}
            aria-label="Fewer bottles"
            className="flex size-11 items-center justify-center rounded-xl border border-line-strong text-navy-900 hover:bg-canvas disabled:text-line-strong"
          >
            <Minus className="size-5" aria-hidden />
          </button>
          <output aria-live="polite" className="w-12 text-center font-display text-3xl font-extrabold tabular-nums text-navy-900">
            {value}
          </output>
          <button
            type="button"
            onClick={() => onChange(Math.min(POINTS_RULE.maxBottlesPerReport, value + 1))}
            disabled={value >= POINTS_RULE.maxBottlesPerReport}
            aria-label="More bottles"
            className="flex size-11 items-center justify-center rounded-xl border border-line-strong text-navy-900 hover:bg-canvas disabled:text-line-strong"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        </div>
        <p className="text-right text-sm text-muted">
          If verified
          <span className="block font-display text-xl font-bold text-green-700">
            +{points} pt{points === 1 ? "" : "s"}
          </span>
        </p>
      </div>
      <p className="mt-2 text-xs text-muted">
        {POINTS_RULE_TEXT} Make sure every bottle is visible in the photo.
      </p>
    </fieldset>
  );
}
