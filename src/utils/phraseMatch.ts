/**
 * Phrase-level matching primitives for the Mutashabihat engine.
 *
 * Operates purely on token arrays (already normalized for search — see
 * arabicNormalize.ts). Never touches display text.
 */

export interface PhraseMatch {
  /** Length of the matched phrase, in tokens. */
  length: number;
  /** 0-based inclusive token index range of the phrase within `a`. */
  aStart: number;
  aEnd: number;
  /** 0-based inclusive token index range of the phrase within `b`. */
  bStart: number;
  bEnd: number;
}

/**
 * Find the longest common CONTIGUOUS run of tokens between two token
 * sequences (longest common substring, at the word level rather than the
 * character level). This is the core signal for phrase-level Mutashabihat:
 * it finds "what phrase is actually shared" rather than approximating
 * whole-ayah similarity, so a short shared phrase inside a much longer ayah
 * is still detected correctly.
 *
 * Returns null if there's no shared token at all.
 */
export function longestCommonPhrase(a: string[], b: string[]): PhraseMatch | null {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );

  let best = 0;
  let aEnd = -1;
  let bEnd = -1;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
        if (dp[i]![j]! > best) {
          best = dp[i]![j]!;
          aEnd = i - 1;
          bEnd = j - 1;
        }
      }
    }
  }

  if (best === 0) return null;

  return {
    length: best,
    aStart: aEnd - best + 1,
    aEnd,
    bStart: bEnd - best + 1,
    bEnd,
  };
}
