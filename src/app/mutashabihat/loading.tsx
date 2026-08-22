export default function MutashabihatLoading() {
  return (
    <div className="max-w-reader mx-auto px-4 py-10 animate-pulse">
      <p className="text-sm text-ink-light/50 dark:text-ink-dark/50 mb-6">
        Searching the entire Quran...
      </p>
      <div className="rounded-lg border border-brand-100 dark:border-brand-900 p-4 h-28" />
      <div className="h-3 w-32 bg-brand-100 dark:bg-brand-900 rounded mt-8 mb-3" />
      <div className="space-y-2">
        <div className="rounded-lg border border-brand-100 dark:border-brand-900 p-4 h-28" />
        <div className="rounded-lg border border-brand-100 dark:border-brand-900 p-4 h-28" />
      </div>
    </div>
  );
}
