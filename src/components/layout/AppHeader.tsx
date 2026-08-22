"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/reader", label: "Reader" },
  { href: "/hifz", label: "My Hifz" },
  { href: "/mutashabihat", label: "Mutashabihat" },
  { href: "/search", label: "Search" },
];

export function AppHeader() {
  const [dark, setDark] = useState(false);

  function toggleDark() {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  return (
    <header className="border-b border-brand-100 dark:border-brand-900">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-ui font-semibold text-brand-700 dark:text-brand-200">
          Hifz Companion
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink-light/80 hover:text-brand-700 dark:text-ink-dark/80 dark:hover:text-brand-300 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="rounded-full border border-brand-200 dark:border-brand-800 px-3 py-1 text-xs text-ink-light/70 dark:text-ink-dark/70 hover:border-brand-400"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </nav>
      </div>
    </header>
  );
}
