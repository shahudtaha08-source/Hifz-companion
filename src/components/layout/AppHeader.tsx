"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/reader", label: "Reader" },
  { href: "/hifz", label: "My Hifz" },
  { href: "/mutashabihat", label: "Mutashabihat" },
  { href: "/search", label: "Search" },
  { href: "/daily", label: "Daily Ayah" },
  { href: "/tasbih", label: "Tasbih" },
];

export function AppHeader() {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDark() {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100/90 bg-paper-light/95 backdrop-blur dark:border-brand-900/90 dark:bg-paper-dark/95">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="min-w-0 font-ui font-semibold text-brand-700 dark:text-brand-200 whitespace-nowrap">
          Hifz Companion
        </Link>

        <nav className="hidden lg:flex items-center gap-4 text-sm" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap text-ink-light/80 hover:text-brand-700 dark:text-ink-dark/80 dark:hover:text-brand-300 transition-colors">
              {link.label}
            </Link>
          ))}
          <ThemeButton dark={dark} onClick={toggleDark} />
        </nav>

        <div className="flex lg:hidden items-center gap-2">
          <ThemeButton dark={dark} onClick={toggleDark} />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            className="min-h-10 min-w-10 rounded-lg border border-brand-200 dark:border-brand-800 text-sm"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="lg:hidden border-t border-brand-100 dark:border-brand-900 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg border border-brand-100 dark:border-brand-900 px-3 py-2.5 text-sm text-center hover:bg-brand-50 dark:hover:bg-brand-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function ThemeButton({ dark, onClick }: { dark: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Toggle dark mode" className="min-h-10 rounded-full border border-brand-200 dark:border-brand-800 px-3 text-xs text-ink-light/70 dark:text-ink-dark/70 hover:border-brand-400">
      {dark ? "☀ Light" : "◐ Dark"}
    </button>
  );
}
