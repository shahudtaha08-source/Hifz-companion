import { db } from "@/lib/db";
import type {
  AyahWithContext,
  AyahWithSurah,
  MatchCategory,
  MutashabihatMatchRecord,
  SurahSummary,
} from "@/types/quran";

function toSurahSummary(s: {
  id: number;
  nameArabic: string;
  nameTransliterated: string;
  nameTranslated: string | null;
  revelationType: string;
  totalAyahs: number;
}): SurahSummary {
  return {
    id: s.id,
    nameArabic: s.nameArabic,
    nameTransliterated: s.nameTransliterated,
    nameTranslated: s.nameTranslated,
    revelationType: s.revelationType as "meccan" | "medinan",
    totalAyahs: s.totalAyahs,
  };
}

export async function listSurahs(): Promise<SurahSummary[]> {
  const surahs = await db.surah.findMany({ orderBy: { id: "asc" } });
  return surahs.map(toSurahSummary);
}

export async function getSurahWithAyahs(surahId: number): Promise<AyahWithSurah[]> {
  const surah = await db.surah.findUnique({ where: { id: surahId } });
  if (!surah) return [];
  const ayahs = await db.ayah.findMany({
    where: { surahId },
    orderBy: { numberInSurah: "asc" },
  });
  const summary = toSurahSummary(surah);
  return ayahs.map((a: (typeof ayahs)[number]) => ({ ...a, surah: summary }));
}

export async function getAyahById(ayahId: string): Promise<AyahWithSurah | null> {
  const ayah = await db.ayah.findUnique({ where: { id: ayahId }, include: { surah: true } });
  if (!ayah) return null;
  const { surah, ...rest } = ayah;
  return { ...rest, surah: toSurahSummary(surah) };
}

export async function getAyahsByJuz(juz: number): Promise<AyahWithSurah[]> {
  const ayahs = await db.ayah.findMany({
    where: { juz },
    include: { surah: true },
    orderBy: { globalAyahNumber: "asc" },
  });
  return ayahs.map(({ surah, ...rest }: (typeof ayahs)[number]) => ({ ...rest, surah: toSurahSummary(surah) }));
}

export async function getAyahsByPage(page: number): Promise<AyahWithSurah[]> {
  const ayahs = await db.ayah.findMany({
    where: { page },
    include: { surah: true },
    orderBy: { globalAyahNumber: "asc" },
  });
  return ayahs.map(({ surah, ...rest }: (typeof ayahs)[number]) => ({ ...rest, surah: toSurahSummary(surah) }));
}

/**
 * Full-text-ish search over Quran text. This is a straightforward substring
 * search over the search-normalized field, adequate for Phase 1. It is
 * superseded (for similar-ayah discovery) by the precomputed Mutashabihat
 * index built in /scripts/build-mutashabihat-index (see mutashabihatService).
 */
export async function searchAyahs(query: string, limit = 30): Promise<AyahWithSurah[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const ayahs = await db.ayah.findMany({
    where: { textSearchNormalized: { contains: trimmed } },
    include: { surah: true },
    take: limit,
    orderBy: { globalAyahNumber: "asc" },
  });
  return ayahs.map(({ surah, ...rest }: (typeof ayahs)[number]) => ({ ...rest, surah: toSurahSummary(surah) }));
}

export async function getMutashabihatForAyah(
  ayahId: string,
  limit = 20
): Promise<MutashabihatMatchRecord[]> {
  const matches = await db.mutashabihatMatch.findMany({
    where: { sourceAyahId: ayahId },
    include: { targetAyah: { include: { surah: true } } },
    orderBy: { similarity: "desc" },
    take: limit,
  });

  return matches.map((m: (typeof matches)[number]) => {
    const { surah, ...ayahRest } = m.targetAyah;
    return {
      id: m.id,
      sourceAyahId: m.sourceAyahId,
      targetAyah: { ...ayahRest, surah: toSurahSummary(surah) },
      category: m.category as MatchCategory,
      similarity: m.similarity,
      method: m.method,
      reason: m.reason,
      sourcePhrase: { start: m.sourcePhraseStart, end: m.sourcePhraseEnd },
      targetPhrase: { start: m.targetPhraseStart, end: m.targetPhraseEnd },
    };
  });
}

/**
 * An ayah plus its immediate previous/next neighbor within the SAME Surah
 * (Mutashabihat context never silently crosses a Surah boundary — at the
 * first or last ayah of a Surah, the corresponding side is simply null,
 * which the UI labels as "start of Surah" / "end of Surah" rather than
 * fabricating a neighbor).
 */
export async function getAyahContext(ayah: AyahWithSurah): Promise<AyahWithContext> {
  const [previous, next] = await Promise.all([
    ayah.numberInSurah > 1
      ? db.ayah.findUnique({
          where: {
            surahId_numberInSurah: { surahId: ayah.surahId, numberInSurah: ayah.numberInSurah - 1 },
          },
        })
      : Promise.resolve(null),
    ayah.numberInSurah < ayah.surah.totalAyahs
      ? db.ayah.findUnique({
          where: {
            surahId_numberInSurah: { surahId: ayah.surahId, numberInSurah: ayah.numberInSurah + 1 },
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    previous: previous ? { ...previous, surah: ayah.surah } : null,
    current: ayah,
    next: next ? { ...next, surah: ayah.surah } : null,
  };
}
