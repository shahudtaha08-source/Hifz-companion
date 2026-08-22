/**
 * Arabic normalization utilities — SEARCH INDEX ONLY.
 *
 * Per section 21/23 of the spec: normalization must NEVER be used to modify
 * the Quran text shown to users. Callers must keep `original_text` and
 * `search_normalized_text` as separate fields (see prisma/schema.prisma:
 * Ayah.textUthmani vs Ayah.textSearchNormalized).
 *
 * The normalization here is deliberately conservative and reversible-in-intent:
 * it only removes marks/variants that are known to cause false negatives in
 * text matching (diacritics, tatweel, letter-shape variants), never anything
 * that changes which letters are semantically present.
 */

const DIACRITICS_REGEX =
  /[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g;

const TATWEEL_REGEX = /\u0640/g; // ـ elongation character

export function stripDiacritics(text: string): string {
  return text.replace(DIACRITICS_REGEX, "");
}

export function stripTatweel(text: string): string {
  return text.replace(TATWEEL_REGEX, "");
}

/**
 * Normalize common letter-shape variants to a canonical form FOR MATCHING
 * PURPOSES ONLY (e.g. treat أ/إ/آ/ٱ as ا so that Mutashabihat comparisons
 * aren't thrown off by orthographic variation that doesn't reflect a real
 * difference in wording).
 */
export function normalizeLetterVariants(text: string): string {
  return text
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Full normalization pipeline used to populate `textSearchNormalized`
 * at import time and to normalize a user's query before searching.
 */
export function normalizeForSearch(rawArabicText: string): string {
  let text = rawArabicText;
  text = stripDiacritics(text);
  text = stripTatweel(text);
  text = normalizeLetterVariants(text);
  text = collapseWhitespace(text);
  return text;
}

export function tokenize(normalizedText: string): string[] {
  return normalizedText.split(" ").filter(Boolean);
}

/** Generate word n-grams (used by the Mutashabihat indexer, section 22). */
export function nGrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return [];
  const grams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join(" "));
  }
  return grams;
}
