import type { MatchCategory } from "@/types/quran";

const LABELS: Record<MatchCategory, string> = {
  EXACT_FULL_AYAH: "Exact Full Ayah",
  EXACT_PHRASE: "Exact Phrase",
  NEAR_EXACT_PHRASE: "Near-Exact Phrase",
  SIMILAR_BEGINNING: "Similar Beginning",
  SIMILAR_ENDING: "Similar Ending",
  SIMILAR_MIDDLE_PHRASE: "Similar Middle Phrase",
  SIMILAR_STRUCTURE: "Similar Structure",
  CONTEXTUAL: "Contextual Mutashabihat",
};

const STYLES: Record<MatchCategory, string> = {
  EXACT_FULL_AYAH: "bg-gold-500/15 text-gold-600 dark:text-gold-400",
  EXACT_PHRASE: "bg-gold-500/10 text-gold-600 dark:text-gold-400",
  NEAR_EXACT_PHRASE: "bg-gold-500/10 text-gold-600 dark:text-gold-400",
  SIMILAR_BEGINNING: "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300",
  SIMILAR_ENDING: "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300",
  SIMILAR_MIDDLE_PHRASE: "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300",
  SIMILAR_STRUCTURE: "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300",
  CONTEXTUAL: "bg-ink-light/10 text-ink-light/70 dark:bg-ink-dark/10 dark:text-ink-dark/70",
};

export function MatchCategoryBadge({ category }: { category: MatchCategory }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full ${STYLES[category]}`}>
      {LABELS[category]}
    </span>
  );
}
