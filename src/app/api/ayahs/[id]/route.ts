import { NextResponse } from "next/server";
import { getAyahById } from "@/services/quranService";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const ayah = await getAyahById(params.id);
    if (!ayah) {
      return NextResponse.json({ error: "Ayah not found" }, { status: 404 });
    }
    return NextResponse.json({ ayah });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
