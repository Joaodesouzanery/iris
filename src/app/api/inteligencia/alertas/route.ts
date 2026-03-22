import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ alertas: [] });
}

export async function POST() {
  return NextResponse.json({ sucesso: true });
}
