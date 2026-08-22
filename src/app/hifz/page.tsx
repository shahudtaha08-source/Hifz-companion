import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import {
  getJuzProgress,
  getOverallProgress,
  getSurahProgress,
  getWeakAyahs,
} from "@/services/hifzProgressService";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default async function HifzPage() {
  const userId = await getCurrentUserId();
  const [overall, juzProgress, surahProgress, weakAyahs] = await Promise.all([
    getOverallProgress(userId),
    getJuzProgress(userId),
    getSurahProgress(userId),
    getWeakAyahs(userId, 20),
  ]);

  if (!overall.hasAnyProgress) {
    return (
      <div className="max-w-reader mx-auto px-4 py-16 text-center">
        <p className="text-lg text-brand-800 dark:text-brand-200">
          Your Hifz journey starts here.
        </p>
        <p className="text-sm text-ink-light/60 dark:text-ink-dark/60 mt-2">
          Mark ayahs as you learn and memorize them in the reader, and your progress will show
          up here.
        </p>
        <Link
          href="/reader"
          className="inline-block mt-6 rounded-md bg-brand-600 text-white px-4 py-2 text-sm hover:bg-brand-700"
        >
          Start Hifz
        </Link>
      </div>
    );
  }

  // Only show Surahs/Juz the user has actually touched, so this page stays
  // useful (not 114 mostly-empty rows) while remaining fully data-driven.
  const touchedSurahs = surahProgress.filter((s) => s.total - s.notStarted > 0);
  const touchedJuz = juzProgress.filter((j) => j.total - j.notStarted > 0);

  return (
    <div className="max-w-reader mx-auto px-4 py-10">
      <h1 className="text-lg font-medium text-brand-800 dark:text-brand-200 mb-1">My Hifz</h1>
      <p className="text-sm text-ink-light/60 dark:text-ink-dark/60 mb-6">
        Progress across the whole Quran, based on the status you've set for each ayah.
      </p>

      <section className="rounded-lg border border-brand-100 dark:border-brand-900 p-5">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-sm font-medium">Overall Progress</p>
          <p className="text-xl font-semibold text-brand-700 dark:text-brand-300">
            {overall.percentage}%
          </p>
        </div>
        <ProgressBar percentage={overall.percentage} />
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-5 text-xs">
          <Stat label="Memorized" value={overall.memorized} />
          <Stat label="Learning" value={overall.learning} />
          <Stat label="Needs Revision" value={overall.needsRevision} />
          <Stat label="Weak" value={overall.weak} />
          <Stat label="Re-memorizing" value={overall.reMemorizing} />
        </div>
      </section>

      {touchedJuz.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-wide text-ink-light/50 dark:text-ink-dark/50 mb-3">
            By Juz
          </h2>
          <div className="space-y-3">
            {touchedJuz.map((j) => (
              <div key={j.juz}>
                <div className="flex items-baseline justify-between text-sm mb-1">
                  <span>Juz {j.juz}</span>
                  <span className="text-ink-light/50 dark:text-ink-dark/50">{j.percentage}%</span>
                </div>
                <ProgressBar percentage={j.percentage} />
              </div>
            ))}
          </div>
        </section>
      )}

      {touchedSurahs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-wide text-ink-light/50 dark:text-ink-dark/50 mb-3">
            By Surah
          </h2>
          <div className="space-y-3">
            {touchedSurahs.map((s) => (
              <Link
                key={s.surahId}
                href={`/reader/${s.surahId}`}
                className="block rounded-md hover:bg-brand-50/60 dark:hover:bg-brand-950/60 -mx-2 px-2 py-1"
              >
                <div className="flex items-baseline justify-between text-sm mb-1">
                  <span>{s.nameTransliterated}</span>
                  <span className="text-ink-light/50 dark:text-ink-dark/50">{s.percentage}%</span>
                </div>
                <ProgressBar percentage={s.percentage} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-wide text-ink-light/50 dark:text-ink-dark/50 mb-3">
          Weak Ayahs
        </h2>
        {weakAyahs.length === 0 ? (
          <p className="text-sm text-ink-light/50 dark:text-ink-dark/50">
            No weak Ayahs recorded.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {weakAyahs.map((w) => (
              <li
                key={w.ayahId}
                className="flex items-center justify-between rounded-md border border-brand-100 dark:border-brand-900 px-3 py-2 text-sm"
              >
                <span>
                  {w.surahNameTransliterated} {w.surahId}:{w.numberInSurah}
                  <span className="ml-2 text-xs text-ink-light/50 dark:text-ink-dark/50">
                    {STATUS_LABEL[w.status] ?? w.status}
                  </span>
                </span>
                <Link
                  href={`/reader/${w.surahId}?ayah=${w.numberInSurah}`}
                  className="text-xs text-brand-600 dark:text-brand-300 underline"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  WEAK: "Weak",
  NEEDS_REVISION: "Needs Revision",
  RE_MEMORIZING: "Re-memorizing",
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-base font-semibold text-ink-light dark:text-ink-dark">{value}</div>
      <div className="text-ink-light/50 dark:text-ink-dark/50">{label}</div>
    </div>
  );
}
