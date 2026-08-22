/**
 * Reciter identities and the provider abstraction behind them.
 *
 * `provider` + `providerId` describe how to build an audio URL for a given
 * reciter without hard-coding a full URL anywhere else in the app — see
 * src/services/quranAudioService.ts, which is the only place that turns
 * these into actual request URLs.
 */
export type AudioProvider = "everyayah" | "unavailable";

export interface Reciter {
  /** Stable internal id, used in the UI, in URLs, and in localStorage. */
  id: string;
  displayName: string;
  provider: AudioProvider;
  /**
   * The provider's own identifier for this reciter (e.g. an everyayah.com
   * folder name). Empty when provider is "unavailable".
   */
  providerId: string;
  /** Display-only quality info (e.g. "128kbps"), when known. */
  bitrate?: string;
}

export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "error";

/** A single ayah reference, independent of any particular fetched Ayah row. */
export interface AyahRef {
  surahId: number;
  numberInSurah: number;
}

/** Which kind of unit is currently queued for playback. */
export type PlaybackMode = "single" | "from-here" | "surah";

/**
 * "Total plays" repeat semantics (see AudioPlayerProvider): a repeat count
 * of N means the selected unit (one ayah, or "from here" range, or the
 * whole Surah) plays exactly N times total, not N times *in addition to*
 * an initial play.
 */
export const REPEAT_PRESETS = [1, 2, 3, 5, 7, 11, 21, 31, 51] as const;
export type RepeatCount = (typeof REPEAT_PRESETS)[number];

export interface RepeatProgress {
  mode: PlaybackMode;
  /** 1-based index of the current play/round. */
  current: number;
  /** Total plays/rounds requested. */
  total: number;
}

export interface PlaybackState {
  reciterId: string;
  /** `${surahId}:${numberInSurah}` of the ayah currently loaded, if any. */
  playingKey: string | null;
  status: PlaybackStatus;
  errorMessage: string | null;
}
