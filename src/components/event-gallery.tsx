"use client";

import { useRef } from "react";

export type GalleryImage = { src: string; alt: string };

/** Galería del evento (fotos del show). Independiente de la grilla de artistas. */
export function EventGallery({ images }: { images: GalleryImage[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  if (images.length === 0) return null;

  function scrollBy(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(320, el.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Galería
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Del evento</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollBy(-1)}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-lg hover:bg-muted"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => scrollBy(1)}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-lg hover:bg-muted"
          >
            ›
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-100 p-3 sm:p-4">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((item) => (
            <figure
              key={item.src}
              className="w-[78%] shrink-0 snap-center overflow-hidden rounded-xl sm:w-[46%] lg:w-[31%]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt}
                className="aspect-square h-full w-full object-cover object-center"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
