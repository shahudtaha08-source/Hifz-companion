import { db } from "@/lib/db";

/**
 * Translation service.
 *
 * Mirrors the audio provider abstraction in quranAudioService.ts: this is
 * the only place that reads translation data, so adding a second language
 * or source later means extending this file, not every caller.
 *
 * Translations are stored in a table separate from Ayah (see
 * AyahTranslation / TranslationSource in the schema) and are never merged
 * into or displayed as Quran text — see src/components/quran/Translation.tsx
 * for how the UI keeps the two visually distinct.
 *
 * Current source: Saheeh International (Umm Muhammad), via the same
 * quran-json package used for the Arabic text, sourced from tanzil.net,
 * CC-BY-SA 4.0. No AI-generated or paraphrased text — this is a verified,
 * attributed human translation, imported verbatim by
 * scripts/import-quran/index.ts.
 */

const DEFAULT_LANGUAGE = "en";

export async function getTranslation(
  ayahId: string,
  languageCode: string = DEFAULT_LANGUAGE
): Promise<string | null> {
  const row = await db.ayahTranslation.findFirst({
    where: { ayahId, languageCode, source: { isActive: true } },
    select: { text: true },
  });
  return row?.text ?? null;
}

/** Batch lookup, for rendering a list of ayahs (e.g. context around a match) in one query. */
export async function getTranslations(
  ayahIds: string[],
  languageCode: string = DEFAULT_LANGUAGE
): Promise<Record<string, string>> {
  if (ayahIds.length === 0) return {};
  const rows = await db.ayahTranslation.findMany({
    where: { ayahId: { in: ayahIds }, languageCode, source: { isActive: true } },
    select: { ayahId: true, text: true },
  });
  const map: Record<string, string> = {};
  for (const row of rows) map[row.ayahId] = row.text;
  return map;
}
