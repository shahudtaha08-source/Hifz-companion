"use server";

import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import type { HifzStatus } from "@/types/quran";

/** Statuses settable directly from the reader's action panel (section 2). */
const SETTABLE_STATUSES: HifzStatus[] = [
  "LEARNING",
  "MEMORIZED",
  "NEEDS_REVISION",
  "WEAK",
  "RE_MEMORIZING",
];

export interface SetAyahStatusResult {
  ok: boolean;
  status: HifzStatus | "NOT_STARTED";
  error?: string;
}

/**
 * Set (or clear, via "NOT_STARTED") the current user's Hifz status for one
 * ayah. Upsert-based, so calling this repeatedly with the same status is a
 * safe no-op rather than an error or a duplicate row (enforced additionally
 * by the `@@unique([userId, ayahId])` constraint on AyahStatus).
 *
 * The underlying Ayah/Surah/Quran-text rows are never touched — this only
 * ever writes to AyahStatus, which belongs to the user↔ayah relationship.
 */
export async function setAyahStatus(
  ayahId: string,
  status: HifzStatus | "NOT_STARTED"
): Promise<SetAyahStatusResult> {
  try {
    if (!ayahId || typeof ayahId !== "string") {
      return { ok: false, status, error: "Missing ayah." };
    }

    const ayah = await db.ayah.findUnique({ where: { id: ayahId }, select: { id: true } });
    if (!ayah) {
      return { ok: false, status, error: "That ayah could not be found." };
    }

    const userId = await getCurrentUserId();

    if (status === "NOT_STARTED") {
      // "Reset" — NOT_STARTED is never stored as a row (see
      // hifzProgressService's module comment), so resetting means deleting
      // any existing status.
      await db.ayahStatus.deleteMany({ where: { userId, ayahId } });
      return { ok: true, status: "NOT_STARTED" };
    }

    if (!SETTABLE_STATUSES.includes(status)) {
      return { ok: false, status, error: "Not a valid Hifz status." };
    }

    await db.ayahStatus.upsert({
      where: { userId_ayahId: { userId, ayahId } },
      create: { userId, ayahId, status },
      update: { status },
    });

    return { ok: true, status };
  } catch (err) {
    console.error("setAyahStatus failed:", err);
    return { ok: false, status, error: "Unable to save that right now. Please try again." };
  }
}
