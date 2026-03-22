import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    platform: "vercel",
    timestamp: new Date().toISOString(),
  });
}
