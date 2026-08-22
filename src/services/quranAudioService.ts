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

export function getAyahAudioUrl(reciterId: string, surahNumber: number, numberInSurah: number): string | null {
  const reciter = getReciterById(reciterId);
  if (!reciter || reciter.provider !== "everyayah" || !reciter.providerId) return null;
  const s = String(surahNumber).padStart(3, "0");
  const a = String(numberInSurah).padStart(3, "0");
  return `${EVERYAYAH_BASE}/${reciter.providerId}/${s}${a}.mp3`;
}
