import { NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const client = getServiceClient() || supabase;
    if (!client) {
      return NextResponse.json(emptyResumo());
    }

    const { data, error } = await client
      .from("deliberacoes_extraidas")
      .select("microtema, decisao, pauta_interna, votos_favoraveis, votos_contrarios");

    if (error) throw error;
    const deliberacoes = data || [];

    const deferidos = deliberacoes.filter((d) => d.decisao === "Deferido").length;
    const indeferidos = deliberacoes.filter((d) => d.decisao === "Indeferido").length;
    const pautaInterna = deliberacoes.filter((d) => d.pauta_interna).length;
    const microtemas = [...new Set(deliberacoes.map((d) => d.microtema).filter(Boolean))];

    const diretoresSet = new Set<string>();
    deliberacoes.forEach((d) => {
      (d.votos_favoraveis || []).forEach((v: string) => diretoresSet.add(v));
      (d.votos_contrarios || []).forEach((v: string) => diretoresSet.add(v));
    });

    return NextResponse.json({
      totalPdfs: 0,
      pdfsAnalisados: 0,
      percentualClassificado: 0,
      totalDeliberacoes: deliberacoes.length,
      deferidos,
      indeferidos,
      taxaDeferimento:
        deliberacoes.length > 0
          ? Math.round((deferidos / deliberacoes.length) * 100)
          : 0,
      pautaInterna,
      pautaExterna: deliberacoes.length - pautaInterna,
      microtemasIdentificados: microtemas.length,
      microtemas,
      diretoresMapeados: diretoresSet.size,
      diretores: [...diretoresSet],
      ultimaAtualizacao: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[metricas/resumo]", err);
    return NextResponse.json(emptyResumo());
  }
}

function emptyResumo() {
  return {
    totalPdfs: 0, pdfsAnalisados: 0, percentualClassificado: 0,
    totalDeliberacoes: 0, deferidos: 0, indeferidos: 0, taxaDeferimento: 0,
    pautaInterna: 0, pautaExterna: 0, microtemasIdentificados: 0,
    microtemas: [], diretoresMapeados: 0, diretores: [],
    ultimaAtualizacao: new Date().toISOString(),
  };
}
