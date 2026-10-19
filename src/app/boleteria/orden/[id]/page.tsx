import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { PrintButton } from "../print-button";
import { TicketActions } from "@/components/ticket-actions";
import { formatDateTime } from "@/lib/time";
import { env } from "@/server/env";
import { requireArea } from "@/server/auth/guard";
import { db } from "@/server/db";
import { ticketToken } from "@/server/orders/service";

export const instant = false;

export default function BoxOfficeOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <OrderTickets params={params} />
    </Suspense>
  );
}

async function OrderTickets({ params }: { params: Promise<{ id: string }> }) {
  await requireArea("boleteria");
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { event: true, tickets: { include: { ticketType: true } } },
  });
  if (!order) notFound();
  const tickets = await Promise.all(
    order.tickets.map(async (ticket) => ({
      ...ticket,
      qr: await QRCode.toDataURL(ticketToken(ticket.id), { margin: 1, width: 220 }),
    })),
  );

  return (
    <div className="flex flex-col gap-4 print:gap-8">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <h2 className="text-lg font-medium">{order.event.title}</h2>
        <PrintButton />
      </div>
      <ul className="flex flex-col gap-4">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">
                {ticket.ticketType.name} · {ticket.shortCode}
              </p>
              <p className="text-sm text-muted-foreground">{order.buyerName}</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(order.event.startsAt)} · {order.event.venue}
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ticket.qr} alt="" className="h-40 w-40" />
            <TicketActions
              shareUrl={`${env.APP_URL}/compra/${order.id}`}
              ticket={{
                eventTitle: order.event.title,
                eventWhen: formatDateTime(order.event.startsAt),
                venue: order.event.venue,
                ticketTypeName: ticket.ticketType.name,
                shortCode: ticket.shortCode,
                qrDataUrl: ticket.qr,
              }}
            />
          </li>
        ))}
      </ul>
      <Link
        href="/boleteria"
        className="text-sm underline-offset-4 hover:underline print:hidden"
      >
        Nueva venta
      </Link>
    </div>
  );
}
