"use client";

import { useAudioPlayer } from "@/features/audio-player/AudioPlayerProvider";

export function ReciterSelector() {
  const { reciterId, reciters, setReciterId } = useAudioPlayer();

  return (
    <label className="flex items-center gap-2 text-xs text-ink-light/60 dark:text-ink-dark/60 min-w-0">
      <span className="shrink-0">Reciter</span>
      <select
        value={reciterId}
        onChange={(e) => setReciterId(e.target.value)}
        className="min-w-0 max-w-[9rem] sm:max-w-none truncate rounded-md border border-brand-200 dark:border-brand-800 bg-transparent px-2 py-1 text-xs outline-none focus:border-brand-500"
      >
        {reciters.map((r) => (
          <option key={r.id} value={r.id}>
            {r.displayName}
            {r.provider === "unavailable" ? " (unavailable)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
