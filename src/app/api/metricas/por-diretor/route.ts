import { NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const client = getServiceClient() || supabase;
    if (!client) return NextResponse.json({ diretores: [] });

    const { data, error } = await client
      .from("deliberacoes_extraidas")
      .select("decisao, pauta_interna, votos_favoraveis, votos_contrarios, microtema, data_reuniao");

    if (error) throw error;
    const deliberacoes = data || [];

    const diretoresMap: Record<string, {
      nome: string; total: number; deferidos: number; indeferidos: number;
      votosFavor: number; votosContra: number; microtemas: Set<string>;
    }> = {};

    deliberacoes.forEach((d) => {
      const isPauta = d.pauta_interna;
      const processDir = (nome: string, favor: boolean) => {
        if (!diretoresMap[nome]) {
          diretoresMap[nome] = { nome, total: 0, deferidos: 0, indeferidos: 0, votosFavor: 0, votosContra: 0, microtemas: new Set() };
        }
        diretoresMap[nome].total++;
        if (!isPauta) {
          if (d.decisao === "Deferido") diretoresMap[nome].deferidos++;
          if (d.decisao === "Indeferido") diretoresMap[nome].indeferidos++;
        }
        if (favor) diretoresMap[nome].votosFavor++;
        else diretoresMap[nome].votosContra++;
        if (d.microtema) diretoresMap[nome].microtemas.add(d.microtema);
      };
      (d.votos_favoraveis || []).forEach((v: string) => processDir(v, true));
      (d.votos_contrarios || []).forEach((v: string) => processDir(v, false));
    });

    const diretores = Object.values(diretoresMap).map((d) => ({
      ...d,
      microtemas: [...d.microtemas],
      taxaDeferimento: d.total > 0 ? Math.round((d.deferidos / d.total) * 100) : 0,
      taxaIndeferimento: d.total > 0 ? Math.round((d.indeferidos / d.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    return NextResponse.json({ diretores, totalDiretores: diretores.length });
  } catch (err) {
    console.error("[metricas/por-diretor]", err);
    return NextResponse.json({ diretores: [] });
  }
}
