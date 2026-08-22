# Hifz Companion

A Quran Hifz memorization & revision companion, with a Mutashabihat (similar-ayah)
finder as its centerpiece feature.

**This app is a memorization/revision aid. It does not replace a qualified Quran
teacher** for tajweed, ijazah, or verification of memorization.

---

## Status: Audio Synchronization + Lesson Controls (this update)

### Part 1 — Reciter expansion

Added **Shamshad Ali Khan** (Urdu recitation), verified live against
everyayah.com's own machine-readable index
(`https://www.everyayah.com/data/recitations.js`, entry 63:
`{"subfolder":"translations/urdu_shamshad_ali_khan_46kbps","name":"(Urdu)
Shamshad Ali Khan","bitrate":"46kbps"}`) — fetched fresh this session, not
recalled from memory. All 10 active (non-"unavailable") reciters in the
registry were re-verified against this same live fetch programmatically
before shipping (output captured in the implementation log). Also added a
`bitrate` field to every entry for the panel's quality display.

### Part 2 — Live Ayah synchronization

`AudioPlayerProvider` now exposes a derived `currentAyahRef` (parsed from
the internal `playingKey`). `ReaderView` uses it to:
- Highlight the actively-playing ayah with a distinct gold left-border
  accent, independent of (and combinable with) the existing manual-selection
  ring highlight.
- Gently auto-scroll only when the newly-playing ayah's bounding rect is
  close to leaving the viewport, using `scrollIntoView({behavior:"smooth"})`,
  triggered only on ayah *change* (not continuously) — never fights manual
  scrolling.
- Guard against cross-Surah confusion: since the audio provider lives above
  the reader route and keeps playing across Surah navigation, highlighting
  only applies when the currently-playing ayah's Surah matches the page
  currently being viewed.

### Part 3 — Meaning panel auto-sync

The panel's focus ayah is now `isAudioActive ? playingAyah : selectedAyah`
— while audio is playing/loading, Arabic + English + Urdu + Hifz status
controls all follow the currently-playing ayah automatically; once playback
stops/pauses, focus reverts to the user's manual selection. Fixed a real
bug this introduced: `AyahStatusControls` initializes its status from a
`useState(initialStatus)` that doesn't re-sync on prop changes, so without
a fix, auto-advancing to a new ayah would leave stale Hifz-status buttons
displayed. Fixed by keying `AyahToolsPanel` on the focused ayah's id
(forces a correct remount on every ayah change) rather than touching the
existing, working `AyahStatusControls` logic.

### Part 4/5 — Lesson repeat system, "total plays" semantics

Added `REPEAT_PRESETS = [1,2,3,5,7,11,21,31,51]` and a `RepeatPresetPicker`.
Repeat count N means the selected unit (one ayah, "from here" range, or
full Surah) plays **exactly N times total** — implemented in
`AudioPlayerProvider.startRepeatedQueue` by literally concatenating the
unit N times into the queue, so advancement is always just "next queue
item," with no separate iteration counter to drift out of sync. Progress
is computed from queue position: `Playing X / N` for single-ayah repeats,
`Round X / N` for multi-ayah units.

### Part 6/9 — State model, controls, race-condition guards

Kept the existing single shared `<audio>` element as the sole source of
truth (per the constraint). Introduced a `playTokenRef` incremented on
every new play request, reciter switch, stop, and unmount — any
in-flight `audio.play()` promise or queue-advance whose token has since
been superseded is discarded rather than allowed to corrupt state. This
directly addresses: rapid repeated Play clicks, changing reciter while
loading, and component unmount during playback (cleanup increments the
token and tears down the `<audio>` element). `selectedAyah` (`ReaderView`)
and playback state (`AudioPlayerProvider`) remain intentionally separate —
selecting a different ayah never touches the active queue.

### Verified vs. not verified

**Verified:** `npx tsc --noEmit` clean on a forced non-incremental run; grep
confirmed no dangling references to the removed/old APIs; `next build`
compiled successfully with full type-checking passed, stopping at the same
pre-existing sandbox-only Prisma engine limitation as every prior session
(confirmed working on your machine); every active reciter `providerId`
cross-checked against a live fetch obtained this session.

