import { NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const client = getServiceClient() || supabase;
    if (!client) return NextResponse.json({ exportadoEm: new Date().toISOString(), total: 0, deliberations: [] });

    const { data, error } = await client
      .from("deliberacoes_extraidas")
      .select("*")
      .order("data_reuniao", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      exportadoEm: new Date().toISOString(),
      total: (data || []).length,
      deliberations: data || [],
    });
  } catch (err) {
    console.error("[metricas/exportar]", err);
    return NextResponse.json({ exportadoEm: new Date().toISOString(), total: 0, deliberations: [] });
  }
}
