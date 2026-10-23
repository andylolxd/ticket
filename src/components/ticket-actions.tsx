"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

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

const noopSubscribe = () => () => {};

export function TicketActions({ ticket, shareUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canNativeShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );
  const [file, setFile] = useState<File | null>(null);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const preparingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // navigator.share solo funciona dentro del gesto del usuario: la imagen se arma
  // cuando el boleto entra en pantalla para no tener que esperarla después del toque.
  useEffect(() => {
    const node = rootRef.current;
    if (!canNativeShare || file || !node) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || preparingRef.current) return;
      preparingRef.current = true;
      observer.disconnect();
      ticketToPngBlob(ticket)
        .then((blob) =>
          setFile(new File([blob], `entrada-${ticket.shortCode}.png`, { type: "image/png" })),
        )
        .catch(() => undefined)
        .finally(() => {
          preparingRef.current = false;
        });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [canNativeShare, file, ticket]);

  const shareText = [
    `Entrada ${ticket.index}/${ticket.total}: ${ticket.eventTitle}`,
    `Fecha: ${ticket.eventDate} · ${ticket.eventTime} hs`,
    `Lugar: ${ticket.venue}`,
    `${ticket.ticketTypeName} · ${ticket.priceLabel} · ${ticket.shortCode}`,
    `Titular: ${ticket.buyerName}`,
  ].join("\n");
  const fullText = `${shareText}\n${shareUrl}`;
  const subject = `Entrada ${ticket.shortCode} · ${ticket.eventTitle}`;
  const text = encodeURIComponent(fullText);
  const url = encodeURIComponent(shareUrl);

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${text}` },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${url}&text=${encodeURIComponent(shareText)}`,
    },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { label: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${text}` },
    {
      label: "Gmail",
      href: `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${text}`,
    },
    {
      label: "Correo",
      href: `mailto:?subject=${encodeURIComponent(subject)}&body=${text}`,
      sameTab: true,
    },
  ];

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

  function shareNative() {
    setError("");
    const withFile = file && navigator.canShare?.({ files: [file] });
    const data: ShareData = withFile
      ? { title: ticket.eventTitle, text: fullText, files: [file] }
      : { title: ticket.eventTitle, text: shareText, url: shareUrl };
    navigator
      .share(data)
      .then(() => setOpen(false))
      .catch((err: Error) => {
        if (err.name !== "AbortError") setOpen(true);
      });
  }

  async function copyText() {
    setError("");
    try {
      await navigator.clipboard.writeText(fullText);
      setNotice("Copiado. Pegalo donde quieras.");
      setTimeout(() => setNotice(""), 2500);
    } catch {
      setError("No se pudo copiar.");
    }
  }

  return (
    <div ref={rootRef} className="flex w-full flex-col gap-2 print:hidden">
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
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => (canNativeShare ? shareNative() : setOpen((value) => !value))}
        >
          Compartir
        </Button>
      </div>

      {open ? (
        <div
          id={panelId}
          className="w-full rounded-xl border border-border bg-background p-2 shadow-sm sm:max-w-sm"
        >
          <p className="px-2 py-1.5 text-xs text-muted-foreground">Elegí dónde compartir</p>
          {canNativeShare ? (
            <button
              type="button"
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted"
              onClick={shareNative}
            >
              Apps del teléfono{file ? " (con imagen)" : "…"}
            </button>
          ) : null}
          <div className="grid grid-cols-2 gap-1">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.sameTab ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="flex items-center rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              className="flex items-center rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted"
              onClick={copyText}
            >
              Copiar texto
            </button>
          </div>
        </div>
      ) : null}

      {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
