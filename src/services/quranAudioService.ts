import type { Reciter } from "@/types/audio";

/**
 * Centralized Quran/translation audio URL registry. No component constructs
 * provider URLs directly.
 */
export const RECITERS: Reciter[] = [
  { id: "alafasy", displayName: "Mishary Rashid Alafasy", provider: "everyayah", providerId: "Alafasy_128kbps", bitrate: "128kbps", kind: "arabic" },
  { id: "shuraym", displayName: "Saud Al-Shuraim", provider: "everyayah", providerId: "Saood_ash-Shuraym_128kbps", bitrate: "128kbps", kind: "arabic" },
  { id: "sudais", displayName: "Abdul Rahman Al-Sudais", provider: "everyayah", providerId: "Abdurrahmaan_As-Sudais_192kbps", bitrate: "192kbps", kind: "arabic" },
  { id: "dosari", displayName: "Yasir Al-Dosari", provider: "everyayah", providerId: "Yasser_Ad-Dussary_128kbps", bitrate: "128kbps", kind: "arabic" },
  { id: "baleela", displayName: "Bandar Baleela", provider: "unavailable", providerId: "", kind: "arabic" },
  { id: "muaiqly", displayName: "Maher Al-Muaiqly", provider: "everyayah", providerId: "MaherAlMuaiqly128kbps", bitrate: "128kbps", kind: "arabic" },
  { id: "ghamdi", displayName: "Saad Al-Ghamdi", provider: "everyayah", providerId: "Ghamadi_40kbps", bitrate: "40kbps", kind: "arabic" },
  { id: "shatri", displayName: "Abu Bakr Al-Shatri", provider: "everyayah", providerId: "Abu_Bakr_Ash-Shaatree_128kbps", bitrate: "128kbps", kind: "arabic" },
  { id: "ajmi", displayName: "Ahmed Al-Ajmi", provider: "everyayah", providerId: "ahmed_ibn_ali_al_ajamy_128kbps", bitrate: "128kbps", kind: "arabic" },
  { id: "abdulbasit", displayName: "Abdul Basit Abdus Samad", provider: "everyayah", providerId: "Abdul_Basit_Murattal_192kbps", bitrate: "192kbps", kind: "arabic" },
  {
    id: "shamshad",
    displayName: "Shamshad Ali Khan (Urdu Translation)",
    provider: "everyayah",
    providerId: "translations/urdu_shamshad_ali_khan_46kbps",
    bitrate: "46kbps",
    kind: "translation",
    languageCode: "ur",
  },
  {
    id: "fateh-muhammad-jalandhari",
    displayName: "Fateh Muhammad Jalandhari (Urdu Translation)",
    provider: "everyayah",
    providerId: "translations/urdu_fateh_muhammad_jalandhri_46kbps",
    bitrate: "46kbps",
    kind: "translation",
    languageCode: "ur",
  },
  { id: "al-jumuah", displayName: "Saud Al Jumuah", provider: "unavailable", providerId: "", kind: "arabic" },
];

export const DEFAULT_RECITER_ID = "alafasy";
export const DEFAULT_URDU_TRANSLATION_RECITER_ID = "shamshad";

export const ARABIC_RECITERS = RECITERS.filter((r) => r.kind !== "translation");
export const TRANSLATION_RECITERS = RECITERS.filter((r) => r.kind === "translation");

export function getReciterById(id: string): Reciter | undefined {
  return RECITERS.find((r) => r.id === id);
}

const EVERYAYAH_BASE = "https://everyayah.com/data";
const ALQURAN_CDN_BASE = "https://cdn.islamic.network/quran/audio/64";

// Number of ayahs in each Surah. This lets us compute the global ayah number
// required by the AlQuran.Cloud audio CDN without another network request.
const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60,
  49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19,
  26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7,
  3, 6, 3, 5, 4, 5, 6,
] as const;

function globalAyahNumber(surahNumber: number, numberInSurah: number) {
  if (surahNumber < 1 || surahNumber > SURAH_AYAH_COUNTS.length) return numberInSurah;
  let offset = 0;
  for (let i = 0; i < surahNumber - 1; i++) offset += SURAH_AYAH_COUNTS[i]!;
  return offset + numberInSurah;
}

function everyAyahUrl(providerId: string, surahNumber: number, numberInSurah: number) {
  const s = String(surahNumber).padStart(3, "0");
  const a = String(numberInSurah).padStart(3, "0");
  return `${EVERYAYAH_BASE}/${providerId}/${s}${a}.mp3`;
}

/**
 * Returns ordered playback candidates. Fateh Muhammad Jalandhari gets several
 * historical EveryAyah folder spellings plus the AlQuran.Cloud Urdu edition as
 * a fallback, so a single mirror or folder-name mismatch does not leave the
 * selected voice silently broken.
 */
export function getAyahAudioUrls(reciterId: string, surahNumber: number, numberInSurah: number): string[] {
  const reciter = getReciterById(reciterId);
  if (!reciter || reciter.provider !== "everyayah" || !reciter.providerId) return [];

  const urls = [everyAyahUrl(reciter.providerId, surahNumber, numberInSurah)];

  if (reciter.id === "fateh-muhammad-jalandhari") {
    const alternateFolders = [
      "translations/urdu_fateh_muhammad_jalandhari_46kbps",
      "translations/urdu_fateh_muhammad_jalandhry_46kbps",
    ];
    for (const folder of alternateFolders) urls.push(everyAyahUrl(folder, surahNumber, numberInSurah));
    const global = globalAyahNumber(surahNumber, numberInSurah);
    urls.push(`${ALQURAN_CDN_BASE}/ur.jalandhry/${global}.mp3`);
  }

  return [...new Set(urls)];
}

export function getAyahAudioUrl(reciterId: string, surahNumber: number, numberInSurah: number): string | null {
  return getAyahAudioUrls(reciterId, surahNumber, numberInSurah)[0] ?? null;
}
