import Link from "next/link";
import { getDailyAyah } from "@/services/dailyAyahService";
import { getTranslations } from "@/services/translationService";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  try {
    const ayah = await getDailyAyah();
    if (!ayah) return <EmptyDailyAyah />;
    const [en, ur] = await Promise.all([
      getTranslations([ayah.id], "en"),
      getTranslations([ayah.id], "ur"),
    ]);

    return (
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <p className="text-xs uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Daily reflection</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold">Ayah of the Day</h1>
        <p className="mt-2 text-sm text-ink-light/60 dark:text-ink-dark/60">A deterministic daily rotation through all 6,236 ayahs — not the same fixed quote every day.</p>

        <article className="mt-6 rounded-2xl border border-brand-100 dark:border-brand-900 p-5 sm:p-8 shadow-sm">
          <p className="ayah-text text-3xl sm:text-4xl leading-[2.2] text-right">{ayah.textUthmani}</p>
          <p className="mt-4 text-sm font-medium text-brand-700 dark:text-brand-300">{ayah.surah.nameTransliterated} {ayah.surah.id}:{ayah.numberInSurah}</p>
          {en[ayah.id] && <div className="mt-6 border-t border-brand-100 dark:border-brand-900 pt-5"><p className="text-xs uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2">English</p><p className="leading-relaxed text-ink-light/80 dark:text-ink-dark/80">{en[ayah.id]}</p><p className="mt-2 text-xs text-ink-light/40 dark:text-ink-dark/40">— Saheeh International</p></div>}
          {ur[ayah.id] && <div className="mt-6 border-t border-brand-100 dark:border-brand-900 pt-5"><p className="text-xs uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2">اردو</p><p dir="rtl" lang="ur" className="text-right leading-loose text-ink-light/80 dark:text-ink-dark/80">{ur[ayah.id]}</p><p className="mt-2 text-xs text-ink-light/40 dark:text-ink-dark/40">— Abul A'la Maududi</p></div>}
          <Link href={`/reader/${ayah.surah.id}?ayah=${ayah.numberInSurah}`} className="inline-flex mt-6 min-h-11 items-center rounded-lg bg-brand-600 px-4 text-sm text-white hover:bg-brand-700">Open in Reader →</Link>
        </article>
      </main>
    );
  } catch {
    return <EmptyDailyAyah />;
  }
}

function EmptyDailyAyah() {
  return <main className="max-w-3xl mx-auto px-4 py-12"><h1 className="text-2xl font-semibold">Ayah of the Day</h1><p className="mt-3 text-sm text-ink-light/60 dark:text-ink-dark/60">The Quran data is not available yet. Open this page after the Quran database has been imported.</p></main>;
}
