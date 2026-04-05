import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-surface-muted bg-surface-raised/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
          Wanderlust
        </Link>
        <nav className="flex gap-4 text-sm text-ink-muted">
          <Link href="/" className="hover:text-accent">
            Destination
          </Link>
          <Link href="/preferences" className="hover:text-accent">
            Preferences
          </Link>
          <Link href="/itinerary" className="hover:text-accent">
            Itinerary
          </Link>
        </nav>
      </div>
    </header>
  );
}