**Not verified (requires your browser):** actual scroll-following feel,
whether the gold highlight reads as intended in light/dark mode, real
audio playback/transitions, and one-handed mobile usability of the Lesson
panel. Please run through this phase's flows and tell me what you
actually see/hear.


### Reader layout

Selected-Ayah controls no longer expand below the Quran text. Extracted
into `src/components/quran/AyahToolsPanel.tsx`, shown two ways:

- **Desktop (lg+):** sticky right-side panel (`ReaderView.tsx`, CSS grid
  `1fr / 320px`), its own internal scroll, never covers or shrinks the
  reading column.
- **Mobile:** a floating "Ayah Tools" button appears only when an ayah is
  selected; tapping it opens an accessible bottom-sheet drawer
  (`AyahToolsDrawer.tsx` — Escape key, backdrop click, `role="dialog"`).
  Closing it returns to full-width reading.

Preserved: `?ayah=` deep links, Hifz status persistence, selected-ayah
state when opening/closing the panel, dark mode, Quran Reading Mode.

### Audio: new controls + expanded reciters

`AudioPlayerProvider` gained sequence playback (`playSequence`,
`repeatCurrent`) while keeping the single shared `<audio>` element and
no-overlap guarantee. The panel now offers: Play, Pause/Resume, Stop,
Repeat, Play from here, Play full Surah.

**Reciter registry** (`quranAudioService.ts`) expanded from 3 to 11
entries. Every non-"unavailable" `providerId` below was checked against
everyayah.com's own live, machine-readable index
(`https://www.everyayah.com/data/recitations.js`) — fetched directly and
diffed programmatically against the shipped registry before this was
written, not assumed:

| Reciter | Status |
|---|---|
| Mishary Rashid Alafasy | ✅ verified (`Alafasy_128kbps`) |
| Saud Al-Shuraim | ✅ verified (`Saood_ash-Shuraym_128kbps`) |
| Abdul Rahman Al-Sudais | ✅ verified (`Abdurrahmaan_As-Sudais_192kbps`) |
| Yasir Al-Dosari | ✅ verified (`Yasser_Ad-Dussary_128kbps`) |
| Maher Al-Muaiqly | ✅ verified (`MaherAlMuaiqly128kbps`) |
| Saad Al-Ghamdi | ✅ verified (`Ghamadi_40kbps` — only bitrate available, lower quality than the rest) |
| Abu Bakr Al-Shatri | ✅ verified (`Abu_Bakr_Ash-Shaatree_128kbps`) |
| Ahmed Al-Ajmi | ✅ verified (`ahmed_ibn_ali_al_ajamy_128kbps`) |
| Abdul Basit Abdus Samad | ✅ verified (`Abdul_Basit_Murattal_192kbps`) |
| Bandar Baleela | ❌ not found on everyayah.com — registered `provider: "unavailable"`, no URL guessed |
| Saud Al Jumuah | ❌ not found — same treatment (carried over from the earlier reciter task) |

### Translations: added Urdu alongside English

Reused `quran-json`'s bundled `quran_ur.json` (Abul A'la Maududi, via
tanzil.net, CC-BY-SA 4.0 — verified against the package's own README
before use). `TranslationSource`/`AyahTranslation` already supported
multiple languages by design, so this needed zero schema changes — only
`scripts/import-quran/index.ts` was extended to loop over both language
sources.

**After pulling this update:**
```bash
npm run import:quran   # re-import to pick up the Urdu translation
```
(Existing English translations, Quran text, Hifz progress, and the
Mutashabihat index are untouched.)


### Previous limitation (root cause)

The scorer computed 2-gram Jaccard similarity over each ayah's **entire**
token sequence. That only rewards near-total whole-ayah overlap — a
meaningful phrase embedded in a longer ayah scored low and got filtered by
the similarity threshold, while short, verbatim-repeated ayahs (Ar-Rahman's
refrain) scored ~1.0 and dominated every result set. Candidate *retrieval*
already searched the full Quran via an inverted index — the limitation was
entirely in scoring/ranking.

### What changed

- **Phrase-level scoring** (`src/utils/phraseMatch.ts` + rewritten
  `scripts/build-mutashabihat-index/index.ts`): finds the longest common
  *contiguous* phrase between two ayahs and scores by how much of each ayah
  that phrase covers, instead of whole-ayah similarity. Candidate generation
  now unions 3-gram and 4-gram inverted indexes (previously 4-gram only) so
  shorter meaningful phrases aren't missed at retrieval.
