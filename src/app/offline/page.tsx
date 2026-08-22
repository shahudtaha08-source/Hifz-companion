export default function OfflinePage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-widest text-brand-600 dark:text-brand-300">Offline</p>
      <h1 className="text-2xl font-semibold mt-3">You’re offline</h1>
      <p className="text-sm text-ink-light/60 dark:text-ink-dark/60 mt-3 leading-relaxed">
        Previously opened Hifz Companion pages may still be available. Quran pages and content that have already been cached can continue working, while uncached pages and streaming audio need an internet connection.
      </p>
    </div>
  );
}
