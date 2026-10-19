const STEPS = [
  {
    title: "Llegá un poco antes",
    body: "Pedí un trago, ponete cómodo y dejá que la noche comience desde antes de la primera nota. Llegá 30 minutos antes. Las puertas se cierran al inicio y no se permite el acceso una vez que haya comenzado la función.",
    tone: "bg-violet-600",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 8v4.5L15 15"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Tomá asiento",
    body: "Acomodate en un lugar íntimo con luz tenue y un sonido rico y envolvente. Los asientos se asignan por orden de llegada.",
    tone: "bg-orange-500",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <path
          d="M6 10h12v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M8 10V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M7 16v2M17 16v2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Dejá que la música te mueva",
    body: "Disfrutá de músicos de élite y voces poderosas mientras el show cobra vida.",
    tone: "bg-sky-800",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <path
          d="M9 18V6l10-2v12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17" cy="16" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
] as const;

/** Igual en todos los eventos: guía del día de la función. */
export function HowItWorks() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          El día del evento
        </p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Cómo funciona</h2>
      </div>

      <ol className="relative flex flex-col gap-8">
        <span
          className="absolute top-3 bottom-3 left-[1.15rem] w-px bg-zinc-200 sm:left-[1.4rem]"
          aria-hidden
        />
        {STEPS.map((step) => (
          <li key={step.title} className="relative flex gap-4 sm:gap-5">
            <span
              className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl text-white sm:size-11 ${step.tone}`}
            >
              {step.icon}
            </span>
            <div className="flex flex-col gap-1.5 pt-0.5">
              <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
