export default function HifzLoading() {
  return (
    <div className="max-w-reader mx-auto px-4 py-10 animate-pulse">
      <div className="h-5 w-28 bg-brand-100 dark:bg-brand-900 rounded mb-2" />
      <div className="h-4 w-64 bg-brand-100 dark:bg-brand-900 rounded mb-6" />
      <div className="rounded-lg border border-brand-100 dark:border-brand-900 p-5">
        <div className="h-4 w-40 bg-brand-100 dark:bg-brand-900 rounded mb-3" />
        <div className="h-2 w-full bg-brand-100 dark:bg-brand-900 rounded-full" />
      </div>
    </div>
  );
}
