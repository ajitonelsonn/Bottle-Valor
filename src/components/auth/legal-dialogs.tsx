"use client";

import { Button } from "@/components/common/button";
import { Dialog } from "@/components/common/dialog";

export type LegalDoc = "terms" | "privacy" | "help" | "about";

const DOCS: Record<LegalDoc, { title: string; body: string[] }> = {
  terms: {
    title: "Terms of Service",
    body: [
      "This is a placeholder for the BotleValor Terms of Service. The final terms will be published before launch.",
      "Points have no monetary value. Reward redemption is not yet available.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "This is a placeholder for the BotleValor Privacy Policy.",
      "BotleValor uses your camera only to take recycling evidence photos and your location only to check that you are near the selected bin. Evidence photos are stored privately in Google Cloud, assessed by Google Gemini to help verify recycling, and deleted automatically after 180 days. Photos are never made public.",
    ],
  },
  help: {
    title: "Help & Support",
    body: [
      "Recycling a bottle: open Recycle Now on your phone or tablet, choose a bin, and take one photo showing your hand, the bottle and the bin together.",
      "Support contact details will be added before launch.",
    ],
  },
  about: {
    title: "About BotleValor",
    body: [
      "BotleValor is an AI-assisted bottle-recycling verification and rewards app for Dili, Timor-Leste.",
      "Recycle Today. Earn Tomorrow."
    ],
  },
};

export function LegalDialog({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  const content = doc ? DOCS[doc] : null;
  return (
    <Dialog
      open={!!doc}
      onClose={onClose}
      title={content?.title ?? ""}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
        {content?.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Dialog>
  );
}
