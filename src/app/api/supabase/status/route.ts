import { NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const client = getServiceClient() || supabase;
    if (!client) return NextResponse.json({ connected: false, message: "Supabase not configured" });

    const { count, error } = await client
      .from("deliberacoes_extraidas")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json({ connected: true, totalDeliberacoes: count || 0 });
  } catch (err) {
    return NextResponse.json({ connected: false, message: String(err) });
  }
}
