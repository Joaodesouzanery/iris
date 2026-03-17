import { NextRequest, NextResponse } from "next/server";
import { analyticsEventSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = analyticsEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    // Log analytics event (fire and forget)
    console.log("[ANALYTICS]", JSON.stringify(parsed.data));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Non-blocking
  }
}
