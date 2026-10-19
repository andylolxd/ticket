"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  downloadBlob,
  ticketToPdfBlob,
  ticketToPngBlob,
  type TicketExportData,
} from "@/lib/ticket-export";

type Props = {
  ticket: TicketExportData;
  shareUrl: string;
};

export function TicketActions({ ticket, shareUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "png" | "share" | null>(null);
  const [error, setError] = useState("");
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shareText = [
    `Entrada ${ticket.index}/${ticket.total}: ${ticket.eventTitle}`,
    `Fecha: ${ticket.eventDate} · ${ticket.eventTime} hs`,
    `Lugar: ${ticket.venue}`,
    `${ticket.ticketTypeName} · ${ticket.priceLabel} · ${ticket.shortCode}`,
    `Titular: ${ticket.buyerName}`,
    shareUrl,
  ].join("\n");

  async function download(kind: "pdf" | "png") {
    setError("");
    setBusy(kind);
    try {
      if (kind === "pdf") {
        const blob = await ticketToPdfBlob(ticket);
        downloadBlob(blob, `entrada-${ticket.shortCode}.pdf`);
      } else {
        const blob = await ticketToPngBlob(ticket);
        downloadBlob(blob, `entrada-${ticket.shortCode}.png`);
      }
    } catch {
      setError("No se pudo generar el archivo.");
    } finally {
      setBusy(null);
    }
  }

  async function shareNative() {
    setError("");
    setBusy("share");
    try {
      const blob = await ticketToPngBlob(ticket);
      const file = new File([blob], `entrada-${ticket.shortCode}.png`, {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: ticket.eventTitle,
          text: shareText,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: ticket.eventTitle,
          text: shareText,
          url: shareUrl,
        });
      } else {
        setOpen(true);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("No se pudo compartir.");
      }
    } finally {
      setBusy(null);
    }
  }

  function openWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }

  function openGmail() {
    const subject = `Entrada ${ticket.shortCode} · ${ticket.eventTitle}`;
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }

  function openMailto() {
    const subject = `Entrada ${ticket.shortCode} · ${ticket.eventTitle}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
    setOpen(false);
  }

  return (
    <div className="relative flex w-full flex-col gap-2 print:hidden">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => download("pdf")}
        >
          {busy === "pdf" ? "Generando…" : "Descargar PDF"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => download("png")}
        >
          {busy === "png" ? "Generando…" : "Descargar imagen"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy !== null}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          Compartir
        </Button>
      </div>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          className="absolute top-full left-0 z-20 mt-2 w-64 rounded-xl border border-border bg-background p-2 shadow-lg"
        >
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            Elegí dónde compartir
          </p>
          <ShareItem label="WhatsApp" onClick={openWhatsApp} />
          <ShareItem label="Gmail" onClick={openGmail} />
          <ShareItem label="Correo" onClick={openMailto} />
          {typeof navigator !== "undefined" && "share" in navigator ? (
            <ShareItem
              label="Más opciones…"
              onClick={() => {
                setOpen(false);
                void shareNative();
              }}
            />
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function ShareItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
