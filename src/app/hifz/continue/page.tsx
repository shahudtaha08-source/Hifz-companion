import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { getContinueHifzTarget } from "@/services/hifzProgressService";

export default async function ContinueHifzPage() {
  const userId = await getCurrentUserId();
  const target = await getContinueHifzTarget(userId);
  redirect(`/reader/${target.surahId}?ayah=${target.numberInSurah}`);
}
