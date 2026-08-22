"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_RECITER_ID, DEFAULT_URDU_TRANSLATION_RECITER_ID, RECITERS, getAyahAudioUrl, getReciterById } from "@/services/quranAudioService";
import { loadSavedReciterId, saveReciterId } from "@/lib/reciterPreference";
import type { AyahRef, AudioSegmentKind, PlaybackMode, PlaybackSegment, PlaybackStatus, RepeatProgress } from "@/types/audio";

function ayahKey(surahId: number, numberInSurah: number) { return `${surahId}:${numberInSurah}`; }
interface QueueState { items: PlaybackSegment[]; index: number; mode: PlaybackMode; unitLength: number; repeatTotal: number; }
interface AudioPlayerContextValue {
  reciterId: string; translationReciterId: string; reciters: typeof RECITERS;
  setReciterId: (id: string) => void; setTranslationReciterId: (id: string) => void;
  playingKey: string | null; currentAyahRef: AyahRef | null; currentSegmentKind: AudioSegmentKind | null;
  status: PlaybackStatus; errorMessage: string | null;
  play: (surahId: number, numberInSurah: number) => void;
  playAyahRepeated: (ayah: AyahRef, repeatCount: number) => void;
  playFromRepeated: (surahAyahs: AyahRef[], startIndex: number, repeatCount: number) => void;
  playSurahRepeated: (surahAyahs: AyahRef[], repeatCount: number) => void;
  playArabicThenUrdu: (surahAyahs: AyahRef[], startIndex: number, repeatCount: number) => void;
  pause: () => void; resume: () => void; stop: () => void; repeatCurrent: () => void;
  isCurrent: (surahId: number, numberInSurah: number) => boolean; repeatProgress: RepeatProgress | null;
}
const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<QueueState | null>(null);
  const reciterIdRef = useRef(DEFAULT_RECITER_ID);
  const translationReciterIdRef = useRef(DEFAULT_URDU_TRANSLATION_RECITER_ID);
  const playTokenRef = useRef(0);
  const [reciterId, setReciterIdState] = useState(DEFAULT_RECITER_ID);
  const [translationReciterId, setTranslationReciterIdState] = useState(DEFAULT_URDU_TRANSLATION_RECITER_ID);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [currentSegmentKind, setCurrentSegmentKind] = useState<AudioSegmentKind | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [repeatProgress, setRepeatProgress] = useState<RepeatProgress | null>(null);
  reciterIdRef.current = reciterId; translationReciterIdRef.current = translationReciterId;

  const currentAyahRef = useMemo<AyahRef | null>(() => {
    if (!playingKey) return null;
    const [surahId, numberInSurah] = playingKey.split(":").map(Number);
    return surahId && numberInSurah ? { surahId, numberInSurah } : null;
  }, [playingKey]);

  const computeProgress = useCallback((queue: QueueState): RepeatProgress | null => {
    if (queue.repeatTotal <= 1 && queue.items.length <= 1) return null;
    if (queue.unitLength <= 1) return { mode: queue.mode, current: queue.index + 1, total: queue.repeatTotal };
    return { mode: queue.mode, current: Math.floor(queue.index / queue.unitLength) + 1, total: queue.repeatTotal };
  }, []);

  const loadAndPlaySegment = useCallback((segment: PlaybackSegment) => {
    const audio = audioRef.current; if (!audio) return;
    const myToken = ++playTokenRef.current;
    const url = getAyahAudioUrl(segment.reciterId, segment.surahId, segment.numberInSurah);
    if (!url) {
      if (playTokenRef.current !== myToken) return;
      setPlayingKey(ayahKey(segment.surahId, segment.numberInSurah)); setCurrentSegmentKind(segment.kind);
      setStatus("error"); setErrorMessage(`Audio isn't available for ${getReciterById(segment.reciterId)?.displayName ?? "this voice"} yet.`);
      queueRef.current = null; setRepeatProgress(null); return;
    }
    audio.pause(); audio.src = url; audio.currentTime = 0;
    setPlayingKey(ayahKey(segment.surahId, segment.numberInSurah)); setCurrentSegmentKind(segment.kind);
    setStatus("loading"); setErrorMessage(null);
    audio.play().catch(() => { if (playTokenRef.current === myToken) { setStatus("error"); setErrorMessage("This audio couldn't be played. Please try again."); } });
  }, []);

  useEffect(() => {
    const audio = new Audio(); audio.preload = "metadata"; audioRef.current = audio;
    const onWaiting = () => setStatus("loading");
    const onCanPlay = () => setStatus((s) => (s === "loading" ? "playing" : s));
    const onPlaying = () => setStatus("playing");
    const onPause = () => { if (!audio.ended) setStatus((s) => (s === "error" ? s : "paused")); };
    const onEnded = () => {
      const queue = queueRef.current;
      if (queue && queue.index < queue.items.length - 1) {
        const nextQueue = { ...queue, index: queue.index + 1 }; queueRef.current = nextQueue;
        setRepeatProgress(computeProgress(nextQueue)); loadAndPlaySegment(nextQueue.items[nextQueue.index]!); return;
      }
      queueRef.current = null; setRepeatProgress(null); setPlayingKey(null); setCurrentSegmentKind(null); setStatus("idle");
    };
    const onError = () => { setStatus("error"); setErrorMessage("This audio couldn't be loaded. Please try again."); queueRef.current = null; setRepeatProgress(null); };
    audio.addEventListener("waiting", onWaiting); audio.addEventListener("canplay", onCanPlay); audio.addEventListener("playing", onPlaying); audio.addEventListener("pause", onPause); audio.addEventListener("ended", onEnded); audio.addEventListener("error", onError);
    return () => { playTokenRef.current++; audio.pause(); audio.src = ""; audio.removeEventListener("waiting", onWaiting); audio.removeEventListener("canplay", onCanPlay); audio.removeEventListener("playing", onPlaying); audio.removeEventListener("pause", onPause); audio.removeEventListener("ended", onEnded); audio.removeEventListener("error", onError); };
  }, [computeProgress, loadAndPlaySegment]);
  useEffect(() => setReciterIdState(loadSavedReciterId()), []);

  const clearQueueAndStop = useCallback(() => { playTokenRef.current++; const audio = audioRef.current; if (audio) { audio.pause(); audio.currentTime = 0; } queueRef.current = null; setRepeatProgress(null); }, []);
  const setReciterId = useCallback((id: string) => { const r = getReciterById(id); if (!r || r.kind === "translation") return; setReciterIdState(id); saveReciterId(id); clearQueueAndStop(); setPlayingKey(null); setCurrentSegmentKind(null); setStatus("idle"); }, [clearQueueAndStop]);
  const setTranslationReciterId = useCallback((id: string) => { const r = getReciterById(id); if (!r || r.kind !== "translation") return; setTranslationReciterIdState(id); clearQueueAndStop(); setPlayingKey(null); setCurrentSegmentKind(null); setStatus("idle"); }, [clearQueueAndStop]);

  const startQueue = useCallback((items: PlaybackSegment[], mode: PlaybackMode, unitLength: number, repeatTotal: number) => {
    if (!items.length) return; const queue = { items, index: 0, mode, unitLength, repeatTotal }; queueRef.current = queue; setRepeatProgress(computeProgress(queue)); loadAndPlaySegment(items[0]!);
  }, [computeProgress, loadAndPlaySegment]);
  const play = useCallback((surahId: number, numberInSurah: number) => {
    const key = ayahKey(surahId, numberInSurah);
    if (playingKey === key && status === "paused") { const token = ++playTokenRef.current; audioRef.current?.play().catch(() => { if (playTokenRef.current === token) setStatus("error"); }); return; }
    startQueue([{ surahId, numberInSurah, kind: "arabic", reciterId: reciterIdRef.current }], "single", 1, 1);
  }, [playingKey, startQueue, status]);
  const repeatedSegments = useCallback((unit: AyahRef[], repeatCount: number, mode: PlaybackMode) => {
    const total = Math.max(1, Math.floor(repeatCount)); const items: PlaybackSegment[] = [];
    for (let round = 0; round < total; round++) for (const ayah of unit) items.push({ ...ayah, kind: "arabic", reciterId: reciterIdRef.current });
    startQueue(items, mode, unit.length, total);
  }, [startQueue]);
  const playAyahRepeated = useCallback((ayah: AyahRef, count: number) => repeatedSegments([ayah], count, "single"), [repeatedSegments]);
  const playFromRepeated = useCallback((ayahs: AyahRef[], index: number, count: number) => repeatedSegments(ayahs.slice(Math.max(0, index)), count, "from-here"), [repeatedSegments]);
  const playSurahRepeated = useCallback((ayahs: AyahRef[], count: number) => repeatedSegments(ayahs, count, "surah"), [repeatedSegments]);
  const playArabicThenUrdu = useCallback((ayahs: AyahRef[], startIndex: number, repeatCount: number) => {
    const unit = ayahs.slice(Math.max(0, startIndex)); if (!unit.length) return;
    const translationReciter = getReciterById(translationReciterIdRef.current);
    if (!translationReciter || translationReciter.kind !== "translation" || translationReciter.provider === "unavailable") { setStatus("error"); setErrorMessage("A verified Urdu translation audio source is required for Arabic + Urdu mode."); return; }
    const total = Math.max(1, Math.floor(repeatCount)); const items: PlaybackSegment[] = [];
    for (let round = 0; round < total; round++) for (const ayah of unit) { items.push({ ...ayah, kind: "arabic", reciterId: reciterIdRef.current }); items.push({ ...ayah, kind: "translation", reciterId: translationReciterIdRef.current }); }
    startQueue(items, "arabic-urdu", unit.length * 2, total);
  }, [startQueue]);
  const pause = useCallback(() => audioRef.current?.pause(), []);
  const resume = useCallback(() => { const audio = audioRef.current; if (!audio || status !== "paused") return; const token = ++playTokenRef.current; audio.play().catch(() => { if (playTokenRef.current === token) setStatus("error"); }); }, [status]);
  const stop = useCallback(() => { clearQueueAndStop(); setPlayingKey(null); setCurrentSegmentKind(null); setStatus("idle"); setErrorMessage(null); }, [clearQueueAndStop]);
  const repeatCurrent = useCallback(() => { const audio = audioRef.current; if (!audio || !playingKey) return; audio.currentTime = 0; audio.play().catch(() => setStatus("error")); }, [playingKey]);
  const isCurrent = useCallback((surahId: number, numberInSurah: number) => playingKey === ayahKey(surahId, numberInSurah), [playingKey]);
  const value = useMemo<AudioPlayerContextValue>(() => ({ reciterId, translationReciterId, reciters: RECITERS, setReciterId, setTranslationReciterId, playingKey, currentAyahRef, currentSegmentKind, status, errorMessage, play, playAyahRepeated, playFromRepeated, playSurahRepeated, playArabicThenUrdu, pause, resume, stop, repeatCurrent, isCurrent, repeatProgress }), [reciterId, translationReciterId, setReciterId, setTranslationReciterId, playingKey, currentAyahRef, currentSegmentKind, status, errorMessage, play, playAyahRepeated, playFromRepeated, playSurahRepeated, playArabicThenUrdu, pause, resume, stop, repeatCurrent, isCurrent, repeatProgress]);
  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}
export function useAudioPlayer(): AudioPlayerContextValue { const ctx = useContext(AudioPlayerContext); if (!ctx) throw new Error("useAudioPlayer must be used within an AudioPlayerProvider"); return ctx; }
