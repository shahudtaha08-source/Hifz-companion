/**
 * Domain types for Quran reference data.
 *
 * IMPORTANT: `textUthmani` is the only field that should ever be rendered
 * as "the Quran text" in the UI. Do not display `textSearchNormalized`.
 */

export type RevelationType = "meccan" | "medinan";

export interface SurahSummary {
  id: number; // 1-114
  nameArabic: string;
  nameTransliterated: string;
  nameTranslated: string | null;
  revelationType: RevelationType;
  totalAyahs: number;
}

export interface AyahRecord {
  id: string;
  surahId: number;
  numberInSurah: number;
  globalAyahNumber: number;
  textUthmani: string;
  /** Search-only. Never render this in the UI. */
  textSearchNormalized: string;
  juz: number;
  hizb: number;
  rubAlHizb: number | null;
  page: number | null;
  isSajdah: boolean;
}

export interface AyahWithSurah extends AyahRecord {
  surah: SurahSummary;
}

export type MatchCategory =
  | "EXACT_FULL_AYAH"
  | "EXACT_PHRASE"
  | "NEAR_EXACT_PHRASE"
  | "SIMILAR_BEGINNING"
  | "SIMILAR_ENDING"
  | "SIMILAR_MIDDLE_PHRASE"
  | "SIMILAR_STRUCTURE"
  | "CONTEXTUAL";

/** 0-based inclusive token-index span of the matched phrase within an ayah's text. */
export interface PhraseSpan {
  start: number;
  end: number;
}

export interface MutashabihatMatchRecord {
  id: string;
  sourceAyahId: string;
  targetAyah: AyahWithSurah;
  category: MatchCategory;
  similarity: number; // 0..1, average phrase coverage over both ayahs
  method: string;
  reason: string;
  sourcePhrase: PhraseSpan;
  targetPhrase: PhraseSpan;
}

/** An ayah plus its immediate neighbors within the same Surah, for context display. */
export interface AyahWithContext {
  previous: AyahWithSurah | null;
  current: AyahWithSurah;
  next: AyahWithSurah | null;
}

export type HifzStatus =
  | "NOT_STARTED"
  | "LEARNING"
  | "MEMORIZED"
  | "NEEDS_REVISION"
  | "WEAK"
  | "FORGOTTEN"
  | "RE_MEMORIZING";

export type RecallQuality =
  | "PERFECT"
  | "MINOR_MISTAKE"
  | "MAJOR_MISTAKE"
  | "COULD_NOT_RECALL";

export type MistakeType =
  | "WORD_FORGOTTEN"
  | "WORD_REPLACED"
  | "WORD_ORDER"
  | "SIMILAR_AYAH_CONFUSION"
  | "ENDING_MISTAKE"
  | "BEGINNING_MISTAKE"
  | "PRONUNCIATION"
  | "VERSE_CONTINUATION";
