import Link from "next/link";
import {
  getAyahById,
  getAyahContext,
  getMutashabihatForAyah,
} from "@/services/quranService";
import { getTranslations } from "@/services/translationService";
import { summarizeDifferences } from "@/utils/ayahDiff";
import { AyahContextBlock } from "@/components/quran/AyahContextBlock";
import { MatchCategoryBadge } from "@/components/quran/MatchCategoryBadge";
import type { MatchCategory, MutashabihatMatchRecord } from "@/types/quran";

// Priority order for grouping results — most immediately useful for Hifz first.
const CATEGORY_ORDER: MatchCategory[] = [
  "EXACT_FULL_AYAH",
  "NEAR_EXACT_PHRASE",
  "EXACT_PHRASE",
  "SIMILAR_STRUCTURE",
  "SIMILAR_BEGINNING",
  "SIMILAR_ENDING",
  "SIMILAR_MIDDLE_PHRASE",
  "CONTEXTUAL",
];

const CATEGORY_GROUP_LABEL: Record<MatchCategory, string> = {
  EXACT_FULL_AYAH: "Exact Full Ayah Matches",
  NEAR_EXACT_PHRASE: "Near-Exact Phrase Matches",
  EXACT_PHRASE: "Exact Phrase Matches",
  SIMILAR_STRUCTURE: "Similar Structure",
  SIMILAR_BEGINNING: "Similar Beginning",
  SIMILAR_ENDING: "Similar Ending",
  SIMILAR_MIDDLE_PHRASE: "Similar Middle Phrase",
  CONTEXTUAL: "Other Contextual Mutashabihat",
};

export default async function MutashabihatPage({
  searchParams,
}: {
  searchParams: { ayahId?: string };
}) {
  const ayahId = searchParams.ayahId;

  if (!ayahId) {
    return (
      <div className="max-w-reader mx-auto px-4 py-10 text-sm text-ink-light/60 dark:text-ink-dark/60">
        <h1 className="text-lg font-medium text-brand-800 dark:text-brand-200 mb-2">
          Mutashabihat Finder
        </h1>
        <p>
          Select an ayah in the{" "}
          <Link href="/reader" className="text-brand-600 dark:text-brand-300 underline">
            Reader
          </Link>{" "}
          and choose "Mutashabihat" to search the entire Quran for similar passages.
        </p>
      </div>
    );
  }

  const ayah = await getAyahById(ayahId);
  if (!ayah) {
    return (
      <div className="max-w-reader mx-auto px-4 py-10 text-sm text-ink-light/60 dark:text-ink-dark/60">
        That ayah couldn't be found.
      </div>
    );
  }

  // This search always runs against the full 6236-ayah precomputed index
  // (see scripts/build-mutashabihat-index) — never restricted to the
  // current Surah.
  const [sourceContext, matches] = await Promise.all([
    getAyahContext(ayah),
    getMutashabihatForAyah(ayahId),
  ]);

  // Batch-fetch translations for the source ayah + its context + every
  // matched ayah + each match's context, in one query.
  const contextIds = new Set<string>([ayah.id]);
  if (sourceContext.previous) contextIds.add(sourceContext.previous.id);
  if (sourceContext.next) contextIds.add(sourceContext.next.id);

  const matchContexts = await Promise.all(
    matches.map((m: MutashabihatMatchRecord) => getAyahContext(m.targetAyah))
  );
  matchContexts.forEach((c) => {
    contextIds.add(c.current.id);
    if (c.previous) contextIds.add(c.previous.id);
    if (c.next) contextIds.add(c.next.id);
  });

  const translations = await getTranslations(Array.from(contextIds));

  // Group by category, in a sensible priority order, preserving each
  // group's internal ranking by similarity (already sorted by the query).
  const grouped = new Map<MatchCategory, { match: MutashabihatMatchRecord; context: typeof matchContexts[number] }[]>();
  matches.forEach((match: MutashabihatMatchRecord, i: number) => {
    const list = grouped.get(match.category);
    const entry = { match, context: matchContexts[i]! };
    if (list) list.push(entry);
    else grouped.set(match.category, [entry]);
  });
  const orderedGroups = CATEGORY_ORDER.filter((c) => grouped.has(c)).map((c) => ({
    category: c,
    entries: grouped.get(c)!,
  }));

  return (
    <div className="max-w-reader mx-auto px-4 py-10">
      <h1 className="text-lg font-medium text-brand-800 dark:text-brand-200 mb-1">
        Mutashabihat Finder
      </h1>
      <p className="text-xs text-ink-light/50 dark:text-ink-dark/50 mb-6">
        Searched all 6236 ayahs across all 114 Surahs.
      </p>

      <AyahContextBlock label="Current Location" context={sourceContext} translations={translations} />

      <section className="mt-8">
        {matches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-brand-200 dark:border-brand-800 p-5 text-sm text-ink-light/50 dark:text-ink-dark/50">
            No meaningful Mutashabihat found for this Ayah.
          </div>
        ) : (
          <div className="space-y-8">
            {orderedGroups.map(({ category, entries }) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xs uppercase tracking-wide text-ink-light/50 dark:text-ink-dark/50">
                    {CATEGORY_GROUP_LABEL[category]}
                  </h2>
                  <span className="text-[11px] text-ink-light/35 dark:text-ink-dark/35">
                    ({entries.length})
                  </span>
                </div>
                <div className="space-y-4">
                  {entries.map(({ match, context }) => {
                    const differences = summarizeDifferences(
                      ayah.textUthmani,
                      match.targetAyah.textUthmani
                    );
                    return (
                      <div key={match.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <MatchCategoryBadge category={match.category} />
                            <span className="text-xs text-ink-light/50 dark:text-ink-dark/50">
                              {Math.round(match.similarity * 100)}% coverage
                            </span>
                          </div>
                          <Link
                            href={`/mutashabihat/compare?sourceId=${ayah.id}&targetId=${match.targetAyah.id}`}
                            className="text-xs rounded-md border border-brand-300 dark:border-brand-700 px-3 py-1 hover:bg-brand-50 dark:hover:bg-brand-950"
                          >
                            Compare
                          </Link>
                        </div>
                        <p className="text-xs text-ink-light/60 dark:text-ink-dark/60 mb-2">
                          {match.reason}
                          {differences.length > 0 && (
                            <span className="text-ink-light/40 dark:text-ink-dark/40">
                              {" "}
                              · Differs in {differences.length} word{differences.length === 1 ? "" : "s"} outside the shared phrase.
                            </span>
                          )}
                        </p>
                        <AyahContextBlock
                          label="Matching Location"
                          context={context}
                          phrase={match.targetPhrase}
                          translations={translations}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
