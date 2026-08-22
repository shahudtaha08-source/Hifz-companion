import { db } from "@/lib/db";

/**
 * TEMPORARY, DEV-ONLY single-user resolver.
 *
 * There is no authentication yet (that's Phase 8). Rather than invent an
 * insecure login system to unblock Hifz tracking, every request in this
 * build resolves to one fixed local "student" account, upserted on first
 * use. This is explicitly NOT a security boundary — it's a placeholder so
 * the progress/service layer can be built against a real `userId` today.
 *
 * When Phase 8 lands: replace the body of `getCurrentUserId` with a call
 * into the real session/auth provider (e.g. reading a verified session
 * cookie). Every call site already takes a `userId` parameter, so nothing
 * downstream — services, server actions, pages — needs to change.
 */
const DEV_USER_EMAIL = "hifz-student@local.dev";

let cachedDevUserId: string | null = null;

export async function getCurrentUserId(): Promise<string> {
  if (cachedDevUserId) return cachedDevUserId;

  const user = await db.user.upsert({
    where: { email: DEV_USER_EMAIL },
    create: { email: DEV_USER_EMAIL, name: "Hifz Student" },
    update: {},
  });

  cachedDevUserId = user.id;
  return user.id;
}
