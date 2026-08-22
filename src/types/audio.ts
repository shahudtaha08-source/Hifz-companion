/**
 * Reciter identities and the provider abstraction behind them.
 */
export type AudioProvider = "everyayah" | "unavailable";

export interface Reciter {
  id: string;
  displayName: string;
  provider: AudioProvider;
  providerId: string;
  bitrate?: string;
  /** Translation voices are kept separate from Arabic Quran reciters in the UI. */
  kind?: "arabic" | "translation";
  languageCode?: string;
}

export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "error";

export interface AyahRef {
  surahId: number;
  numberInSurah: number;
}

export type PlaybackMode = "single" | "from-here" | "surah" | "arabic-urdu";

export type AudioSegmentKind = "arabic" | "translation";

export interface PlaybackSegment extends AyahRef {
  kind: AudioSegmentKind;
  reciterId: string;
}

export const REPEAT_PRESETS = [1, 2, 3, 5, 7, 11, 21, 31, 51] as const;
export type RepeatCount = (typeof REPEAT_PRESETS)[number];

export interface RepeatProgress {
  mode: PlaybackMode;
  current: number;
  total: number;
}

export interface PlaybackState {
  reciterId: string;
  playingKey: string | null;
  status: PlaybackStatus;
  errorMessage: string | null;
}
