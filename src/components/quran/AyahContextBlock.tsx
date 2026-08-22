"use client";

import { useState } from "react";
import type { AyahWithContext, PhraseSpan } from "@/types/quran";
import { HighlightedAyahText } from "@/components/quran/HighlightedAyahText";
import { TranslationText } from "@/components/quran/TranslationText";

export function AyahContextBlock({
  label,
  context,
  phrase,
  translations,
}: {
  label: string;
  context: AyahWithContext;
  /** Highlighted only on the current/matched ayah, not on its neighbors. */
  phrase?: PhraseSpan;
  translations: Record<string, string>;
}) {
  const [showContextTranslations, setShowContextTranslations] = useState(false);
  const { previous, current, next } = context;

  return (
    <div className="rounded-lg border border-brand-100 dark:border-brand-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wide text-ink-light/50 dark:text-ink-dark/50">
          {label}
        </p>
        <p className="text-xs text-ink-light/50 dark:text-ink-dark/50">
          {current.surah.nameTransliterated} {current.surah.id}:{current.numberInSurah} · Juz{" "}
          {current.juz}
        </p>
      </div>

      {previous ? (
        <HighlightedAyahText
          text={previous.textUthmani}
          numberInSurah={previous.numberInSurah}
          className="text-base text-ink-light/40 dark:text-ink-dark/40"
        />
      ) : (
        <p className="text-[11px] text-ink-light/35 dark:text-ink-dark/35 italic">
          — start of Surah —
        </p>
      )}

      <HighlightedAyahText
        text={current.textUthmani}
        phrase={phrase}
        numberInSurah={current.numberInSurah}
        className="text-2xl my-1.5"
      />

      {next ? (
        <HighlightedAyahText
          text={next.textUthmani}
          numberInSurah={next.numberInSurah}
          className="text-base text-ink-light/40 dark:text-ink-dark/40"
        />
      ) : (
        <p className="text-[11px] text-ink-light/35 dark:text-ink-dark/35 italic">
          — end of Surah —
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-brand-50 dark:border-brand-950">
        <TranslationText text={translations[current.id] ?? null} />

        {(previous || next) && (
          <button
            onClick={() => setShowContextTranslations((s) => !s)}
            className="text-[11px] text-brand-600 dark:text-brand-300 underline mt-2"
          >
            {showContextTranslations ? "Hide" : "Show"} translation for surrounding ayahs
          </button>
        )}
        {showContextTranslations && (
          <div className="mt-2 space-y-1.5">
            {previous && <TranslationText text={translations[previous.id] ?? null} muted />}
            {next && <TranslationText text={translations[next.id] ?? null} muted />}
          </div>
        )}
      </div>
    </div>
  );
}
