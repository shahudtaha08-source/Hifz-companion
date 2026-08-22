/**
 * /scripts/import-quran
 *
 * Imports Quran text + mushaf metadata from trusted, licensed datasets and
 * seeds the database. This script is the ONLY place Quran reference data is
 * ever written — the running application treats it as read-only.
 *
 * Sources:
 *  - Arabic text (Uthmani script): `quran-json` npm package, which sources
 *    its text from The Noble Qur'an Encyclopedia (quranenc.com).
 *  - Surah names / revelation type: same package.
 *  - Juz / Hizb / Rub al-Hizb / Page / Sajdah metadata: `quran-meta` npm
 *    package (Hafs/Madani mushaf numbering), MIT licensed.
 *  - English translation (Saheeh International / Umm Muhammad) and Urdu
 *    translation (Abul A'la Maududi): also from `quran-json`
 *    (dist/quran_en.json, dist/quran_ur.json), sourced from tanzil.net,
 *    CC-BY-SA 4.0. Stored in a SEPARATE table (AyahTranslation) with its
 *    own provenance record per language (TranslationSource) — never
 *    merged into Ayah, and never treated as Quran text.
 *
 * Per section 23 (Data Integrity):
 *  - We never generate or "correct" Quran text.
 *  - `textUthmani` is stored byte-for-byte as received from the source.
 *  - `textSearchNormalized` is a clearly separate, additional field used
 *    only by the Mutashabihat search index (see src/utils/arabicNormalize.ts).
 *  - Dataset provenance (source URL, license, version, checksum) is recorded
 *    in the QuranDataset table so it's always auditable.
 *
 * Usage: npm run import:quran
 */

import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import quranData from "quran-json/dist/quran.json";
import quranEnData from "quran-json/dist/quran_en.json";
import quranUrData from "quran-json/dist/quran_ur.json";
import { createHafs } from "quran-meta";
import { normalizeForSearch } from "../../src/utils/arabicNormalize";

const db = new PrismaClient();
const hafs = createHafs();

interface RawVerse {
  id: number; // ayah number within surah
  text: string;
}

interface RawChapter {
  id: number; // surah number 1-114
  name: string; // Arabic name
  transliteration: string;
  type: "meccan" | "medinan";
  total_verses: number;
  verses: RawVerse[];
}

interface RawTranslatedVerse {
  id: number;
  text: string;
  translation: string;
}

interface RawTranslatedChapter {
  id: number;
  verses: RawTranslatedVerse[];
}

const QURAN_JSON_SOURCE = {
  name: "quran-json (Uthmani text, The Noble Qur'an Encyclopedia)",
  sourceUrl: "https://github.com/risan/quran-json",
  license: "MIT (code) — Arabic text sourced from quranenc.com",
  version: "3.1.2",
};

// Separate, clearly-attributed translation sources — never treated as
// Quran text. Both bundled in the same `quran-json` package we already
// depend on for the Arabic text, but tracked with their own provenance
// records because they're a genuinely different kind of content with a
// different author/license chain per language (see TranslationSource in
// the schema). Attribution verified against quran-json's own README before
// use — human translations, no AI generation or paraphrasing involved.
const TRANSLATION_SOURCES: Array<{
  languageCode: string;
  name: string;
  sourceUrl: string;
  license: string;
  data: unknown;
}> = [
  {
    languageCode: "en",
    name: "Saheeh International (Umm Muhammad)",
    sourceUrl: "https://tanzil.net/trans/en.sahih",
    license: "CC-BY-SA 4.0 (via quran-json, https://github.com/risan/quran-json)",
    data: quranEnData,
  },
  {
    languageCode: "ur",
    name: "Abul A'la Maududi",
    sourceUrl: "https://tanzil.net/trans/ur.maududi",
    license: "CC-BY-SA 4.0 (via quran-json, https://github.com/risan/quran-json)",
    data: quranUrData,
  },
];

