"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { TextField } from "./form-field";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "default";
  /** When set, the user must type this word to enable the confirm button. */
  confirmPhrase?: string;
};

export function ConfirmDialog(props: ConfirmDialogProps) {
  // Remount the body each time it opens so typed text and busy state reset.
  return props.open ? <ConfirmDialogBody {...props} /> : null;
}

function ConfirmDialogBody({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  tone = "default",
  confirmPhrase,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const blocked = confirmPhrase ? typed.trim().toUpperCase() !== confirmPhrase.toUpperCase() : false;

  async function handleConfirm() {
    if (busy || blocked) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
      size="sm"
      icon={
        tone === "danger" ? (
          <span className="flex size-11 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
        ) : undefined
      }
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={handleConfirm} loading={busy} disabled={blocked}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {confirmPhrase ? (
        <TextField
          label={`Type ${confirmPhrase} to confirm`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
        />
      ) : null}
    </Dialog>
  );
}
