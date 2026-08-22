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
  NOT_STARTED: "bg-transparent", LEARNING: "bg-gold-500", MEMORIZED: "bg-brand-500", NEEDS_REVISION: "bg-orange-400", WEAK: "bg-red-400", RE_MEMORIZING: "bg-purple-400", FORGOTTEN: "bg-ink-light/30 dark:bg-ink-dark/30",
};

export function ReaderView({ ayahs, statusByAyahId, translationsByAyahId, initialSelectedAyahId = null }: {
  ayahs: AyahWithSurah[]; statusByAyahId: Record<string, HifzStatus>; translationsByAyahId: Record<string, AyahTranslations>; initialSelectedAyahId?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedAyahId);
  const [readingMode, setReadingMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(!!initialSelectedAyahId);
  const [statuses, setStatuses] = useState<Record<string, HifzStatus | "NOT_STARTED">>(statusByAyahId);
  const surah = ayahs[0]?.surah;
  const { currentAyahRef, status: playStatus } = useAudioPlayer();
  const isAudioActive = playStatus === "playing" || playStatus === "loading";
  const playingAyah = currentAyahRef && surah && currentAyahRef.surahId === surah.id ? ayahs.find((a) => a.numberInSurah === currentAyahRef.numberInSurah) ?? null : null;
  const focusId = isAudioActive && playingAyah ? playingAyah.id : selectedId;
  const focused = ayahs.find((a) => a.id === focusId) ?? null;
  const ayahElementsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    if (!isAudioActive || !playingAyah) return;
    const el = ayahElementsRef.current.get(playingAyah.id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const buffer = 96;
    if (!(rect.top >= buffer && rect.bottom <= window.innerHeight - buffer)) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [playingAyah?.id, isAudioActive]);

  function handleStatusChange(ayahId: string, status: HifzStatus | "NOT_STARTED") { setStatuses((prev) => ({ ...prev, [ayahId]: status })); }
  function selectAyah(id: string) {
    if (id === selectedId) { setSelectedId(null); setDrawerOpen(false); return; }
    setSelectedId(id); setDrawerOpen(true);
  }

  const panel = focused && <AyahToolsPanel key={focused.id} ayah={focused} status={statuses[focused.id] ?? "NOT_STARTED"} onStatusChange={handleStatusChange} surahAyahs={ayahs} translations={translationsByAyahId[focused.id] ?? { en: null, ur: null }} onClose={() => setDrawerOpen(false)} />;

  return (
    <div className={readingMode ? "quran-reading-mode" : undefined}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="mb-5 sm:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link href="/reader" className="text-xs text-ink-light/50 dark:text-ink-dark/50 hover:text-brand-600">← All Surahs</Link>
            <h1 className="text-lg sm:text-xl font-medium mt-1 break-words">{surah?.nameTransliterated}<span className="ayah-text ms-2 sm:ms-3 text-xl sm:text-2xl text-ink-light/80 dark:text-ink-dark/80">{surah?.nameArabic}</span></h1>
            <p className="text-xs text-ink-light/50 dark:text-ink-dark/50 mt-0.5 capitalize">{surah?.revelationType} · {surah?.totalAyahs} ayahs</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div className="min-w-0 flex-1 sm:flex-none"><ReciterSelector /></div>
            <button onClick={() => setReadingMode((r) => !r)} className="min-h-10 text-xs rounded-full border border-brand-200 dark:border-brand-800 px-3 hover:border-brand-400 shrink-0">{readingMode ? "Exit Reading Mode" : "Reading Mode"}</button>
          </div>
        </div>

        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-8 xl:items-start">
          <div className="max-w-reader mx-auto xl:mx-0 space-y-1 pb-24 xl:pb-0">
            {ayahs.map((ayah) => {
              const status = statuses[ayah.id] ?? "NOT_STARTED";
              const isSelected = ayah.id === selectedId;
              const isPlaying = isAudioActive && playingAyah?.id === ayah.id;
              return <button key={ayah.id} ref={(el) => { if (el) ayahElementsRef.current.set(ayah.id, el); else ayahElementsRef.current.delete(ayah.id); }} onClick={() => selectAyah(ayah.id)} className={["flex items-start gap-2 w-full text-right rounded-xl px-2.5 sm:px-3 py-3 transition-colors", isSelected ? "bg-brand-50 dark:bg-brand-950 ring-1 ring-brand-300 dark:ring-brand-800" : "hover:bg-brand-50/60 dark:hover:bg-brand-950/60", isPlaying ? "border-l-4 border-gold-500 bg-gold-400/5" : "border-l-4 border-transparent"].join(" ")}>
                {!readingMode && <span aria-hidden title={status === "NOT_STARTED" ? undefined : status} className={`mt-3 w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT_CLASS[status]}`} />}
                <span className="ayah-text text-[1.65rem] sm:text-2xl leading-[2.9rem] sm:leading-loose flex-1">{ayah.textUthmani}<span className="ayah-text mx-1.5 text-brand-500 text-base sm:text-lg align-middle select-none">﴿{ayah.numberInSurah}﴾</span></span>
              </button>;
            })}
          </div>
          <aside className="hidden xl:block sticky top-20 max-h-[calc(100vh-6rem)] rounded-2xl border border-brand-100 dark:border-brand-900 bg-paper-light dark:bg-paper-dark overflow-hidden shadow-sm">
            {focused ? panel : <div className="p-5 text-sm text-ink-light/50 dark:text-ink-dark/50">Select an Ayah to see its Hifz status, audio, and translations here.</div>}
          </aside>
        </div>
      </div>
      {selectedId && !drawerOpen && <AyahToolsFloatingButton onClick={() => setDrawerOpen(true)} label="Ayah Tools" />}
      <AyahToolsDrawer open={drawerOpen && !!focused} onClose={() => setDrawerOpen(false)}>{panel}</AyahToolsDrawer>
    </div>
  );
}
