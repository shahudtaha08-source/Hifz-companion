import Link from "next/link";

export default function UnderDevelopmentPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">Hifz Companion</p>
      <h1 className="text-3xl font-semibold mt-4">Under Development</h1>
      <p className="text-sm text-ink-light/60 dark:text-ink-dark/60 mt-4 leading-relaxed">
        This feature is part of the next stage of Hifz Companion. We are keeping unfinished learning tools clearly marked rather than showing controls that only look functional.
      </p>
      <Link href="/reader" className="inline-flex mt-6 rounded-full border border-brand-300 dark:border-brand-700 px-4 py-2 text-sm hover:bg-brand-50 dark:hover:bg-brand-950">
        Return to the Quran Reader
      </Link>
    </div>
  );
}
