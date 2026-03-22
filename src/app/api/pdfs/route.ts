import { NextResponse } from "next/server";

// File system not available on Vercel — returns empty list
export async function GET() {
  return NextResponse.json({ total: 0, pdfs: [] });
}