- **Diversity-capped ranking**: identical/near-identical phrase repeats
  (e.g. a 31×-repeated refrain) are capped at 3 shown occurrences per
  source ayah, so one dominant phrase can't crowd out other genuine matches.
- **8 evidence-based categories** (up from 5): `EXACT_FULL_AYAH`,
  `EXACT_PHRASE`, `NEAR_EXACT_PHRASE`, `SIMILAR_BEGINNING`,
  `SIMILAR_ENDING`, `SIMILAR_MIDDLE_PHRASE`, `SIMILAR_STRUCTURE`,
  `CONTEXTUAL` — every category is derived from actual phrase-position/
  coverage data, never assigned arbitrarily.
- **Context**: every result shows the previous/current/next ayah for both
  the selected and matched location (`getAyahContext` in `quranService.ts`),
  correctly stopping at Surah boundaries rather than crossing them.
- **Phrase highlighting on real Quran text**: matched phrases are
  highlighted on the actual Uthmani text, never on the normalized/search
  text — verified safe by checking that original-text and normalized-text
  tokenization stay 1:1 aligned across all 6236 ayahs before relying on it
  (`src/utils/highlightPhrase.ts`).
- **Translation support** (`AyahTranslation` / `TranslationSource` in the
  schema, `src/services/translationService.ts`): reused the English
  translation already bundled in the `quran-json` package we depend on —
  Saheeh International (Umm Muhammad), sourced from tanzil.net, CC-BY-SA
  4.0, imported verbatim (no AI generation or paraphrasing). Kept in a
  table fully separate from `Ayah`, provider-based like the audio system,
  never rendered as if it were Quran text.
- **Grouped, explained results UI**: `/mutashabihat` now groups matches by
  category and shows context + highlighted phrase + translation + a
  generated-from-real-data explanation for each; `/mutashabihat/compare`
  combines phrase-boundary highlighting with the existing word-level diff.

### Verified against real data before shipping

- 2:255 (Ayat al-Kursi): old scorer found 0 matches; new scorer finds 20
  real cross-Surah phrase matches (shared opening with 3:2, 20:8, 27:26,
  42:4, ...).
- 55:13 (Ar-Rahman refrain, repeated 31x): capped to 3 diverse occurrences
  instead of dominating.
- Full-Quran indexing (6236 ayahs): ~0.6s.
- Original/normalized tokenization alignment (required for safe phrase
  highlighting): 6236/6236 ayahs match exactly, 0 mismatches.
- The shipped `classify()` logic in the index-build script was diffed
  line-for-line against the algorithm validated in a standalone prototype
  run against the real dataset — identical.

### Known remaining limitation

Single-token ayahs (e.g. the disjointed-letter openings like "الم") can
never produce a 3-word phrase match by construction, since the minimum
phrase length is 3 tokens. Traditional tafsir treats these Muqatta'at as
related to each other, but this deterministic phrase-matcher doesn't
capture that relationship — flagging honestly rather than papering over it.

**After pulling this update, rebuild the index and re-import translations:**
```bash
npm run import:quran
npm run build:mutashabihat-index
```


### Mutashabihat Finder — root cause & fix

