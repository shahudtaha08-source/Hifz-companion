"use client";

import { useState } from "react";
import Link from "next/link";
import type { AyahWithSurah, HifzStatus } from "@/types/quran";
import { AyahStatusControls } from "@/components/quran/AyahStatusControls";
import { TranslationText } from "@/components/quran/TranslationText";
import { ReciterSelector } from "@/components/quran/ReciterSelector";
import { RepeatPresetPicker } from "@/components/quran/RepeatPresetPicker";
import { useAudioPlayer } from "@/features/audio-player/AudioPlayerProvider";

export interface AyahTranslations { en: string | null; ur: string | null; }

export function AyahToolsPanel({ ayah, status, onStatusChange, surahAyahs, translations, onClose }: {
  ayah: AyahWithSurah; status: HifzStatus | "NOT_STARTED";
  onStatusChange: (ayahId: string, status: HifzStatus | "NOT_STARTED") => void;
  surahAyahs: AyahWithSurah[]; translations: AyahTranslations; onClose?: () => void;
}) {
  const { reciterId, translationReciterId, reciters, play, pause, resume, stop, repeatCurrent, playAyahRepeated, playFromRepeated, playSurahRepeated, playArabicThenUrdu, isCurrent, status: playStatus, errorMessage, repeatProgress, currentSegmentKind } = useAudioPlayer();
  const [repeatCount, setRepeatCount] = useState(1);
  const selectedReciter = reciters.find((r) => r.id === reciterId);
  const selectedTranslationReciter = reciters.find((r) => r.id === translationReciterId);
  const reciterUnavailable = selectedReciter?.provider === "unavailable";
  const current = isCurrent(ayah.surah.id, ayah.numberInSurah);
  const currentPlayStatus = current ? playStatus : "idle";
  const ayahIndex = surahAyahs.findIndex((a) => a.id === ayah.id);
  const toRef = (a: AyahWithSurah) => ({ surahId: a.surah.id, numberInSurah: a.numberInSurah });
  const playAyah = () => repeatCount > 1 ? playAyahRepeated(toRef(ayah), repeatCount) : play(ayah.surah.id, ayah.numberInSurah);

  return <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-brand-100 dark:border-brand-900">
      <div><p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40">Ayah Tools</p><p className="text-sm font-medium text-brand-800 dark:text-brand-200">{ayah.surah.nameTransliterated} {ayah.surah.id}:{ayah.numberInSurah}</p></div>
      {onClose && <button onClick={onClose} aria-label="Close Ayah Tools" className="text-ink-light/40 dark:text-ink-dark/40 text-lg leading-none px-1">✕</button>}
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
      <section><p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2">Reciter</p><ReciterSelector />
        {selectedReciter && <p className="text-[11px] text-ink-light/40 dark:text-ink-dark/40 mt-1.5">{reciterUnavailable ? <>Audio for {selectedReciter.displayName} isn't available yet — choose another reciter.</> : <>{selectedReciter.bitrate ?? "Standard"} quality</>}</p>}
      </section>
      <section><p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2">Lesson</p>
        <p className="text-[11px] text-ink-light/50 dark:text-ink-dark/50 mb-1.5">Repeat count</p><RepeatPresetPicker value={repeatCount} onChange={setRepeatCount} />
        <div className="mt-3 space-y-1.5">
          {!reciterUnavailable && <><div className="flex flex-wrap gap-1.5">
            {currentPlayStatus === "playing" || currentPlayStatus === "loading" ? <ToolButton onClick={pause} disabled={currentPlayStatus === "loading"}>{currentPlayStatus === "loading" ? "Loading…" : "⏸ Pause"}</ToolButton> : currentPlayStatus === "paused" ? <ToolButton onClick={resume}>▶ Resume</ToolButton> : <ToolButton onClick={playAyah}>{repeatCount > 1 ? `▶ Play Ayah ×${repeatCount}` : "▶ Play Ayah"}</ToolButton>}
            {current && currentPlayStatus !== "idle" && <ToolButton onClick={stop} muted>⏹ Stop</ToolButton>}<ToolButton onClick={repeatCurrent} disabled={!current}>↻ Restart</ToolButton>
          </div><div className="flex flex-wrap gap-1.5"><ToolButton onClick={() => ayahIndex >= 0 && playFromRepeated(surahAyahs.map(toRef), ayahIndex, repeatCount)} disabled={ayahIndex < 0}>▶ From here{repeatCount > 1 ? ` ×${repeatCount}` : ""}</ToolButton><ToolButton onClick={() => ayahIndex >= 0 && playSurahRepeated(surahAyahs.map(toRef), repeatCount)} disabled={ayahIndex < 0}>▶ Full Surah{repeatCount > 1 ? ` ×${repeatCount}` : ""}</ToolButton></div></>}
        </div>
        {current && repeatProgress && <p className="text-[11px] text-brand-600 dark:text-brand-300 mt-2">{repeatProgress.mode === "single" ? `Playing ${repeatProgress.current} / ${repeatProgress.total}` : `Round ${repeatProgress.current} / ${repeatProgress.total}`}</p>}
        {current && currentPlayStatus === "error" && errorMessage && <p className="text-[11px] text-red-600 dark:text-red-400 mt-1.5">{errorMessage}</p>}
      </section>
      <section className="border-t border-brand-50 dark:border-brand-950 pt-4"><p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2">Arabic + Urdu</p><ReciterSelector translation />
        <p className="text-[11px] text-ink-light/45 dark:text-ink-dark/45 mt-2">Each ayah is played in Arabic, then the same ayah is played by the selected Urdu translation voice.</p>
        {selectedTranslationReciter?.provider === "unavailable" ? <p className="text-[11px] text-red-500 mt-2">The selected Urdu translation voice is unavailable.</p> : <ToolButton onClick={() => ayahIndex >= 0 && playArabicThenUrdu(surahAyahs.map(toRef), ayahIndex, repeatCount)} disabled={ayahIndex < 0}>▶ Arabic → Urdu{repeatCount > 1 ? ` ×${repeatCount}` : ""}</ToolButton>}
        {current && currentSegmentKind && <p className="text-[11px] text-brand-600 dark:text-brand-300 mt-2">Now playing: {currentSegmentKind === "arabic" ? "Arabic recitation" : "Urdu translation"}</p>}
      </section>
      <section><p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2">Actions</p><div className="grid grid-cols-2 gap-2 text-xs"><ActionLink label="Mutashabihat" icon="🔍" href={`/mutashabihat?ayahId=${ayah.id}`} /><ActionLink label="Memorize" icon="🧠" href="/under-development" note="Under development" /><ActionLink label="Revision" icon="🔄" href="/under-development" note="Under development" /><ActionLink label="Notes" icon="📝" href="/under-development" note="Under development" /></div></section>
      <section><p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2">Hifz Status</p><AyahStatusControls ayahId={ayah.id} initialStatus={status} onStatusChange={onStatusChange} /></section>
      <section className="pt-1 border-t border-brand-50 dark:border-brand-950"><p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2 mt-3">Meaning</p><p className="ayah-text text-base text-ink-light/70 dark:text-ink-dark/70 mb-2 leading-relaxed">{ayah.textUthmani}</p>{translations.en || translations.ur ? <div className="space-y-2.5">{translations.en && <TranslationText text={translations.en} />}{translations.ur && <p dir="rtl" lang="ur" className="text-sm leading-relaxed text-ink-light/75 dark:text-ink-dark/75 break-words">{translations.ur}<span dir="ltr" className="block text-[10px] text-ink-light/40 dark:text-ink-dark/40 mt-0.5">— Abul A'la Maududi (Urdu)</span></p>}</div> : <p className="text-xs text-ink-light/40 dark:text-ink-dark/40">No translation available.</p>}</section>
    </div>
  </div>;
}
function ToolButton({ children, onClick, disabled, muted }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; muted?: boolean; }) { return <button onClick={onClick} disabled={disabled} className={`text-xs rounded-full border px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${muted ? "border-dashed border-ink-light/20 dark:border-ink-dark/20 text-ink-light/50 dark:text-ink-dark/50" : "border-brand-300 dark:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950"}`}>{children}</button>; }
function ActionLink({ label, icon, href, note }: { label: string; icon: string; href: string; note?: string; }) { return <Link href={href} className="flex items-center gap-1.5 rounded-lg border border-brand-200 dark:border-brand-800 px-2.5 py-2 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950"><span>{icon}</span><span>{label}</span>{note && <span className="text-[9px] text-ink-light/40 dark:text-ink-dark/40 ml-auto">{note}</span>}</Link>; }
