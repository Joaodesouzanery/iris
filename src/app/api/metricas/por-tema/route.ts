import { NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const client = getServiceClient() || supabase;
    if (!client) return NextResponse.json({ temas: [], totalTemas: 0 });

    const { data, error } = await client
      .from("deliberacoes_extraidas")
      .select("microtema, decisao, data_reuniao");

    if (error) throw error;
    const deliberacoes = data || [];

    const temasMap: Record<string, {
      tema: string; total: number; deferidos: number; indeferidos: number; porMes: Record<string, number>;
    }> = {};

    deliberacoes.forEach((d) => {
      const tema = d.microtema || "Não classificado";
      if (!temasMap[tema]) {
        temasMap[tema] = { tema, total: 0, deferidos: 0, indeferidos: 0, porMes: {} };
      }
      temasMap[tema].total++;
      if (d.decisao === "Deferido") temasMap[tema].deferidos++;
      if (d.decisao === "Indeferido") temasMap[tema].indeferidos++;
      const mes = d.data_reuniao ? d.data_reuniao.substring(0, 7) : "Sem data";
      temasMap[tema].porMes[mes] = (temasMap[tema].porMes[mes] || 0) + 1;
    });

    const temas = Object.values(temasMap).map((t) => ({
      ...t,
      taxaDeferimento: t.total > 0 ? Math.round((t.deferidos / t.total) * 100) : 0,
      taxaIndeferimento: t.total > 0 ? Math.round((t.indeferidos / t.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    const temaMaisDeferido = [...temas].sort((a, b) => b.taxaDeferimento - a.taxaDeferimento)[0] || null;
    const temaMaisIndeferido = [...temas].sort((a, b) => b.taxaIndeferimento - a.taxaIndeferimento)[0] || null;

    return NextResponse.json({ temas, temaMaisDeferido, temaMaisIndeferido, totalTemas: temas.length });
  } catch (err) {
    console.error("[metricas/por-tema]", err);
    return NextResponse.json({ temas: [], totalTemas: 0 });
  }
}
