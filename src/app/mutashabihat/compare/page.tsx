import Link from "next/link";
import {
  getAyahById,
  getAyahContext,
  getMutashabihatForAyah,
} from "@/services/quranService";
import { getTranslations } from "@/services/translationService";
import { diffWords } from "@/utils/ayahDiff";
import { highlightPhrase } from "@/utils/highlightPhrase";
import { MatchCategoryBadge } from "@/components/quran/MatchCategoryBadge";
import { TranslationText } from "@/components/quran/TranslationText";
import { HighlightedAyahText } from "@/components/quran/HighlightedAyahText";
import type { PhraseSpan } from "@/types/quran";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { sourceId?: string; targetId?: string };
}) {
  const { sourceId, targetId } = searchParams;

  if (!sourceId || !targetId) {
    return (
      <div className="max-w-reader mx-auto px-4 py-10 text-sm text-ink-light/60 dark:text-ink-dark/60">
        Missing ayahs to compare.
      </div>
    );
  }

  const [source, target, allMatches] = await Promise.all([
    getAyahById(sourceId),
    getAyahById(targetId),
    getMutashabihatForAyah(sourceId, 50),
  ]);

  if (!source || !target) {
    return (
      <div className="max-w-reader mx-auto px-4 py-10 text-sm text-ink-light/60 dark:text-ink-dark/60">
        One of these ayahs couldn't be found.
      </div>
    );
  }

  const thisMatch = allMatches.find((m) => m.targetAyah.id === targetId);

  const [sourceContext, targetContext] = await Promise.all([
    getAyahContext(source),
    getAyahContext(target),
  ]);

  const translationIds = new Set<string>([source.id, target.id]);
  for (const c of [sourceContext, targetContext]) {
    if (c.previous) translationIds.add(c.previous.id);
    if (c.next) translationIds.add(c.next.id);
  }
  const translations = await getTranslations(Array.from(translationIds));

  const { a: sourceDiffWords, b: targetDiffWords } = diffWords(
    source.textUthmani,
    target.textUthmani
  );

  const currentIdx = allMatches.findIndex((m) => m.targetAyah.id === targetId);
  const prevMatch = currentIdx > 0 ? allMatches[currentIdx - 1] : null;
  const nextMatch =
    currentIdx >= 0 && currentIdx < allMatches.length - 1 ? allMatches[currentIdx + 1] : null;

  return (
    <div className="max-w-reader mx-auto px-4 py-10">
      <Link
        href={`/mutashabihat?ayahId=${source.id}`}
        className="text-xs text-ink-light/50 dark:text-ink-dark/50 hover:text-brand-600"
      >
        ← Back to results
      </Link>

      {thisMatch && (
        <div className="flex items-center gap-2 mt-3">
          <MatchCategoryBadge category={thisMatch.category} />
          <span className="text-xs text-ink-light/50 dark:text-ink-dark/50">
            {thisMatch.reason}
          </span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <ComparePanel
          label="Current"
          context={sourceContext}
          phrase={thisMatch?.sourcePhrase}
          diffWords={sourceDiffWords}
          translations={translations}
        />
        <ComparePanel
          label="Matching"
          context={targetContext}
          phrase={thisMatch?.targetPhrase}
          diffWords={targetDiffWords}
          translations={translations}
        />
      </div>

      <p className="text-[11px] text-ink-light/40 dark:text-ink-dark/40 mt-3">
        Highlighted background = the shared Mutashabihat phrase. Underlined words = differ
        between the two ayahs.
      </p>

      <div className="flex items-center justify-between mt-8">
        <NavButton
          label="Previous Similar"
          href={
            prevMatch
              ? `/mutashabihat/compare?sourceId=${source.id}&targetId=${prevMatch.targetAyah.id}`
              : undefined
          }
        />
        <NavButton
          label="Next Similar"
          href={
            nextMatch
              ? `/mutashabihat/compare?sourceId=${source.id}&targetId=${nextMatch.targetAyah.id}`
              : undefined
          }
        />
      </div>
    </div>
  );
}

function ComparePanel({
  label,
  context,
  phrase,
  diffWords: words,
  translations,
}: {
  label: string;
  context: Awaited<ReturnType<typeof getAyahContext>>;
  phrase?: PhraseSpan;
  diffWords: { word: string; differs: boolean }[];
  translations: Record<string, string>;
}) {
  const { previous, current, next } = context;
  const highlighted = phrase ? highlightPhrase(current.textUthmani, phrase.start, phrase.end) : null;

  return (
    <div className="rounded-lg border border-brand-100 dark:border-brand-900 p-4">
      <p className="text-xs uppercase tracking-wide text-ink-light/50 dark:text-ink-dark/50 mb-1">
        {label}
      </p>
      <p className="text-xs text-ink-light/50 dark:text-ink-dark/50 mb-3">
        {current.surah.nameTransliterated} {current.surah.id}:{current.numberInSurah} · Juz{" "}
        {current.juz}
      </p>

      {previous ? (
        <HighlightedAyahText
          text={previous.textUthmani}
          numberInSurah={previous.numberInSurah}
          className="text-sm text-ink-light/35 dark:text-ink-dark/35 mb-1"
        />
      ) : (
        <p className="text-[11px] text-ink-light/30 dark:text-ink-dark/30 italic mb-1">
          — start of Surah —
        </p>
      )}

      {/* Current/matched ayah: combine word-diff (underline) with phrase highlight (background) */}
      <p className="ayah-text text-xl leading-loose">
        {words.map((w, i) => {
          const isPhraseWord = highlighted?.[i]?.highlighted ?? false;
          return (
            <span
              key={i}
              className={[
                isPhraseWord ? "bg-brand-200/60 dark:bg-brand-800/50 rounded px-0.5" : "",
                w.differs ? "underline decoration-gold-500 decoration-2 underline-offset-4" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {w.word}{" "}
            </span>
          );
        })}
        <span className="ayah-text mx-1.5 text-brand-500 text-base align-middle select-none">
          ﴿{current.numberInSurah}﴾
        </span>
      </p>

      {next ? (
        <HighlightedAyahText
          text={next.textUthmani}
          numberInSurah={next.numberInSurah}
          className="text-sm text-ink-light/35 dark:text-ink-dark/35 mt-1"
        />
      ) : (
        <p className="text-[11px] text-ink-light/30 dark:text-ink-dark/30 italic mt-1">
          — end of Surah —
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-brand-50 dark:border-brand-950">
        <TranslationText text={translations[current.id] ?? null} />
      </div>
    </div>
  );
}

function NavButton({ label, href }: { label: string; href?: string }) {
  if (!href) {
    return (
      <span className="text-xs text-ink-light/30 dark:text-ink-dark/30 cursor-not-allowed">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="text-xs rounded-full border border-brand-200 dark:border-brand-800 px-3 py-1.5 hover:border-brand-400"
    >
      {label}
    </Link>
  );
}
