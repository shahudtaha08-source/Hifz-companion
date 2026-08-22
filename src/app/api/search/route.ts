import { NextResponse } from "next/server";
import { searchAyahs } from "@/services/quranService";
import { normalizeForSearch } from "@/utils/arabicNormalize";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const results = await searchAyahs(normalizeForSearch(q));
    return NextResponse.json({ query: q, results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
