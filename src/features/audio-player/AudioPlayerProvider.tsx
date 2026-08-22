"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEFAULT_RECITER_ID, RECITERS, getAyahAudioUrl, getReciterById } from "@/services/quranAudioService";
import { loadSavedReciterId, saveReciterId } from "@/lib/reciterPreference";
import type { AyahRef, PlaybackMode, PlaybackStatus, RepeatProgress } from "@/types/audio";

function ayahKey(surahId: number, numberInSurah: number) {
  return `${surahId}:${numberInSurah}`;
}

/**
 * Internal queue representation.
 *
 * `items` is the FULLY EXPANDED play list — for a repeated unit, the unit's
 * ayahs are literally repeated `repeatTotal` times in this array. That
 * keeps advancement trivial (always "next array item") while still letting
 * us compute human-readable progress from `unitLength`/`repeatTotal`
 * without any separate iteration-tracking state to fall out of sync.
 */
interface QueueState {
  items: AyahRef[];
  index: number;
  mode: PlaybackMode;
  unitLength: number; // ayahs per repeat unit (1 for a single ayah, N for a range/Surah)
  repeatTotal: number; // total plays/rounds requested ("total plays" semantics)
}

interface AudioPlayerContextValue {
  reciterId: string;
  reciters: typeof RECITERS;
  setReciterId: (id: string) => void;
  playingKey: string | null;
  /** The ayah currently loaded/playing, parsed — null when idle. Drives reader sync. */
  currentAyahRef: AyahRef | null;
  status: PlaybackStatus;
  errorMessage: string | null;
  /** Play a single ayah once (or resume if it's the same ayah, paused). */
  play: (surahId: number, numberInSurah: number) => void;
  /** Play a single ayah exactly `repeatCount` total times. */
  playAyahRepeated: (ayah: AyahRef, repeatCount: number) => void;
  /** Play from `startIndex` in `surahAyahs` through the end, `repeatCount` total times. */
  playFromRepeated: (surahAyahs: AyahRef[], startIndex: number, repeatCount: number) => void;
  /** Play the full Surah (ignoring current position) `repeatCount` total times. */
  playSurahRepeated: (surahAyahs: AyahRef[], repeatCount: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  /** Restart the currently loaded ayah from the beginning (does not change the queue). */
  repeatCurrent: () => void;
  isCurrent: (surahId: number, numberInSurah: number) => boolean;
  /** Non-null while a queue (repeat/sequence) is active — for progress UI. */
  repeatProgress: RepeatProgress | null;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<QueueState | null>(null);
  const reciterIdRef = useRef(DEFAULT_RECITER_ID);
  // Guards rapid/overlapping play requests: only the play() call that owns
  // the current token is allowed to apply its async result to state, so a
  // slow-resolving previous request can never clobber a newer one.
  const playTokenRef = useRef(0);

  const [reciterId, setReciterIdState] = useState(DEFAULT_RECITER_ID);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [repeatProgress, setRepeatProgress] = useState<RepeatProgress | null>(null);

  reciterIdRef.current = reciterId;

  const currentAyahRef = useMemo<AyahRef | null>(() => {
    if (!playingKey) return null;
    const [surahId, numberInSurah] = playingKey.split(":").map(Number);
    if (!surahId || !numberInSurah) return null;
    return { surahId, numberInSurah };
  }, [playingKey]);

  const computeProgress = useCallback((queue: QueueState): RepeatProgress | null => {
    if (queue.repeatTotal <= 1 && queue.items.length <= 1) return null;
    if (queue.unitLength <= 1) {
      // Single-ayah repeat: each queue item IS one play.
      return { mode: queue.mode, current: queue.index + 1, total: queue.repeatTotal };
    }
    // Multi-ayah unit (from-here / full Surah): progress is by ROUND.
    const round = Math.floor(queue.index / queue.unitLength) + 1;
    return { mode: queue.mode, current: round, total: queue.repeatTotal };
  }, []);

  const loadAndPlay = useCallback((surahId: number, numberInSurah: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const myToken = ++playTokenRef.current;

    const url = getAyahAudioUrl(reciterIdRef.current, surahId, numberInSurah);
    if (!url) {
      if (playTokenRef.current !== myToken) return;
      setPlayingKey(ayahKey(surahId, numberInSurah));
      setStatus("error");
      const reciter = getReciterById(reciterIdRef.current);
      setErrorMessage(`Audio isn't available for ${reciter?.displayName ?? "this reciter"} yet.`);
      queueRef.current = null;
      setRepeatProgress(null);
      return;
    }

    audio.pause();
    audio.src = url;
    setPlayingKey(ayahKey(surahId, numberInSurah));
    setStatus("loading");
    setErrorMessage(null);
    audio.play().catch(() => {
      // A stale request's rejection (e.g. superseded by a newer play call,
      // or the browser aborting because src changed) must not overwrite a
      // newer, still-valid state.
      if (playTokenRef.current !== myToken) return;
      setStatus("error");
      setErrorMessage("This ayah's audio couldn't be played. Please try again.");
    });
  }, []);

  // Create the single shared <audio> element once, on the client only.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const onWaiting = () => setStatus("loading");
    const onCanPlay = () => setStatus((s) => (s === "loading" ? "playing" : s));
    const onPlaying = () => setStatus("playing");
    const onPause = () => setStatus((s) => (s === "error" ? s : "paused"));
    const onEnded = () => {
      const queue = queueRef.current;
      if (queue && queue.index < queue.items.length - 1) {
        // Auto-advance to the next ayah in the (possibly repeated) sequence.
        const nextIndex = queue.index + 1;
        const nextQueue: QueueState = { ...queue, index: nextIndex };
        queueRef.current = nextQueue;
        setRepeatProgress(computeProgress(nextQueue));
        const next = nextQueue.items[nextIndex]!;
        loadAndPlay(next.surahId, next.numberInSurah);
        return;
      }
      queueRef.current = null;
      setRepeatProgress(null);
      setStatus("idle");
      setPlayingKey(null);
    };
    const onError = () => {
      setStatus("error");
      setErrorMessage("This ayah's audio couldn't be loaded. Please try again.");
      queueRef.current = null;
      setRepeatProgress(null);
    };

    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      // Component unmount / navigation away — never leave zombie playback.
      playTokenRef.current++;
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
      queueRef.current = null;
    };
  }, [loadAndPlay, computeProgress]);

  // Load persisted reciter choice on mount (client only).
  useEffect(() => {
    setReciterIdState(loadSavedReciterId());
  }, []);

  const clearQueueAndStop = useCallback(() => {
    playTokenRef.current++; // invalidate any in-flight play()/advance
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    queueRef.current = null;
    setRepeatProgress(null);
  }, []);

  const setReciterId = useCallback(
    (id: string) => {
      if (!getReciterById(id)) return;
      setReciterIdState(id);
      saveReciterId(id);
      // Switching reciter mid-playback stops everything (a safe switch,
      // never overlapping the old and new voice) rather than silently
      // continuing in the old one.
      clearQueueAndStop();
      const audio = audioRef.current;
      if (audio) audio.src = "";
      setPlayingKey(null);
      setStatus("idle");
      setErrorMessage(null);
    },
    [clearQueueAndStop]
  );

  const play = useCallback(
    (surahId: number, numberInSurah: number) => {
      const key = ayahKey(surahId, numberInSurah);

      // Same ayah, currently paused → resume instead of reloading.
      if (playingKey === key && status === "paused") {
        const myToken = ++playTokenRef.current;
        audioRef.current?.play().catch(() => {
          if (playTokenRef.current !== myToken) return;
          setStatus("error");
          setErrorMessage("Couldn't resume playback. Please try again.");
        });
        return;
      }

      // A single-ayah play request always replaces any active queue.
      queueRef.current = { items: [{ surahId, numberInSurah }], index: 0, mode: "single", unitLength: 1, repeatTotal: 1 };
      setRepeatProgress(null);
      loadAndPlay(surahId, numberInSurah);
    },
    [playingKey, status, loadAndPlay]
  );

  /**
   * Core of the "total plays" repeat semantics: a repeat count of N means
   * `unit` (one ayah, or a multi-ayah range) plays exactly N times total.
   * Implemented by literally concatenating the unit N times into the
   * queue's item list — see QueueState doc comment above.
   */
  const startRepeatedQueue = useCallback(
    (unit: AyahRef[], repeatCount: number, mode: PlaybackMode) => {
      if (unit.length === 0) return;
      const total = Math.max(1, Math.floor(repeatCount));
      const items: AyahRef[] = [];
      for (let i = 0; i < total; i++) items.push(...unit);

      const queue: QueueState = { items, index: 0, mode, unitLength: unit.length, repeatTotal: total };
      queueRef.current = queue;
      setRepeatProgress(computeProgress(queue));
      const first = items[0]!;
      loadAndPlay(first.surahId, first.numberInSurah);
    },
    [loadAndPlay, computeProgress]
  );

  const playAyahRepeated = useCallback(
    (ayah: AyahRef, repeatCount: number) => startRepeatedQueue([ayah], repeatCount, "single"),
    [startRepeatedQueue]
  );

  const playFromRepeated = useCallback(
    (surahAyahs: AyahRef[], startIndex: number, repeatCount: number) => {
      const clamped = Math.max(0, Math.min(startIndex, surahAyahs.length - 1));
      startRepeatedQueue(surahAyahs.slice(clamped), repeatCount, "from-here");
    },
    [startRepeatedQueue]
  );

  const playSurahRepeated = useCallback(
    (surahAyahs: AyahRef[], repeatCount: number) => startRepeatedQueue(surahAyahs, repeatCount, "surah"),
    [startRepeatedQueue]
  );

  const repeatCurrent = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !playingKey) return;
    const myToken = ++playTokenRef.current;
    audio.currentTime = 0;
    audio.play().catch(() => {
      if (playTokenRef.current !== myToken) return;
      setStatus("error");
      setErrorMessage("Couldn't restart playback. Please try again.");
    });
  }, [playingKey]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || status !== "paused") return;
    const myToken = ++playTokenRef.current;
    audio.play().catch(() => {
      if (playTokenRef.current !== myToken) return;
      setStatus("error");
      setErrorMessage("Couldn't resume playback. Please try again.");
    });
  }, [status]);

  const stop = useCallback(() => {
    clearQueueAndStop();
    setPlayingKey(null);
    setStatus("idle");
    setErrorMessage(null);
  }, [clearQueueAndStop]);

  const isCurrent = useCallback(
    (surahId: number, numberInSurah: number) => playingKey === ayahKey(surahId, numberInSurah),
    [playingKey]
  );

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      reciterId,
      reciters: RECITERS,
      setReciterId,
      playingKey,
      currentAyahRef,
      status,
      errorMessage,
      play,
      playAyahRepeated,
      playFromRepeated,
      playSurahRepeated,
      pause,
      resume,
      stop,
      repeatCurrent,
      isCurrent,
      repeatProgress,
    }),
    [
      reciterId,
      setReciterId,
      playingKey,
      currentAyahRef,
      status,
      errorMessage,
      play,
      playAyahRepeated,
      playFromRepeated,
      playSurahRepeated,
      pause,
      resume,
      stop,
      repeatCurrent,
      isCurrent,
      repeatProgress,
    ]
  );

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

export function useAudioPlayer(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return ctx;
}
