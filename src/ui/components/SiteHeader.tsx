import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader({ crumb }: { crumb?: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
      <Link
        href="/"
        className="flex items-center gap-2 font-display text-[17px] font-bold tracking-tight text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-6 text-accent" aria-hidden="true">
          <path d="M12 3 21 7.5 12 12 3 7.5Z" fill="currentColor" opacity=".35" />
          <path d="M3 7.5V16.5L12 21V12Z" fill="currentColor" opacity=".7" />
          <path d="M21 7.5V16.5L12 21V12Z" fill="currentColor" />
        </svg>
        CI-3715 · Ingeniería de Software
      </Link>
      {crumb ? (
        <span className="hidden min-w-0 truncate text-sm text-muted sm:block">/ {crumb}</span>
      ) : null}
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
