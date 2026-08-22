"use client";

export default function MutashabihatError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-reader mx-auto px-4 py-16 text-center">
      <p className="text-sm text-ink-light/70 dark:text-ink-dark/70">
        Unable to search Mutashabihat.
      </p>
      <button
        onClick={reset}
        className="inline-block mt-4 rounded-md border border-brand-300 dark:border-brand-700 px-4 py-2 text-sm hover:bg-brand-50 dark:hover:bg-brand-950"
      >
        Try again
      </button>
    </div>
  );
}
