"use client";

import { useAudioPlayer } from "@/features/audio-player/AudioPlayerProvider";

export function ReciterSelector({ translation = false }: { translation?: boolean }) {
  const { reciterId, translationReciterId, reciters, setReciterId, setTranslationReciterId } = useAudioPlayer();
  const options = reciters.filter((r) => translation ? r.kind === "translation" : r.kind !== "translation");
  const value = translation ? translationReciterId : reciterId;

  return (
    <label className="flex items-center gap-2 text-xs text-ink-light/60 dark:text-ink-dark/60 min-w-0">
      <span className="shrink-0">{translation ? "Urdu voice" : "Reciter"}</span>
      <select
        value={value}
        onChange={(e) => translation ? setTranslationReciterId(e.target.value) : setReciterId(e.target.value)}
        className="min-w-0 max-w-[9rem] sm:max-w-none truncate rounded-md border border-brand-200 dark:border-brand-800 bg-transparent px-2 py-1 text-xs outline-none focus:border-brand-500"
      >
        {options.map((r) => (
          <option key={r.id} value={r.id}>
            {r.displayName}{r.provider === "unavailable" ? " (unavailable)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
