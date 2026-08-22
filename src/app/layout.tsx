import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";
import { ServiceWorkerRegistration } from "@/components/layout/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Hifz Companion — Quran Memorization & Mutashabihat",
  description:
    "A Hifz memorization and revision companion with a Mutashabihat (similar-ayah) finder. A study aid — not a replacement for a qualified Quran teacher.",
  applicationName: "Hifz Companion",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Hifz Companion", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2f6b4f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="W40nEh6eH9wUnLdOAEmTtojwGSJpStDkEkAzo7S2Ea0"
        />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-1">{children}</main>
          <footer className="text-center text-xs text-ink-light/50 dark:text-ink-dark/50 py-6">
            This app is a memorization and revision aid. It does not replace a qualified Quran
            teacher (Ustadh/Ustadha) for tajweed, ijazah, or verification of memorization.
          </footer>
        </div>
      </body>
    </html>
  );
}
