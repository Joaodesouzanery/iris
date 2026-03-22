import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ alertas: [], tendencias: [], status: "sem_backend" });
}
