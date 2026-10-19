export type TicketExportData = {
  eventTitle: string;
  eventWhen: string;
  venue: string;
  ticketTypeName: string;
  shortCode: string;
  qrDataUrl: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar el QR"));
    image.src = src;
  });
}

export async function renderTicketCanvas(
  data: TicketExportData,
): Promise<HTMLCanvasElement> {
  const width = 720;
  const height = 960;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el lienzo");

  ctx.fillStyle = "#f7f4ef";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, width, 12);
  ctx.fillRect(0, height - 12, width, 12);

  ctx.fillStyle = "#1a1a1a";
  ctx.font = "600 36px Georgia, 'Times New Roman', serif";
  wrapText(ctx, data.eventTitle, 48, 80, width - 96, 44);

  ctx.fillStyle = "#444";
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillText(data.eventWhen, 48, 200);
  wrapText(ctx, data.venue, 48, 240, width - 96, 32);

  ctx.strokeStyle = "#d4cfc6";
  ctx.beginPath();
  ctx.moveTo(48, 300);
  ctx.lineTo(width - 48, 300);
  ctx.stroke();

  ctx.fillStyle = "#1a1a1a";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText(data.ticketTypeName, 48, 360);
  ctx.font = "500 22px ui-monospace, monospace";
  ctx.fillText(`Código ${data.shortCode}`, 48, 400);

  const qr = await loadImage(data.qrDataUrl);
  const qrSize = 320;
  const qrX = (width - qrSize) / 2;
  const qrY = 460;
  ctx.fillStyle = "#fff";
  ctx.fillRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32);
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "#666";
  ctx.font = "400 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Mostrá este QR en la entrada", width / 2, 860);
  ctx.textAlign = "start";

  return canvas;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}

export async function ticketToPngBlob(data: TicketExportData): Promise<Blob> {
  const canvas = await renderTicketCanvas(data);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo exportar PNG"))),
      "image/png",
    );
  });
}

export async function ticketToPdfBlob(data: TicketExportData): Promise<Blob> {
  const canvas = await renderTicketCanvas(data);
  const jpeg = canvas.toDataURL("image/jpeg", 0.92);
  const base64 = jpeg.split(",")[1];
  if (!base64) throw new Error("No se pudo exportar PDF");
  return jpegDataUrlToPdfBlob(base64, canvas.width, canvas.height);
}

function jpegDataUrlToPdfBlob(
  jpegBase64: string,
  imgWidth: number,
  imgHeight: number,
): Blob {
  const pageWidth = 595;
  const pageHeight = Math.round((imgHeight / imgWidth) * pageWidth);
  const jpegBytes = Uint8Array.from(atob(jpegBase64), (c) => c.charCodeAt(0));

  const objects: Uint8Array[] = [];
  const add = (content: string | Uint8Array) => {
    objects.push(typeof content === "string" ? encoder.encode(content) : content);
  };

  const encoder = new TextEncoder();
  add("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  add(
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
  );
  add(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>\nendobj\n`,
  );
  const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
  add(
    `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`,
  );
  const imgHeader = encoder.encode(
    `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  const imgFooter = encoder.encode("\nendstream\nendobj\n");
  const imageObject = new Uint8Array(
    imgHeader.length + jpegBytes.length + imgFooter.length,
  );
  imageObject.set(imgHeader, 0);
  imageObject.set(jpegBytes, imgHeader.length);
  imageObject.set(imgFooter, imgHeader.length + jpegBytes.length);
  objects.push(imageObject);

  const header = encoder.encode("%PDF-1.4\n");
  const parts: Uint8Array[] = [header];
  const offsets = [0];
  let offset = header.length;
  for (const object of objects) {
    offsets.push(offset);
    parts.push(object);
    offset += object.length;
  }
  const xrefStart = offset;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  parts.push(encoder.encode(xref));

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const pdf = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    pdf.set(part, cursor);
    cursor += part.length;
  }
  return new Blob([pdf], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
