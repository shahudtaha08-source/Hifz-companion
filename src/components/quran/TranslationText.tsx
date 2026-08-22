export function TranslationText({
  text,
  muted = false,
}: {
  text: string | null;
  muted?: boolean;
}) {
  if (!text) return null;
  return (
    <p
      className={`text-sm italic leading-relaxed ${
        muted
          ? "text-ink-light/50 dark:text-ink-dark/50"
          : "text-ink-light/75 dark:text-ink-dark/75"
      }`}
    >
      {text}
      <span className="not-italic text-[10px] text-ink-light/40 dark:text-ink-dark/40 ml-1.5">
        — Saheeh International
      </span>
    </p>
  );
}