The Mutashabihat index was silently ending up empty. Root cause:
`scripts/build-mutashabihat-index/index.ts` called `createMany({ ..., skipDuplicates: true })`
against the SQLite dev database — **`skipDuplicates` is not supported on SQLite**
(confirmed against Prisma's own docs: only PostgreSQL/MySQL/CockroachDB support it).
Every `createMany` call in the index builder therefore threw immediately, the
script exited non-zero, and `MutashabihatMatch` stayed empty even though
`npm run import:quran` succeeded.

Before touching any code, the matching algorithm itself was verified correct:
the real `src/utils/arabicNormalize.ts` and the real indexing/query logic were
run against the real Quran text (all 6236 ayahs). Ar-Rahman 55:13 (the
31×-repeated refrain) correctly found 8 matches at 100% similarity; Ayat
al-Kursi 2:255 correctly found 0 matches (genuinely distinctive wording, not a
bug). That confirmed the bug was in the index-write path, not the algorithm.

**Fix:** removed `skipDuplicates` from both `createMany` calls and added an
in-run `Set`-based duplicate guard instead (verified against the full real
Quran dataset to produce zero unique-constraint conflicts, so this is a
behavior-neutral, cross-database-safe change — works identically on SQLite
and Postgres). One file changed: `scripts/build-mutashabihat-index/index.ts`.

Also added, per the requirement that a real failure must never look like "no
matches": `loading.tsx` and `error.tsx` for both `/mutashabihat` and
`/mutashabihat/compare`.

**After pulling this update, rebuild the index:**
```bash
npm run build:mutashabihat-index
```

### Quran Reciters

Added a reciter selector and per-ayah audio player to the reader.

- **Provider:** everyayah.com (one MP3 file per ayah, no API key). Isolated
  behind `src/services/quranAudioService.ts` — nothing else in the app builds
  a Quran audio URL directly, so the provider can be swapped later without
  touching the player or UI.
- **Reciters wired up:**
  - Mishary Rashid → `Alafasy_128kbps` (verified live against everyayah.com's
    reciter listing)
  - Saud Al-Shuraim → `Saood_ash-Shuraym_128kbps` (verified live)
  - Saud Al Jumuah → **no verified per-ayah or per-surah audio source was
    found** for this reciter during this build. Rather than guess a URL, his
    entry is registered with `provider: "unavailable"`, so the player shows a
    clear "audio isn't available" message instead of failing silently or
    playing the wrong thing. Swap in a confirmed `providerId` in
    `quranAudioService.ts` once one is verified — no other file needs to change.
- **Player:** `src/features/audio-player/AudioPlayerProvider.tsx` — a single
  shared `<audio>` element (so starting a new ayah always stops the previous
  one; no overlapping audio), with Play/Pause/Resume/Stop and loading/error
  states, exposed via `useAudioPlayer()`.
- **Persistence:** reciter choice is saved to `localStorage`
  (`src/lib/reciterPreference.ts`), wrapped in try/catch so it never crashes
  if storage is unavailable, and defaults to Mishary Rashid if nothing is saved.
- **Scope:** the provider lives in `src/app/reader/layout.tsx`, so the
  selected reciter and playback state persist across Surah navigation
  without a full page reload.

Building on Phase 1, this adds **Hifz progress tracking**:

- Functional Hifz status buttons in the reader's ayah action panel (Learning /
  Memorized / Needs Revision / Weak / Re-memorizing / Reset), backed by a
  server action, with inline saved/error feedback and no full page reloads
- `/hifz` — overall progress, per-Juz and per-Surah breakdown, weak-ayahs list
  — all computed live from the database, nothing hard-coded
- Dashboard now shows real Hifz Progress (overall %, status counts) with
  working **Continue Hifz** and **View My Hifz** buttons
- `/hifz/continue` — redirects to the most relevant next ayah (first
  `LEARNING` ayah, else first `NOT_STARTED` ayah past your current position,
  else the start of the Quran)
- A single progress-calculation service (`src/services/hifzProgressService.ts`)
  is the only place that computes percentages/counts — nothing duplicates
  this math

