import type { HifzStatus } from "@/types/quran";

/** Counts of ayahs per status, plus a derived NOT_STARTED bucket. */
export interface StatusCounts {
  total: number;
  notStarted: number;
  learning: number;
  memorized: number;
  needsRevision: number;
  weak: number;
  reMemorizing: number;
  forgotten: number;
}

export interface OverallHifzProgress extends StatusCounts {
  /** memorized / total * 100, rounded to the nearest integer. */
  percentage: number;
  hasAnyProgress: boolean;
}

export interface SurahProgress extends StatusCounts {
  surahId: number;
  nameArabic: string;
  nameTransliterated: string;
  percentage: number;
}

export interface JuzProgress extends StatusCounts {
  juz: number;
  percentage: number;
}

export interface WeakAyahSummary {
  ayahId: string;
  surahId: number;
  surahNameTransliterated: string;
  numberInSurah: number;
  globalAyahNumber: number;
  status: HifzStatus;
}

export interface ContinueHifzTarget {
  ayahId: string;
  surahId: number;
  numberInSurah: number;
  reason: "learning" | "not_started_after_position" | "start_of_quran";
}
