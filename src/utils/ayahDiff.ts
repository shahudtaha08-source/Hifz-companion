/**
 * Word-level diff for display purposes only (Mutashabihat comparison view).
 * This never mutates or "corrects" the underlying Quran text — it only
 * computes which word positions differ so the UI can highlight them.
 */

export interface DiffWord {
  word: string;
  differs: boolean;
}

/**
 * Simple LCS-based word alignment. Good enough for near-identical Mutashabihat
 * ayahs (a handful of word insertions/substitutions), which is the common case.
 */
export function diffWords(a: string, b: string): { a: DiffWord[]; b: DiffWord[] } {
  const wordsA = a.split(/\s+/).filter(Boolean);
  const wordsB = b.split(/\s+/).filter(Boolean);

  const n = wordsA.length;
  const m = wordsB.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (wordsA[i - 1] === wordsB[j - 1]) {
        lcs[i]![j] = lcs[i - 1]![j - 1]! + 1;
      } else {
        lcs[i]![j] = Math.max(lcs[i - 1]![j]!, lcs[i]![j - 1]!);
      }
    }
  }

  const matchedA = new Array(n).fill(false);
  const matchedB = new Array(m).fill(false);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (wordsA[i - 1] === wordsB[j - 1]) {
      matchedA[i - 1] = true;
      matchedB[j - 1] = true;
      i--;
      j--;
    } else if (lcs[i - 1]![j]! >= lcs[i]![j - 1]!) {
      i--;
    } else {
      j--;
    }
  }

  return {
    a: wordsA.map((word, idx) => ({ word, differs: !matchedA[idx] })),
    b: wordsB.map((word, idx) => ({ word, differs: !matchedB[idx] })),
  };
}

/** Human-readable list of differing words, for a short "Differences:" summary. */
export function summarizeDifferences(a: string, b: string, max = 6): string[] {
  const { a: diffA, b: diffB } = diffWords(a, b);
  const differing = [
    ...diffA.filter((w) => w.differs).map((w) => w.word),
    ...diffB.filter((w) => w.differs).map((w) => w.word),
  ];
  return Array.from(new Set(differing)).slice(0, max);
}
