import { NextResponse } from "next/server";
import { getAyahById, getMutashabihatForAyah } from "@/services/quranService";

export async function GET(req: Request, { params }: { params: { ayahId: string } }) {
  try {
    const ayah = await getAyahById(params.ayahId);
    if (!ayah) {
      return NextResponse.json({ error: "Ayah not found" }, { status: 404 });
    }
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 10) || 10, 50);
    const matches = await getMutashabihatForAyah(params.ayahId, limit);
    return NextResponse.json({ ayah, matches });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
