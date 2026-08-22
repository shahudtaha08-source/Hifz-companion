import { highlightPhrase } from "@/utils/highlightPhrase";
import type { PhraseSpan } from "@/types/quran";

export function HighlightedAyahText({
  text,
  phrase,
  numberInSurah,
  className = "",
}: {
  text: string;
  /** Omit to render with no highlighting (e.g. plain context ayahs). */
  phrase?: PhraseSpan;
  numberInSurah?: number;
  className?: string;
}) {
  const words = phrase ? highlightPhrase(text, phrase.start, phrase.end) : null;

  return (
    <p className={`ayah-text leading-loose ${className}`}>
      {words
        ? words.map((w, i) => (
            <span
              key={i}
              className={w.highlighted ? "bg-brand-200/60 dark:bg-brand-800/50 rounded px-0.5" : undefined}
            >
              {w.word}{" "}
            </span>
          ))
        : text}
      {numberInSurah != null && (
        <span className="ayah-text mx-1.5 text-brand-500 text-base align-middle select-none">
          ﴿{numberInSurah}﴾
        </span>
      )}
    </p>
  );
}
