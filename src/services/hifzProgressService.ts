import { db } from "@/lib/db";
import type { HifzStatus } from "@/types/quran";
import type {
  ContinueHifzTarget,
  JuzProgress,
  OverallHifzProgress,
  StatusCounts,
  SurahProgress,
  WeakAyahSummary,
} from "@/types/hifz";

/**
 * Hifz progress calculation service.
 *
 * This is the ONLY place that computes progress percentages / status
 * counts. Pages and components should call into this service rather than
 * recomputing counts themselves, per the "don't duplicate progress
 * calculations across components" requirement.
 *
 * A key modeling detail: an `AyahStatus` row only exists once a user has
 * explicitly set a status for that ayah (see the Reset behavior in
 * hifz-tracking actions, which deletes the row rather than writing
 * NOT_STARTED). So "not started" is always derived as
 * `total - (everything else)`, never stored — an ayah is never counted as
 * memorized/learning/etc. just because it was opened or viewed.
 */

const EMPTY_COUNTS: Omit<StatusCounts, "total" | "notStarted"> = {
  learning: 0,
  memorized: 0,
  needsRevision: 0,
  weak: 0,
  reMemorizing: 0,
  forgotten: 0,
};

function tallyStatuses(
  statuses: { status: string }[],
  total: number
): StatusCounts {
  const counts = { ...EMPTY_COUNTS };
  for (const { status } of statuses) {
    switch (status as HifzStatus) {
      case "LEARNING":
        counts.learning++;
        break;
      case "MEMORIZED":
        counts.memorized++;
        break;
      case "NEEDS_REVISION":
        counts.needsRevision++;
        break;
      case "WEAK":
        counts.weak++;
        break;
      case "RE_MEMORIZING":
        counts.reMemorizing++;
        break;
      case "FORGOTTEN":
        counts.forgotten++;
        break;
      // NOT_STARTED rows are never persisted (see module comment above),
      // so there's intentionally no case for it here.
    }
  }
  const accountedFor =
    counts.learning +
    counts.memorized +
    counts.needsRevision +
    counts.weak +
    counts.reMemorizing +
    counts.forgotten;

  return {
    total,
    notStarted: Math.max(total - accountedFor, 0),
    ...counts,
  };
}

function percentageOf(memorized: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((memorized / total) * 100);
}

/** Overall progress across the entire Quran (6236 ayahs) for one user. */
export async function getOverallProgress(userId: string): Promise<OverallHifzProgress> {
  const [totalAyahs, statuses] = await Promise.all([
    db.ayah.count(),
    db.ayahStatus.findMany({ where: { userId }, select: { status: true } }),
  ]);

  const counts = tallyStatuses(statuses, totalAyahs);
  return {
    ...counts,
    percentage: percentageOf(counts.memorized, counts.total),
    hasAnyProgress: statuses.length > 0,
  };
}

/** Progress broken down per Surah (114 rows), for one user. */
export async function getSurahProgress(userId: string): Promise<SurahProgress[]> {
  const [surahs, statuses] = await Promise.all([
    db.surah.findMany({
      select: { id: true, nameArabic: true, nameTransliterated: true, totalAyahs: true },
      orderBy: { id: "asc" },
    }),
    db.ayahStatus.findMany({
      where: { userId },
      select: { status: true, ayah: { select: { surahId: true } } },
    }),
  ]);

  const bySurah = new Map<number, { status: string }[]>();
  for (const s of statuses) {
    const list = bySurah.get(s.ayah.surahId);
    if (list) list.push({ status: s.status });
    else bySurah.set(s.ayah.surahId, [{ status: s.status }]);
  }

  return surahs.map((surah: (typeof surahs)[number]) => {
    const counts = tallyStatuses(bySurah.get(surah.id) ?? [], surah.totalAyahs);
    return {
      surahId: surah.id,
      nameArabic: surah.nameArabic,
      nameTransliterated: surah.nameTransliterated,
      ...counts,
      percentage: percentageOf(counts.memorized, counts.total),
    };
  });
}

/** Progress broken down per Juz (30 rows), for one user. */
export async function getJuzProgress(userId: string): Promise<JuzProgress[]> {
  const [juzTotals, statuses] = await Promise.all([
    db.ayah.groupBy({ by: ["juz"], _count: { _all: true } }),
    db.ayahStatus.findMany({
      where: { userId },
      select: { status: true, ayah: { select: { juz: true } } },
    }),
  ]);

  const totalsByJuz = new Map<number, number>();
  for (const row of juzTotals) totalsByJuz.set(row.juz, row._count._all);

  const byJuz = new Map<number, { status: string }[]>();
  for (const s of statuses) {
    const list = byJuz.get(s.ayah.juz);
    if (list) list.push({ status: s.status });
    else byJuz.set(s.ayah.juz, [{ status: s.status }]);
  }

  const juzNumbers = Array.from(totalsByJuz.keys()).sort((a, b) => a - b);

  return juzNumbers.map((juz) => {
    const total = totalsByJuz.get(juz) ?? 0;
    const counts = tallyStatuses(byJuz.get(juz) ?? [], total);
    return {
      juz,
      ...counts,
      percentage: percentageOf(counts.memorized, counts.total),
    };
  });
}

