import Link from "next/link";
import { searchAyahs } from "@/services/quranService";
import { normalizeForSearch } from "@/utils/arabicNormalize";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? "";
  const results = q ? await searchAyahs(normalizeForSearch(q)) : [];

  return (
    <div className="max-w-reader mx-auto px-4 py-10">
      <h1 className="text-lg font-medium text-brand-800 dark:text-brand-200 mb-4">Search</h1>
      <form className="flex gap-2" action="/search">
        <input
          name="q"
          defaultValue={q}
          dir="rtl"
          placeholder="ابحث بالنص العربي..."
          className="ayah-text flex-1 rounded-md border border-brand-200 dark:border-brand-800 bg-transparent px-3 py-2 text-lg outline-none focus:border-brand-500"
        />
        <button className="rounded-md bg-brand-600 text-white px-4 py-2 text-sm hover:bg-brand-700">
          Search
        </button>
      </form>

      {q && (
        <p className="text-xs text-ink-light/50 dark:text-ink-dark/50 mt-3">
          {results.length} result{results.length === 1 ? "" : "s"}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {results.map((ayah) => (
          <li key={ayah.id} className="rounded-lg border border-brand-100 dark:border-brand-900 p-4">
            <p className="text-xs text-ink-light/50 dark:text-ink-dark/50 mb-1">
              {ayah.surah.nameTransliterated} {ayah.surah.id}:{ayah.numberInSurah} · Juz {ayah.juz}
            </p>
            <p className="ayah-text text-xl leading-loose">{ayah.textUthmani}</p>
            <div className="flex gap-3 mt-2">
              <Link
                href={`/reader/${ayah.surah.id}`}
                className="text-xs text-brand-600 dark:text-brand-300 underline"
              >
                Open in Reader
              </Link>
              <Link
                href={`/mutashabihat?ayahId=${ayah.id}`}
                className="text-xs text-brand-600 dark:text-brand-300 underline"
              >
                Find Mutashabihat
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
