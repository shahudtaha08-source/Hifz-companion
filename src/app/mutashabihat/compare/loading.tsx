export default function CompareLoading() {
  return (
    <div className="max-w-reader mx-auto px-4 py-10 animate-pulse">
      <div className="h-3 w-24 bg-brand-100 dark:bg-brand-900 rounded mb-4" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-brand-100 dark:border-brand-900 p-4 h-40" />
        <div className="rounded-lg border border-brand-100 dark:border-brand-900 p-4 h-40" />
      </div>
    </div>
  );
}
