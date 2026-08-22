import { db } from "@/lib/db";
import type { AyahWithSurah } from "@/types/quran";

function dayIndex(date: Date) {
  const utcDay = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
  return ((utcDay % 6236) + 6236) % 6236;
}

export async function getDailyAyah(date = new Date()): Promise<AyahWithSurah | null> {
  const ayah = await db.ayah.findFirst({
    orderBy: { globalAyahNumber: "asc" },
    skip: dayIndex(date),
    include: { surah: true },
  });
  if (!ayah) return null;
  const { surah, ...rest } = ayah;
  return {
    ...rest,
    surah: {
      id: surah.id,
      nameArabic: surah.nameArabic,
      nameTransliterated: surah.nameTransliterated,
      nameTranslated: surah.nameTranslated,
      revelationType: surah.revelationType as "meccan" | "medinan",
      totalAyahs: surah.totalAyahs,
    },
  };
}
