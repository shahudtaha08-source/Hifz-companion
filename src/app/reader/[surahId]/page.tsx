import { notFound } from "next/navigation";
import { getSurahWithAyahs } from "@/services/quranService";
import { getCurrentUserId } from "@/lib/auth";
import { getStatusMapForAyahs } from "@/services/hifzProgressService";
import { getTranslations } from "@/services/translationService";
import { ReaderView } from "@/features/quran-reader/ReaderView";
import type { AyahTranslations } from "@/components/quran/AyahToolsPanel";

export default async function SurahReaderPage({
  params,
  searchParams,
}: {
  params: { surahId: string };
  searchParams: { ayah?: string };
}) {
  const surahId = Number(params.surahId);
  if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
    notFound();
  }

  const ayahs = await getSurahWithAyahs(surahId);
  if (ayahs.length === 0) {
    notFound();
  }

  const ayahIds = ayahs.map((a) => a.id);
  const userId = await getCurrentUserId();
  const [statusByAyahId, enTranslations, urTranslations] = await Promise.all([
    getStatusMapForAyahs(userId, ayahIds),
    getTranslations(ayahIds, "en"),
    getTranslations(ayahIds, "ur"),
  ]);

  const translationsByAyahId: Record<string, AyahTranslations> = {};
  for (const id of ayahIds) {
    translationsByAyahId[id] = { en: enTranslations[id] ?? null, ur: urTranslations[id] ?? null };
  }

  const initialSelectedAyahId =
    ayahs.find((a) => String(a.numberInSurah) === searchParams.ayah)?.id ?? null;

  return (
    <ReaderView
      ayahs={ayahs}
      statusByAyahId={statusByAyahId}
      translationsByAyahId={translationsByAyahId}
      initialSelectedAyahId={initialSelectedAyahId}
    />
  );
}
