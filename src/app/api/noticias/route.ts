import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ total: 0, noticias: [], status: "sem_backend" });
}
