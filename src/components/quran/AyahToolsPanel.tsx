"use client";

import { useState } from "react";
import Link from "next/link";
import type { AyahWithSurah, HifzStatus } from "@/types/quran";
import { AyahStatusControls } from "@/components/quran/AyahStatusControls";
import { TranslationText } from "@/components/quran/TranslationText";
import { ReciterSelector } from "@/components/quran/ReciterSelector";
import { RepeatPresetPicker } from "@/components/quran/RepeatPresetPicker";
import { useAudioPlayer } from "@/features/audio-player/AudioPlayerProvider";

export interface AyahTranslations {
  en: string | null;
  ur: string | null;
}

export function AyahToolsPanel({
  ayah,
  status,
  onStatusChange,
  surahAyahs,
  translations,
  onClose,
}: {
  ayah: AyahWithSurah;
  status: HifzStatus | "NOT_STARTED";
  onStatusChange: (ayahId: string, status: HifzStatus | "NOT_STARTED") => void;
  /** Full ayah list of the current Surah, for "play from here" / "play Surah". */
  surahAyahs: AyahWithSurah[];
  translations: AyahTranslations;
  /** Only used by the mobile drawer; omitted for the desktop sidebar. */
  onClose?: () => void;
}) {
  const {
    reciterId,
    reciters,
    play,
    pause,
    resume,
    stop,
    repeatCurrent,
    playAyahRepeated,
    playFromRepeated,
    playSurahRepeated,
    isCurrent,
    status: playStatus,
    errorMessage,
    repeatProgress,
  } = useAudioPlayer();

  const [repeatCount, setRepeatCount] = useState(1);

  const selectedReciter = reciters.find((r) => r.id === reciterId);
  const reciterUnavailable = selectedReciter?.provider === "unavailable";

  const current = isCurrent(ayah.surah.id, ayah.numberInSurah);
  const currentPlayStatus = current ? playStatus : "idle";
  const ayahIndex = surahAyahs.findIndex((a) => a.id === ayah.id);

  const toRef = (a: AyahWithSurah) => ({ surahId: a.surah.id, numberInSurah: a.numberInSurah });

  function playAyah() {
    if (repeatCount > 1) playAyahRepeated(toRef(ayah), repeatCount);
    else play(ayah.surah.id, ayah.numberInSurah);
  }
  function playFromHere() {
    if (ayahIndex < 0) return;
    playFromRepeated(surahAyahs.map(toRef), ayahIndex, repeatCount);
  }
  function playFullSurah() {
    if (ayahIndex < 0) return;
    playSurahRepeated(surahAyahs.map(toRef), repeatCount);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-brand-100 dark:border-brand-900">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40">
            Ayah Tools
          </p>
          <p className="text-sm font-medium text-brand-800 dark:text-brand-200">
            {ayah.surah.nameTransliterated} {ayah.surah.id}:{ayah.numberInSurah}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close Ayah Tools"
            className="text-ink-light/40 dark:text-ink-dark/40 hover:text-ink-light dark:hover:text-ink-dark text-lg leading-none px-1"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* --- Reciter --- */}
        <section>
          <p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2">
            Reciter
          </p>
          <ReciterSelector />
          {selectedReciter && (
            <p className="text-[11px] text-ink-light/40 dark:text-ink-dark/40 mt-1.5">
              {reciterUnavailable ? (
                <>Verified audio for {selectedReciter.displayName} isn't available yet — choose another reciter to listen.</>
              ) : (
                <>{selectedReciter.bitrate ?? "Standard"} quality</>
              )}
            </p>
          )}
        </section>

        {/* --- Lesson (Hifz practice controller) --- */}
        <section>
          <p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2">
            Lesson
          </p>

          <p className="text-[11px] text-ink-light/50 dark:text-ink-dark/50 mb-1.5">Repeat count</p>
          <RepeatPresetPicker value={repeatCount} onChange={setRepeatCount} />

          {!reciterUnavailable && (
            <div className="mt-3 space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {currentPlayStatus === "playing" || currentPlayStatus === "loading" ? (
                  <ToolButton onClick={pause} disabled={currentPlayStatus === "loading"}>
                    {currentPlayStatus === "loading" ? "Loading…" : "⏸ Pause"}
                  </ToolButton>
                ) : currentPlayStatus === "paused" ? (
                  <ToolButton onClick={resume}>▶ Resume</ToolButton>
                ) : (
                  <ToolButton onClick={playAyah}>
                    {repeatCount > 1 ? `▶ Play Ayah ×${repeatCount}` : "▶ Play Ayah"}
                  </ToolButton>
                )}
                {current && currentPlayStatus !== "idle" && (
                  <ToolButton onClick={stop} muted>
                    ⏹ Stop
                  </ToolButton>
                )}
                <ToolButton onClick={repeatCurrent} disabled={!current}>
                  ↻ Restart
                </ToolButton>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <ToolButton onClick={playFromHere} disabled={ayahIndex < 0}>
                  ▶ From here{repeatCount > 1 ? ` ×${repeatCount}` : ""}
                </ToolButton>
                <ToolButton onClick={playFullSurah} disabled={ayahIndex < 0}>
                  ▶ Full Surah{repeatCount > 1 ? ` ×${repeatCount}` : ""}
                </ToolButton>
              </div>
            </div>
          )}

          {current && repeatProgress && (
            <p className="text-[11px] text-brand-600 dark:text-brand-300 mt-2">
              {repeatProgress.mode === "single"
                ? `Playing ${repeatProgress.current} / ${repeatProgress.total}`
                : `Round ${repeatProgress.current} / ${repeatProgress.total}`}
            </p>
          )}
          {current && currentPlayStatus === "error" && errorMessage && (
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-1.5">{errorMessage}</p>
          )}
        </section>

        {/* --- Actions --- */}
        <section>
          <p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2">
            Actions
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <ActionLink label="Mutashabihat" icon="🔍" href={`/mutashabihat?ayahId=${ayah.id}`} />
            <ActionLink label="Memorize" icon="🧠" disabled note="Phase 6" />
            <ActionLink label="Add to Revision" icon="🔄" disabled note="Phase 3" />
            <ActionLink label="Add Note" icon="📝" disabled note="Phase 3" />
          </div>
        </section>

        {/* --- Hifz Status --- */}
        <section>
          <p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2">
            Hifz Status
          </p>
          <AyahStatusControls ayahId={ayah.id} initialStatus={status} onStatusChange={onStatusChange} />
        </section>

        {/* --- Meaning --- */}
        <section className="pt-1 border-t border-brand-50 dark:border-brand-950">
          <p className="text-[11px] uppercase tracking-wide text-ink-light/40 dark:text-ink-dark/40 mb-2 mt-3">
            Meaning
          </p>
          <p className="ayah-text text-base text-ink-light/70 dark:text-ink-dark/70 mb-2 leading-relaxed">
            {ayah.textUthmani}
          </p>
          {translations.en || translations.ur ? (
            <div className="space-y-2.5">
              {translations.en && <TranslationText text={translations.en} />}
              {translations.ur && (
                <p dir="rtl" lang="ur" className="text-sm leading-relaxed text-ink-light/75 dark:text-ink-dark/75 break-words">
                  {translations.ur}
                  <span dir="ltr" className="block text-[10px] text-ink-light/40 dark:text-ink-dark/40 mt-0.5">
                    — Abul A'la Maududi (Urdu)
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-ink-light/40 dark:text-ink-dark/40">
              No translation available.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function ToolButton({
  children,
  onClick,
  disabled,
  muted,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs rounded-full border px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        muted
          ? "border-dashed border-ink-light/20 dark:border-ink-dark/20 text-ink-light/50 dark:text-ink-dark/50 hover:border-ink-light/40"
          : "border-brand-300 dark:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950"
      }`}
    >
      {children}
    </button>
  );
}

function ActionLink({
  label,
  icon,
  href,
  disabled,
  note,
}: {
  label: string;
  icon: string;
  href?: string;
  disabled?: boolean;
  note?: string;
}) {
  const content = (
    <>
      <span>{icon}</span>
      <span>{label}</span>
      {note && <span className="text-[10px] text-ink-light/40 dark:text-ink-dark/40 ml-auto">{note}</span>}
    </>
  );
  const classes = "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 transition-colors";

  if (disabled || !href) {
    return (
      <div
        className={`${classes} border-dashed border-brand-200 dark:border-brand-800 text-ink-light/40 dark:text-ink-dark/40 cursor-not-allowed`}
      >
        {content}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className={`${classes} border-brand-200 dark:border-brand-800 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950`}
    >
      {content}
    </Link>
  );
}
