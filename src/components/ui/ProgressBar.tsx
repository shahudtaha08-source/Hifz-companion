export function ProgressBar({ percentage }: { percentage: number }) {
  const clamped = Math.max(0, Math.min(100, percentage));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full rounded-full bg-brand-100 dark:bg-brand-950 overflow-hidden"
    >
      <div
        className="h-full rounded-full bg-brand-500 transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
