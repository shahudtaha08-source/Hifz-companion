import { DEFAULT_RECITER_ID, RECITERS } from "@/services/quranAudioService";

const STORAGE_KEY = "hifz-companion:selected-reciter";

/**
 * Reads the saved reciter id from localStorage. Falls back to the default
 * reciter if nothing is saved, the saved value is no longer a known
 * reciter, or localStorage isn't available (SSR, private browsing,
 * disabled storage, etc.) — this must never throw.
 */
export function loadSavedReciterId(): string {
  if (typeof window === "undefined") return DEFAULT_RECITER_ID;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && RECITERS.some((r) => r.id === saved)) return saved;
  } catch {
    // localStorage unavailable — fall through to default.
  }
  return DEFAULT_RECITER_ID;
}

export function saveReciterId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage full, disabled, or unavailable — persistence is a nice-to-have,
    // never worth crashing the player over.
  }
}
