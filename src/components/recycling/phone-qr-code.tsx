"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Smartphone } from "lucide-react";

/**
 * QR code that opens a page on a phone. Generated in the browser (no external
 * service) from the current site's address, so it always points at whichever
 * deployment the visitor is using.
 */
export function PhoneQrCode({ path = "/recycle/capture" }: { path?: string }) {
  const [qr, setQr] = useState<{ url: string; dataUrl: string } | null>(null);

  useEffect(() => {
    const url = new URL(path, window.location.origin).toString();
    QRCode.toDataURL(url, { width: 360, margin: 1, errorCorrectionLevel: "M", color: { dark: "#10275f", light: "#ffffff" } })
      .then((dataUrl) => setQr({ url, dataUrl }))
      .catch(() => setQr(null));
  }, [path]);

  return (
    <div className="mt-5 flex items-center gap-4 rounded-2xl border border-green-100 bg-green-50 p-4 text-left">
      <div className="flex size-32 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-card">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- locally generated data URL
          <img src={qr.dataUrl} alt={`QR code that opens ${qr.url} on your phone`} className="size-full" />
        ) : (
          <span className="size-full animate-pulse rounded-lg bg-blue-50" aria-hidden />
        )}
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-display text-base font-bold text-navy-900">
          <Smartphone className="size-5 text-green-600" aria-hidden /> Scan with your phone
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Point your phone&apos;s camera at the code to open Recycle Now there, then sign in with Google.
        </p>
        {qr ? <p className="mt-1.5 break-all text-xs text-muted">{qr.url}</p> : null}
      </div>
    </div>
  );
}
