import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-950 sm:text-xl"
        >
          Boletería Mendoza del oeste
        </Link>
        <nav className="flex items-center gap-5 text-sm text-zinc-600">
          <Link href="/#organizadores" className="transition hover:text-zinc-950">
            Organizadores
          </Link>
          <Link href="/privacidad" className="hidden transition hover:text-zinc-950 sm:inline">
            Privacidad
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-zinc-950 px-3.5 py-1.5 text-white transition hover:bg-zinc-800"
          >
            Personal
          </Link>
        </nav>
      </div>
    </header>
  );
}
