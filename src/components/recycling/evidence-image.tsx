"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { fetchPrivateImage } from "@/lib/api/client";
import { cn } from "@/lib/format";
import { getEvidencePhoto, rememberEvidencePhoto } from "@/lib/store/app-store";

/**
 * Shows a submission's evidence photo. Photos live in a PRIVATE Cloud Storage
 * bucket and are fetched through the API with the owner's ID token.
 */
export function EvidenceImage({
  submissionId,
  alt,
  className,
  hasPhoto = true,
}: {
  submissionId: string;
  alt: string;
  className?: string;
  hasPhoto?: boolean;
}) {
  const cached = getEvidencePhoto(submissionId);
  const [src, setSrc] = useState<string | null>(cached ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (src || !hasPhoto) return;
    let cancelled = false;
    fetchPrivateImage(`/api/submissions/${encodeURIComponent(submissionId)}/photo`)
      .then((url) => {
        rememberEvidencePhoto(submissionId, url);
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [src, hasPhoto, submissionId]);

  if (!hasPhoto || failed) {
    return (
      <span className={cn("flex h-full w-full items-center justify-center bg-canvas text-subtle", className)} role="img" aria-label="Photo unavailable">
        <ImageOff className="size-5" aria-hidden />
      </span>
    );
  }
  if (!src) return <span className={cn("block h-full w-full animate-pulse bg-blue-50", className)} aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element -- private blob URL from the authenticated API
  return <img src={src} alt={alt} className={cn("h-full w-full object-cover", className)} decoding="async" />;
}
