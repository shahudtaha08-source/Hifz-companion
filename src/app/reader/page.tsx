import Link from "next/link";
import { listSurahs } from "@/services/quranService";

export default async function ReaderIndexPage() {
  const surahs = await listSurahs();

  if (surahs.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-sm text-ink-light/60 dark:text-ink-dark/60">
        No Quran data found yet. Run <code>npm run setup</code> to import it, then refresh this
        page.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold text-brand-800 dark:text-brand-200 mb-1">Read</h1>
      <p className="text-sm text-ink-light/60 dark:text-ink-dark/60 mb-6">
        Choose a Surah to begin. Juz, Hizb, and Page navigation are available once you're inside
        the reader.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {surahs.map((s) => (
          <Link
            key={s.id}
            href={`/reader/${s.id}`}
            className="flex items-center justify-between rounded-lg border border-brand-100 dark:border-brand-900 px-4 py-3 hover:border-brand-400 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="text-xs w-6 text-ink-light/40 dark:text-ink-dark/40">{s.id}</span>
              <span className="text-sm">{s.nameTransliterated}</span>
            </span>
            <span className="ayah-text text-lg text-ink-light/80 dark:text-ink-dark/80">
              {s.nameArabic}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
