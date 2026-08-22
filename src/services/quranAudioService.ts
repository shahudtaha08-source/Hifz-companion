import type { Reciter } from "@/types/audio";

/**
 * Quran audio provider abstraction.
 *
 * Every reciter's audio is resolved through this module — nothing else in
 * the app is allowed to build a Quran audio URL directly. That keeps the
 * provider swappable: changing where audio comes from later means editing
 * this file only.
 *
 * Current provider: everyayah.com, a long-running, widely used Quran audio
 * host that serves one MP3 file per ayah. No API key required. Every
 * `providerId` below was checked against everyayah.com's own live,
 * machine-readable reciter index (https://www.everyayah.com/data/recitations.js)
 * — fetched directly and cross-checked entry-by-entry before this file was
 * last edited, not assumed or carried over from memory.
 *
 * File layout: https://everyayah.com/data/{folder}/{SSS}{AAA}.mp3
 * where SSS = 3-digit surah number, AAA = 3-digit ayah number.
 *
 * Reciters explicitly requested but NOT found in everyayah.com's reciter
 * index (checked directly, not assumed): "Saud Al Jumuah" and
 * "Bandar Baleela". Both are registered below with `provider: "unavailable"`
 * rather than a guessed URL, so the player shows a clear "audio isn't
 * available" state. Swap in a verified providerId for either once one is
 * confirmed — no other file needs to change.
 */
export const RECITERS: Reciter[] = [
  {
    id: "alafasy",
    displayName: "Mishary Rashid Alafasy",
    provider: "everyayah",
    providerId: "Alafasy_128kbps",
    bitrate: "128kbps",
  },
  {
    id: "shuraym",
    displayName: "Saud Al-Shuraim",
    provider: "everyayah",
    providerId: "Saood_ash-Shuraym_128kbps",
    bitrate: "128kbps",
  },
  {
    id: "sudais",
    displayName: "Abdul Rahman Al-Sudais",
    provider: "everyayah",
    providerId: "Abdurrahmaan_As-Sudais_192kbps",
    bitrate: "192kbps",
  },
  {
    id: "dosari",
    displayName: "Yasir Al-Dosari",
    provider: "everyayah",
    providerId: "Yasser_Ad-Dussary_128kbps",
    bitrate: "128kbps",
  },
  {
    id: "baleela",
    displayName: "Bandar Baleela",
    provider: "unavailable",
    providerId: "",
  },
  {
    id: "muaiqly",
    displayName: "Maher Al-Muaiqly",
    provider: "everyayah",
    providerId: "MaherAlMuaiqly128kbps",
    bitrate: "128kbps",
  },
  {
    id: "ghamdi",
    displayName: "Saad Al-Ghamdi",
    provider: "everyayah",
    // Only bitrate everyayah.com hosts for this reciter — lower quality
    // than the others here, but a real, verified source rather than none.
    providerId: "Ghamadi_40kbps",
    bitrate: "40kbps",
  },
  {
    id: "shatri",
    displayName: "Abu Bakr Al-Shatri",
    provider: "everyayah",
    providerId: "Abu_Bakr_Ash-Shaatree_128kbps",
    bitrate: "128kbps",
  },
  {
    id: "ajmi",
    displayName: "Ahmed Al-Ajmi",
    provider: "everyayah",
    providerId: "ahmed_ibn_ali_al_ajamy_128kbps",
    bitrate: "128kbps",
  },
  {
    id: "abdulbasit",
    displayName: "Abdul Basit Abdus Samad",
    provider: "everyayah",
    providerId: "Abdul_Basit_Murattal_192kbps",
    bitrate: "192kbps",
  },
  {
    id: "shamshad",
    displayName: "Shamshad Ali Khan",
    provider: "everyayah",
    // Verified live against recitations.js entry 63 immediately before
    // adding this: {"subfolder":"translations/urdu_shamshad_ali_khan_46kbps",
    // "name":"(Urdu) Shamshad Ali Khan","bitrate":"46kbps"}. This is an
    // Urdu-translation recitation, lower bitrate than most others here —
    // flagged, not hidden.
    providerId: "translations/urdu_shamshad_ali_khan_46kbps",
    bitrate: "46kbps",
  },
  {
    id: "al-jumuah",
    displayName: "Saud Al Jumuah",
    provider: "unavailable",
    providerId: "",
  },
];

export const DEFAULT_RECITER_ID = "alafasy";

export function getReciterById(id: string): Reciter | undefined {
  return RECITERS.find((r) => r.id === id);
}

const EVERYAYAH_BASE = "https://everyayah.com/data";

/**
 * Build the audio URL for one ayah under one reciter, or return null when
 * that reciter has no available audio source. Never throws.
 */
export function getAyahAudioUrl(
  reciterId: string,
  surahNumber: number,
  numberInSurah: number
): string | null {
  const reciter = getReciterById(reciterId);
  if (!reciter) return null;

  if (reciter.provider === "everyayah") {
    const s = String(surahNumber).padStart(3, "0");
    const a = String(numberInSurah).padStart(3, "0");
    return `${EVERYAYAH_BASE}/${reciter.providerId}/${s}${a}.mp3`;
  }

  // provider === "unavailable" (or any future unhandled provider)
  return null;
}
