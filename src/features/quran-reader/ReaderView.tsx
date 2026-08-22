"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AyahWithSurah, HifzStatus } from "@/types/quran";
import { AyahToolsPanel, type AyahTranslations } from "@/components/quran/AyahToolsPanel";
import { AyahToolsDrawer } from "@/components/quran/AyahToolsDrawer";
import { AyahToolsFloatingButton } from "@/components/quran/AyahToolsFloatingButton";
import { ReciterSelector } from "@/components/quran/ReciterSelector";
import { useAudioPlayer } from "@/features/audio-player/AudioPlayerProvider";

const STATUS_DOT_CLASS: Record<HifzStatus | "NOT_STARTED", string> = {
  NOT_STARTED: "bg-transparent",
  LEARNING: "bg-gold-500",
  MEMORIZED: "bg-brand-500",
  NEEDS_REVISION: "bg-orange-400",
  WEAK: "bg-red-400",
  RE_MEMORIZING: "bg-purple-400",
  FORGOTTEN: "bg-ink-light/30 dark:bg-ink-dark/30",
};

export function ReaderView({
  ayahs,
  statusByAyahId,
  translationsByAyahId,
  initialSelectedAyahId = null,
}: {
  ayahs: AyahWithSurah[];
  statusByAyahId: Record<string, HifzStatus>;
  translationsByAyahId: Record<string, AyahTranslations>;
  initialSelectedAyahId?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedAyahId);
  const [readingMode, setReadingMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(!!initialSelectedAyahId);
  const [statuses, setStatuses] = useState<Record<string, HifzStatus | "NOT_STARTED">>(
    statusByAyahId
  );
  const surah = ayahs[0]?.surah;

  const { currentAyahRef, status: playStatus } = useAudioPlayer();
  const isAudioActive = playStatus === "playing" || playStatus === "loading";

  // The ayah currently playing, IF it belongs to this Surah's currently
  // rendered list (audio can keep playing across a Surah navigation, since
  // the provider lives above the reader route — this guards against
  // highlighting/scrolling to an ayah that isn't even on this page).
  const playingAyah =
    currentAyahRef && surah && currentAyahRef.surahId === surah.id
      ? ayahs.find((a) => a.numberInSurah === currentAyahRef.numberInSurah) ?? null
      : null;

  // While audio is actively playing/loading, the tools panel (Meaning +
  // Hifz status target) follows the playing ayah, per the sync requirement.
  // Otherwise it follows the user's manual selection — never fighting a
  // user who is reading/practicing without audio.
  const focusId = isAudioActive && playingAyah ? playingAyah.id : selectedId;
  const focused = ayahs.find((a) => a.id === focusId) ?? null;

  const ayahElementsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Gentle auto-scroll: only nudge the view when the newly-playing ayah is
  // close to leaving the viewport, using smooth scrolling, and only at the
  // moment playback moves to a new ayah (not continuously) — so it never
  // fights a user who is manually scrolling to read ahead or back.
  useEffect(() => {
    if (!isAudioActive || !playingAyah) return;
    const el = ayahElementsRef.current.get(playingAyah.id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const buffer = 96;
    const mostlyVisible = rect.top >= buffer && rect.bottom <= window.innerHeight - buffer;
    if (!mostlyVisible) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Intentionally keyed on the playing ayah's id, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingAyah?.id, isAudioActive]);

  function handleStatusChange(ayahId: string, status: HifzStatus | "NOT_STARTED") {
    setStatuses((prev) => ({ ...prev, [ayahId]: status }));
  }

  function selectAyah(id: string) {
    if (id === selectedId) {
      setSelectedId(null);
      setDrawerOpen(false);
      return;
    }
    setSelectedId(id);
    setDrawerOpen(true);
  }

  const panel = focused && (
    <AyahToolsPanel
      key={focused.id}
      ayah={focused}
      status={statuses[focused.id] ?? "NOT_STARTED"}
      onStatusChange={handleStatusChange}
      surahAyahs={ayahs}
      translations={translationsByAyahId[focused.id] ?? { en: null, ur: null }}
      onClose={() => setDrawerOpen(false)}
    />
  );

  return (
    <div className={readingMode ? "quran-reading-mode" : undefined}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 max-w-reader lg:max-w-none mx-auto lg:mx-0">
          <div>
            <Link
              href="/reader"
              className="text-xs text-ink-light/50 dark:text-ink-dark/50 hover:text-brand-600"
            >
              ← All Surahs
            </Link>
            <h1 className="text-lg font-medium mt-1">
              {surah?.nameTransliterated}
              <span className="ayah-text ms-3 text-xl text-ink-light/80 dark:text-ink-dark/80">
                {surah?.nameArabic}
              </span>
            </h1>
            <p className="text-xs text-ink-light/50 dark:text-ink-dark/50 mt-0.5 capitalize">
              {surah?.revelationType} · {surah?.totalAyahs} ayahs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ReciterSelector />
            <button
              onClick={() => setReadingMode((r) => !r)}
              className="text-xs rounded-full border border-brand-200 dark:border-brand-800 px-3 py-1 hover:border-brand-400 shrink-0"
            >
              {readingMode ? "Exit Reading Mode" : "Reading Mode"}
            </button>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">
          <div className="max-w-reader mx-auto lg:mx-0 space-y-1 pb-24 lg:pb-0">
            {ayahs.map((ayah) => {
              const status = statuses[ayah.id] ?? "NOT_STARTED";
              const isSelected = ayah.id === selectedId;
              const isPlaying = isAudioActive && playingAyah?.id === ayah.id;
              return (
                <button
                  key={ayah.id}
                  ref={(el) => {
                    if (el) ayahElementsRef.current.set(ayah.id, el);
                    else ayahElementsRef.current.delete(ayah.id);
                  }}
                  onClick={() => selectAyah(ayah.id)}
                  className={[
                    "flex items-start gap-2 w-full text-right rounded-md px-3 py-3 transition-colors",
                    isSelected
                      ? "bg-brand-50 dark:bg-brand-950 ring-1 ring-brand-300 dark:ring-brand-800"
                      : "hover:bg-brand-50/60 dark:hover:bg-brand-950/60",
                    isPlaying ? "border-l-4 border-gold-500 bg-gold-400/5" : "border-l-4 border-transparent",
                  ].join(" ")}
                >
                  {!readingMode && (
                    <span
                      aria-hidden
                      title={status === "NOT_STARTED" ? undefined : status}
                      className={`mt-3 w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT_CLASS[status]}`}
                    />
                  )}
                  <span className="ayah-text text-2xl leading-loose flex-1">
                    {ayah.textUthmani}
                    <span className="ayah-text mx-1.5 text-brand-500 text-lg align-middle select-none">
                      ﴿{ayah.numberInSurah}﴾
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop: sticky side panel, never covers the reading column */}
          <aside className="hidden lg:block sticky top-6 max-h-[calc(100vh-3rem)] rounded-xl border border-brand-100 dark:border-brand-900 bg-paper-light dark:bg-paper-dark overflow-hidden">
            {focused ? (
              panel
            ) : (
              <div className="p-5 text-sm text-ink-light/50 dark:text-ink-dark/50">
                Select an Ayah to see its Hifz status, audio, and translations here.
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Mobile: floating trigger + bottom-sheet drawer, never expands under the Quran text */}
      {selectedId && !drawerOpen && (
        <AyahToolsFloatingButton onClick={() => setDrawerOpen(true)} label="Ayah Tools" />
      )}
      <AyahToolsDrawer open={drawerOpen && !!focused} onClose={() => setDrawerOpen(false)}>
        {panel}
      </AyahToolsDrawer>
    </div>
  );
}
