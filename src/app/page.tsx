import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getOverallProgress, getWeakAyahs } from "@/services/hifzProgressService";
import { ProgressBar } from "@/components/ui/ProgressBar";

async function getQuickStats() {
  try {
    const [surahCount, ayahCount, matchCount] = await Promise.all([
      db.surah.count(),
      db.ayah.count(),
      db.mutashabihatMatch.count(),
    ]);
    return { surahCount, ayahCount, matchCount, seeded: ayahCount > 0 };
  } catch {
    return { surahCount: 0, ayahCount: 0, matchCount: 0, seeded: false };
  }
}

export default async function DashboardPage() {
  const stats = await getQuickStats();

  let overall = null;
  let weakAyahs: Awaited<ReturnType<typeof getWeakAyahs>> = [];
  let hifzLoadError = false;

  if (stats.seeded) {
    try {
      const userId = await getCurrentUserId();
      [overall, weakAyahs] = await Promise.all([
        getOverallProgress(userId),
        getWeakAyahs(userId, 5),
      ]);
    } catch (err) {
      console.error("Failed to load Hifz progress for dashboard:", err);
      hifzLoadError = true;
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-brand-800 dark:text-brand-200">
        Assalamu Alaikum
      </h1>
      <p className="text-ink-light/70 dark:text-ink-dark/70 mt-1">
        Your Hifz companion — continue memorizing, revise what you've learned, and untangle
        Mutashabihat before they trip you up in salah.
      </p>

      {!stats.seeded ? (
        <div className="mt-8 rounded-lg border border-gold-500/40 bg-gold-400/10 p-5 text-sm">
          <p className="font-medium text-ink-light dark:text-ink-dark">
            Quran data hasn't been imported yet.
          </p>
          <p className="mt-1 text-ink-light/70 dark:text-ink-dark/70">
            Run <code className="px-1 rounded bg-black/5 dark:bg-white/10">npm run setup</code>{" "}
            (or <code className="px-1 rounded bg-black/5 dark:bg-white/10">npm run import:quran</code>{" "}
            then{" "}
            <code className="px-1 rounded bg-black/5 dark:bg-white/10">
              npm run build:mutashabihat-index
            </code>
            ) after installing dependencies to load the Quran text and build the Mutashabihat
            index.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <StatBlock label="Surahs loaded" value={stats.surahCount} />
          <StatBlock label="Ayahs loaded" value={stats.ayahCount} />
          <StatBlock label="Mutashabihat links" value={stats.matchCount} />
        </div>
      )}

      {stats.seeded && (
        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink-light/50 dark:text-ink-dark/50">
            Hifz Progress
          </h2>

          {hifzLoadError ? (
            <div className="mt-3 rounded-lg border border-red-300 dark:border-red-900 p-5 text-sm text-red-700 dark:text-red-400">
              Unable to load your Hifz progress. Please try again.
            </div>
          ) : !overall?.hasAnyProgress ? (
            <div className="mt-3 rounded-lg border border-brand-100 dark:border-brand-900 p-5 text-sm">
              <p className="text-ink-light dark:text-ink-dark">Your Hifz journey starts here.</p>
              <Link
                href="/reader"
                className="inline-block mt-3 rounded-md bg-brand-600 text-white px-4 py-2 text-xs hover:bg-brand-700"
              >
                Start Hifz
              </Link>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-brand-100 dark:border-brand-900 p-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm">Overall</span>
                <span className="text-lg font-semibold text-brand-700 dark:text-brand-300">
                  {overall.percentage}%
                </span>
              </div>
              <ProgressBar percentage={overall.percentage} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                <Stat label="Memorized" value={overall.memorized} />
                <Stat label="Learning" value={overall.learning} />
                <Stat label="Weak" value={overall.weak} />
                <Stat label="Needs Revision" value={overall.needsRevision} />
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  href="/hifz/continue"
                  className="rounded-md bg-brand-600 text-white px-3 py-1.5 text-xs hover:bg-brand-700"
                >
                  Continue Hifz
                </Link>
                <Link
                  href="/hifz"
                  className="rounded-md border border-brand-300 dark:border-brand-700 px-3 py-1.5 text-xs hover:bg-brand-50 dark:hover:bg-brand-950"
                >
                  View My Hifz
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {stats.seeded && !hifzLoadError && weakAyahs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink-light/50 dark:text-ink-dark/50">
            Weak Ayahs
          </h2>
          <ul className="mt-3 space-y-1.5">
            {weakAyahs.map((w) => (
              <li
                key={w.ayahId}
                className="flex items-center justify-between rounded-md border border-brand-100 dark:border-brand-900 px-3 py-2 text-sm"
              >
                <span>
                  {w.surahNameTransliterated} {w.surahId}:{w.numberInSurah}
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
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-light/50 dark:text-ink-dark/50">
          Quick Actions
        </h2>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <QuickAction href="/hifz/continue" icon="📖" label="Continue Hifz" />
          <QuickAction href="/reader" icon="🔄" label="Start Revision" disabled note="Phase 3" />
          <QuickAction href="/mutashabihat" icon="🔍" label="Find Mutashabihat" />
          <QuickAction href="/reader" icon="🎙" label="Recitation Practice" disabled note="Phase 7" />
        </div>
      </section>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-brand-100 dark:border-brand-900 p-4">
      <div className="text-xl font-semibold text-brand-700 dark:text-brand-300">{value}</div>
      <div className="text-ink-light/60 dark:text-ink-dark/60">{label}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-sm font-semibold text-ink-light dark:text-ink-dark">{value}</div>
      <div className="text-ink-light/50 dark:text-ink-dark/50">{label}</div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  disabled,
  note,
}: {
  href: string;
  icon: string;
  label: string;
  disabled?: boolean;
  note?: string;
}) {
  if (disabled) {
    return (
      <div className="rounded-lg border border-dashed border-brand-200 dark:border-brand-800 p-4 flex items-center justify-between text-sm text-ink-light/40 dark:text-ink-dark/40 cursor-not-allowed">
        <span>
          {icon} {label}
        </span>
        {note && <span className="text-xs">{note}</span>}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border border-brand-200 dark:border-brand-800 p-4 flex items-center gap-2 text-sm hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