/** Weak-first list for the "Weak Ayahs" dashboard/hifz-page section. */
export async function getWeakAyahs(userId: string, limit = 20): Promise<WeakAyahSummary[]> {
  const rows = await db.ayahStatus.findMany({
    where: { userId, status: { in: ["WEAK", "NEEDS_REVISION", "RE_MEMORIZING"] } },
    include: {
      ayah: {
        select: {
          id: true,
          surahId: true,
          numberInSurah: true,
          globalAyahNumber: true,
          surah: { select: { nameTransliterated: true } },
        },
      },
    },
  });

  // Sort primarily WEAK > NEEDS_REVISION > RE_MEMORIZING, then by Quran order.
  const priority: Record<string, number> = {
    WEAK: 0,
    NEEDS_REVISION: 1,
    RE_MEMORIZING: 2,
  };

  rows.sort((a: (typeof rows)[number], b: (typeof rows)[number]) => {
    const p = (priority[a.status] ?? 99) - (priority[b.status] ?? 99);
    if (p !== 0) return p;
    return a.ayah.globalAyahNumber - b.ayah.globalAyahNumber;
  });

  return rows.slice(0, limit).map((r: (typeof rows)[number]) => ({
    ayahId: r.ayah.id,
    surahId: r.ayah.surahId,
    surahNameTransliterated: r.ayah.surah.nameTransliterated,
    numberInSurah: r.ayah.numberInSurah,
    globalAyahNumber: r.ayah.globalAyahNumber,
    status: r.status as HifzStatus,
  }));
}

/**
 * "Continue Hifz" target-selection logic (kept isolated here so it can
 * evolve into a smarter planner later without touching callers).
 *
 * 1. First ayah currently marked LEARNING (Quran order).
 * 2. Else, the first NOT_STARTED ayah after the user's current position
 *    (position = the furthest-along ayah they have any status for).
 * 3. Else (no progress at all), the very first ayah of the Quran.
 */
export async function getContinueHifzTarget(userId: string): Promise<ContinueHifzTarget> {
  const learning = await db.ayahStatus.findFirst({
    where: { userId, status: "LEARNING" },
    include: { ayah: { select: { id: true, surahId: true, numberInSurah: true } } },
    orderBy: { ayah: { globalAyahNumber: "asc" } },
  });

  if (learning) {
    return {
      ayahId: learning.ayah.id,
      surahId: learning.ayah.surahId,
      numberInSurah: learning.ayah.numberInSurah,
      reason: "learning",
    };
  }

  const furthest = await db.ayahStatus.findFirst({
    where: { userId },
    include: { ayah: { select: { globalAyahNumber: true } } },
    orderBy: { ayah: { globalAyahNumber: "desc" } },
  });

  const afterPosition = furthest ? furthest.ayah.globalAyahNumber : 0;

  const nextNotStarted = await db.ayah.findFirst({
    where: {
      globalAyahNumber: { gt: afterPosition },
      ayahStatuses: { none: { userId } },
    },
    select: { id: true, surahId: true, numberInSurah: true },
    orderBy: { globalAyahNumber: "asc" },
  });

  if (nextNotStarted) {
    return {
      ayahId: nextNotStarted.id,
      surahId: nextNotStarted.surahId,
      numberInSurah: nextNotStarted.numberInSurah,
      reason: furthest ? "not_started_after_position" : "start_of_quran",
    };
  }

  // Every ayah has some status (e.g. all memorized) — fall back to the start.
  const first = await db.ayah.findFirstOrThrow({
    where: { surahId: 1, numberInSurah: 1 },
    select: { id: true, surahId: true, numberInSurah: true },
  });

  return {
    ayahId: first.id,
    surahId: first.surahId,
    numberInSurah: first.numberInSurah,
    reason: "start_of_quran",
  };
}

/** Status map for a specific set of ayahs (used by the reader to show current status). */
export async function getStatusMapForAyahs(
  userId: string,
  ayahIds: string[]
): Promise<Record<string, HifzStatus>> {
  if (ayahIds.length === 0) return {};
  const rows = await db.ayahStatus.findMany({
    where: { userId, ayahId: { in: ayahIds } },
    select: { ayahId: true, status: true },
  });
  const map: Record<string, HifzStatus> = {};
  for (const row of rows) map[row.ayahId] = row.status as HifzStatus;
  return map;
}