No schema changes were needed — Phase 1's `AyahStatus` model already fit
exactly. **No authentication exists yet** (that's Phase 8): progress is
currently tracked against one fixed local dev account
(`src/lib/auth.ts`, clearly labeled as temporary) so the service layer and UI
can be built and used today; swapping in real per-user sessions later won't
require changing any of the progress/service code, since every function
already takes a `userId`.

Per the phased build plan, this delivers:

- Project scaffold (Next.js 14 App Router + TypeScript + Tailwind + Prisma)
- Quran data model, cleanly separated into immutable reference data vs. personal
  user data (see `prisma/schema.prisma`)
- A real, licensed Quran dataset import (`scripts/import-quran`) — no invented
  Quranic text anywhere in this codebase
- A working Quran reader with Surah navigation and ayah selection
- A first working version of the Mutashabihat engine: a deterministic,
  explainable n-gram similarity indexer (`scripts/build-mutashabihat-index`)
  plus the Finder and side-by-side Compare UI (word-diff highlighting,
  Previous/Next Similar navigation)
- Basic keyword/phrase search over Quran text
- Light/dark mode, a distraction-reduced "Quran Reading Mode," RTL-correct
  Arabic rendering throughout

Everything else in the original spec (Hifz tracking, spaced-repetition revision,
mistake tracking, memorization modes, audio/recitation, auth, teacher/parent
dashboards, etc.) is intentionally **not yet built** — the architecture
(see "Project structure" below) is laid out so those phases can be added without
rewriting what's here.

## Data sources (see section 23, Data Integrity)

| Data | Source | License |
|---|---|---|
| Arabic text (Uthmani script), surah names, revelation type | [`quran-json`](https://github.com/risan/quran-json) (sourced from [The Noble Qur'an Encyclopedia](https://quranenc.com)) | MIT (code) |
| Juz / Hizb / Rub al-Hizb / Page / Sajdah metadata (Hafs/Madani mushaf) | [`quran-meta`](https://github.com/quran-center/quran-meta) | MIT |

The import script (`scripts/import-quran/index.ts`) verifies the dataset (114
surahs, exactly 6236 ayahs) before writing anything to the database, and records
full provenance — source URL, license, version, checksum — in the
`QuranDataset` table. If verification fails, it stops rather than guessing.

`Ayah.textUthmani` is the **only** field ever rendered as "the Quran text."
`Ayah.textSearchNormalized` is a separate field used purely for search/matching
and is never displayed (see `src/utils/arabicNormalize.ts`).

## Getting started

```bash
npm install
cp .env.example .env          # defaults to a local SQLite file, fine for dev
npm run setup                 # db:push + import Quran text + build Mutashabihat index
npm run dev
```

Then open http://localhost:3000.

> **Note:** `npm install` triggers Prisma's postinstall step, which downloads a
> small query-engine binary from `binaries.prisma.sh`. This requires normal
> outbound internet access — it was the one thing this sandbox's restricted
> network couldn't reach, so full runtime verification happened up to (but not
> including) that step here. Everything else — the build, all type-checking,
> the app logic — was verified in this sandbox.

Individual setup steps, if you'd rather run them one at a time:

```bash
npm run db:push                    # create the SQLite schema
npm run import:quran               # import Quran text + mushaf metadata
npm run build:mutashabihat-index   # compute similar-ayah matches
```

To switch to Postgres for production, change `DATABASE_URL` in `.env` and the
`provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`, then rerun
`npm run setup`.

## Project structure

```
prisma/schema.prisma        Data model (Quran reference data vs. user data)
scripts/
  import-quran/              Pulls trusted Quran data, seeds the DB
  build-mutashabihat-index/  Precomputes similar-ayah matches (n-gram + Jaccard)
src/
  app/                       Next.js routes (dashboard, reader, mutashabihat, search, API)
  components/                Reusable UI (layout, quran-specific widgets)
  features/                  Feature-level UI logic (quran-reader today; hifz-tracking,
                              revision, mutashabihat dirs are scaffolded for later phases)
  services/                  Data-access layer — the only code that queries Quran tables
  lib/                       Prisma client singleton
  types/                     Shared TypeScript types
  utils/                     Arabic normalization (search-only), ayah word-diff
```

## Roadmap (unbuilt phases, architecture-ready)

2. Hifz progress tracking (`AyahStatus`, `RevisionStreak` models already exist)
3. Revision & mistake tracking (`RevisionSession`, `RevisionEntry`, `Mistake`,
   `Note` models already exist)
4. Deeper Mutashabihat indexing (TF-IDF / embeddings layered onto the current
   deterministic baseline)
5. Richer Mutashabihat comparison UI (grammatical-structure comparison)
6. Memorization modes (Hide Ayah, Hide Words, Recall Mode, Sequential Recall)
7. Audio/recitation architecture (reciter selection, repeat/loop controls —
   no bundled audio without proper licensing)
8. Speech-recognition-assisted recitation feedback, clearly labeled as
   "AI-assisted recitation feedback," never presented as equivalent to a
   qualified Qari/teacher
9. Authentication + cloud persistence (`User.passwordHash` is reserved for a
   salted hash only — never plaintext)
10. Polish, accessibility, and the "future features" list from the spec
    (teacher dashboard, parent dashboard, offline access, multiple
    translations/reciters, Tajweed assistance, etc.)
