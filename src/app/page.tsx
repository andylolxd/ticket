import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { ArtistsCarousel } from "@/components/artists-carousel";
import { EventGallery } from "@/components/event-gallery";
import { HowItWorks } from "@/components/how-it-works";
import { PublicHeader } from "@/components/public-header";
import { formatArs } from "@/lib/money";
import { formatShortDate, formatTime } from "@/lib/time";
import { db } from "@/server/db";

export const instant = false;

export default function Home() {
  return (
    <>
      <PublicHeader />
      <Suspense
        fallback={
          <p className="px-4 py-16 text-center text-sm text-muted-foreground">
            Cargando eventos…
          </p>
        }
      >
        <Catalog />
      </Suspense>
    </>
  );
}

async function Catalog() {
  await connection();
  const now = new Date();

  const events = await db.event.findMany({
    where: { status: "PUBLICADO" },
    orderBy: { startsAt: "asc" },
    include: {
      ticketTypes: {
        where: { active: true },
        select: { priceCents: true },
      },
      gallery: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { imageKey: true },
      },
      lineup: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          photoKey: true,
          sortOrder: true,
        },
      },
    },
  });

  // Próximos primero por fecha; los pasados al final (igual cronológico).
  const upcoming = events.filter((event) => event.startsAt.getTime() >= now.getTime());
  const past = events.filter((event) => event.startsAt.getTime() < now.getTime());
  const ordered = [...upcoming, ...past];

  const artists = ordered.flatMap((event) =>
    event.lineup.map((artist) => ({
      id: artist.id,
      name: artist.name,
      photoSrc: artist.photoKey ? `/api/media/${artist.photoKey}` : null,
      eventSlug: event.slug,
      eventTitle: event.title,
    })),
  );

  if (ordered.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <p className="text-sm text-muted-foreground">No hay eventos publicados.</p>
      </main>
    );
  }

  return (
    <main className="flex w-full flex-1 flex-col pb-16">
      {artists.length > 0 ? (
        <div className="border-b border-zinc-200 bg-white px-5 py-10 sm:px-8 sm:py-12">
          <div className="mx-auto w-full max-w-6xl">
            <ArtistsCarousel artists={artists} />
          </div>
        </div>
      ) : null}

      <div className="border-b border-zinc-200 bg-sky-950 px-5 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-6xl text-white">
          <p className="text-sm text-sky-200/80">Cartelera</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Eventos</h2>
        </div>
      </div>

      {ordered.map((event, index) => (
        <EventBlock key={event.id} event={event} featured={index === 0} />
      ))}
    </main>
  );
}

type BannerEvent = {
  id: string;
  slug: string;
  title: string;
  venue: string;
  startsAt: Date;
  coverImageKey: string | null;
  ticketTypes: { priceCents: number }[];
  gallery: { imageKey: string }[];
};

/** Un frame por evento: banner + galería + cómo funciona. */
function EventBlock({
  event,
  featured = false,
}: {
  event: BannerEvent;
  featured?: boolean;
}) {
  const galleryImages = event.gallery.map((photo) => ({
    src: `/api/media/${photo.imageKey}`,
    alt: `Foto de ${event.title}`,
  }));

  return (
    <section className="flex w-full flex-col border-b border-zinc-200 last:border-b-0">
      <EventBanner event={event} featured={featured} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-5 py-12 sm:px-8 sm:py-16">
        {galleryImages.length > 0 ? <EventGallery images={galleryImages} /> : null}
        <HowItWorks />
      </div>
    </section>
  );
}

function EventBanner({
  event,
  featured = false,
}: {
  event: BannerEvent;
  featured?: boolean;
}) {
  const prices = event.ticketTypes.map((type) => type.priceCents);
  const from = prices.length > 0 ? Math.min(...prices) : null;
  const height = featured
    ? "min-h-[28rem] sm:min-h-[32rem] lg:min-h-[36rem]"
    : "min-h-[22rem] sm:min-h-[26rem]";

  return (
    <div className="relative w-full overflow-hidden">
      <div className={`relative ${height}`}>
        {event.coverImageKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/${event.coverImageKey}`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10"
          aria-hidden
        />
        <div className="absolute inset-0 z-10 flex flex-col justify-end gap-6 px-5 pb-8 pt-24 sm:px-10 sm:pb-10 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="flex max-w-2xl flex-col gap-3 text-white">
            {featured ? (
              <span className="w-fit rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-zinc-950 uppercase">
                Próximo
              </span>
            ) : null}
            <h2
              className={`font-bold tracking-tight text-balance ${featured ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl sm:text-3xl lg:text-4xl"}`}
            >
              {event.title}
            </h2>
            <p className="text-sm text-white/85 sm:text-base">
              <span className="font-medium">{formatShortDate(event.startsAt)}</span>
              <span className="mx-2 text-white/40">·</span>
              <span>{formatTime(event.startsAt)}</span>
              <span className="mx-2 text-white/40">·</span>
              <span>{event.venue}</span>
            </p>
          </div>

          <div className="w-full max-w-sm shrink-0 overflow-hidden rounded-2xl bg-zinc-950/70 shadow-2xl backdrop-blur-md sm:w-80">
            <div className="flex items-center gap-2 bg-amber-400/95 px-4 py-1.5 text-xs font-semibold text-zinc-950">
              <span aria-hidden>✦</span>
              Entradas disponibles
            </div>
            <div className="flex flex-col gap-4 px-5 py-5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs tracking-wide text-white/55 uppercase">
                  Desde
                </span>
                <span className="text-3xl font-bold tracking-tight text-white">
                  {from === null ? "—" : formatArs(from)}
                </span>
              </div>
              <Link
                href={`/eventos/${event.slug}`}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100 active:translate-y-px"
              >
                Comprar entradas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
