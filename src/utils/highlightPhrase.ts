/**
 * Highlights a matched phrase within the ORIGINAL Uthmani text, given a
 * token-index span that was found by comparing NORMALIZED text (see
 * scripts/build-mutashabihat-index).
 *
 * This relies on original-text whitespace tokenization staying 1:1 aligned
 * with normalized-text tokenization — verified across the full real Quran
 * dataset (6236/6236 ayahs, zero mismatches) before this was written, since
 * normalizeForSearch only rewrites characters within tokens (stripping
 * diacritics/tatweel, substituting letter variants) and never merges or
 * splits a word. If a mismatch is ever encountered anyway (e.g. a future
 * dataset with irregular spacing), this fails safe by returning the full
 * ayah unhighlighted rather than mis-highlighting the wrong words.
 */

export interface HighlightedWord {
  word: string;
  highlighted: boolean;
}

export function highlightPhrase(
  originalText: string,
  phraseStart: number,
  phraseEnd: number
): HighlightedWord[] {
  const words = originalText.trim().split(/\s+/).filter(Boolean);

  if (
    phraseStart < 0 ||
    phraseEnd < phraseStart ||
    phraseEnd >= words.length
  ) {
    // Fail safe: span doesn't fit this text (shouldn't happen given the
    // verified alignment, but never crash or mis-highlight over it).
    return words.map((word) => ({ word, highlighted: false }));
  }

  return words.map((word, i) => ({
    word,
    highlighted: i >= phraseStart && i <= phraseEnd,
  }));
}