function checksumOf(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

async function main() {
  const chapters = quranData as unknown as RawChapter[];

  if (!Array.isArray(chapters) || chapters.length !== 114) {
    throw new Error(
      `Refusing to import: expected 114 surahs from quran-json, got ${
        Array.isArray(chapters) ? chapters.length : typeof chapters
      }. The dataset could not be verified — stopping rather than guessing.`
    );
  }

  console.log("Verifying dataset integrity before writing anything...");
  const totalAyahsInSource = chapters.reduce((sum, c) => sum + c.verses.length, 0);
  if (totalAyahsInSource !== 6236) {
    throw new Error(
      `Refusing to import: expected 6236 total ayahs, source has ${totalAyahsInSource}.`
    );
  }
  console.log(`Dataset verified: 114 surahs, ${totalAyahsInSource} ayahs.`);

  const checksum = checksumOf(chapters);

  console.log("Recording dataset provenance...");
  await db.quranDataset.updateMany({ data: { isActive: false }, where: { isActive: true } });
  const dataset = await db.quranDataset.create({
    data: {
      name: QURAN_JSON_SOURCE.name,
      sourceUrl: QURAN_JSON_SOURCE.sourceUrl,
      license: QURAN_JSON_SOURCE.license,
      version: QURAN_JSON_SOURCE.version,
      checksum,
      isActive: true,
    },
  });

  let globalAyahNumber = 0;
  // surahId:numberInSurah -> Ayah.id, reused below for the translation pass
  // so we don't need a second full read of the Ayah table.
  const ayahIdByRef = new Map<string, string>();

  for (const chapter of chapters) {
    process.stdout.write(`Importing Surah ${chapter.id} (${chapter.transliteration})...\r`);

    await db.surah.upsert({
      where: { id: chapter.id },
      create: {
        id: chapter.id,
        nameArabic: chapter.name,
        nameTransliterated: chapter.transliteration,
        nameTranslated: null,
        revelationType: chapter.type,
        totalAyahs: chapter.total_verses,
        datasetId: dataset.id,
      },
      update: {
        nameArabic: chapter.name,
        nameTransliterated: chapter.transliteration,
        revelationType: chapter.type,
        totalAyahs: chapter.total_verses,
        datasetId: dataset.id,
      },
    });

    for (const verse of chapter.verses) {
      globalAyahNumber += 1;

      const meta = hafs.getAyahMeta(globalAyahNumber as never);

      const ayah = await db.ayah.upsert({
        where: { surahId_numberInSurah: { surahId: chapter.id, numberInSurah: verse.id } },
        create: {
          surahId: chapter.id,
          numberInSurah: verse.id,
          globalAyahNumber,
          textUthmani: verse.text, // stored exactly as sourced — never altered
          textSearchNormalized: normalizeForSearch(verse.text),
          juz: meta.juz,
          hizb: meta.rubAlHizbId != null ? Math.floor(meta.rubAlHizbId / 4) + 1 : 1,
          rubAlHizb: meta.rubAlHizbId ?? null,
          page: meta.page ?? null,
          isSajdah: meta.isSajdahAyah,
        },
        update: {
          textUthmani: verse.text,
          textSearchNormalized: normalizeForSearch(verse.text),
          juz: meta.juz,
          rubAlHizb: meta.rubAlHizbId ?? null,
          page: meta.page ?? null,
          isSajdah: meta.isSajdahAyah,
        },
      });

      ayahIdByRef.set(`${chapter.id}:${verse.id}`, ayah.id);
    }
  }

  console.log(`\nImported ${globalAyahNumber} ayahs across 114 surahs.`);

  for (const source of TRANSLATION_SOURCES) {
    console.log(`Recording translation source provenance (${source.languageCode})...`);
    await db.translationSource.updateMany({
      data: { isActive: false },
      where: { isActive: true, languageCode: source.languageCode },
    });
    const translationSource = await db.translationSource.create({
      data: {
        languageCode: source.languageCode,
        name: source.name,
        sourceUrl: source.sourceUrl,
        license: source.license,
        isActive: true,
      },
    });

    console.log(`Importing ${source.languageCode} translation (${source.name})...`);
    const translatedChapters = source.data as unknown as RawTranslatedChapter[];
    let translationsImported = 0;
    for (const chapter of translatedChapters) {
      for (const verse of chapter.verses) {
        const ayahId = ayahIdByRef.get(`${chapter.id}:${verse.id}`);
        if (!ayahId) {
          // Should be unreachable given both files come from the same
          // verified 114-surah/6236-ayah dataset, but never silently skip a
          // real mismatch — surface it instead of guessing.
          throw new Error(
            `Translation import (${source.languageCode}): no matching ayah for ${chapter.id}:${verse.id}. Refusing to guess.`
          );
        }
        await db.ayahTranslation.upsert({
          where: { ayahId_sourceId: { ayahId, sourceId: translationSource.id } },
          create: {
            ayahId,
            sourceId: translationSource.id,
            languageCode: source.languageCode,
            text: verse.translation,
          },
          update: { text: verse.translation },
        });
        translationsImported++;
      }
    }
    console.log(`Imported ${translationsImported} ${source.languageCode} translations.`);
  }

  console.log(
    "\nNext: run `npm run build:mutashabihat-index` to compute similar-ayah matches."
  );
}

main()
  .catch((err) => {
    console.error("Import failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
