import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nome = searchParams.get("nome");
    const agencia = searchParams.get("agencia") || "ARTESP";

    if (!nome) {
      return NextResponse.json({ error: "nome is required" }, { status: 400 });
    }

    const client = getServiceClient() || supabase;
    if (!client) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    // Find director
    const { data: directors } = await client
      .from("directors")
      .select("*")
      .eq("agency", agencia)
      .ilike("name", `%${nome}%`)
      .limit(1);

    const director = directors?.[0];
    if (!director) {
      return NextResponse.json({ error: "Director not found" }, { status: 404 });
    }

    // Fetch all votes for this director
    const { data: votes } = await client
      .from("votes")
      .select("vote_type, deliberacao_id, created_at")
      .eq("director_id", director.id);

    const deliberacaoIds = (votes || []).map((v: { deliberacao_id: string }) => v.deliberacao_id).filter(Boolean);

    let deliberacoes: Array<{
      id: string;
      microtema: string;
      pauta_interna: boolean;
      decisao: string;
      data_reuniao: string;
    }> = [];
    if (deliberacaoIds.length > 0) {
      const { data } = await client
        .from("deliberacoes_extraidas")
        .select("id, microtema, pauta_interna, decisao, data_reuniao")
        .in("id", deliberacaoIds);
      deliberacoes = data || [];
    }

    const deliberacoesMap = new Map(deliberacoes.map((d) => [d.id, d]));

    const totalVotos = (votes || []).length;
    let votosExternos = 0;
    let votosInternos = 0;
    let totalDeferidos = 0;
    let totalIndeferidos = 0;

    const temaCount: Record<string, number> = {};
    const tendenciaMensal: Record<string, { favoravel: number; contra: number }> = {};
    const divergentes: Array<{ deliberacao_id: string; data: string; microtema: string }> = [];

    (votes || []).forEach((v: { vote_type: string; deliberacao_id: string }) => {
      const delib = deliberacoesMap.get(v.deliberacao_id);
      if (!delib) return;

      if (delib.pauta_interna) votosInternos++;
      else votosExternos++;

      if (delib.decisao === "DEFERIDO" || delib.decisao === "APROVADO") totalDeferidos++;
      if (delib.decisao === "INDEFERIDO") totalIndeferidos++;

      if (delib.microtema) {
        temaCount[delib.microtema] = (temaCount[delib.microtema] || 0) + 1;
      }

      if (delib.data_reuniao) {
        const mes = delib.data_reuniao.substring(0, 7); // YYYY-MM
        if (!tendenciaMensal[mes]) tendenciaMensal[mes] = { favoravel: 0, contra: 0 };
        if (v.vote_type === "FAVORABLE") tendenciaMensal[mes].favoravel++;
        if (v.vote_type === "AGAINST") {
          tendenciaMensal[mes].contra++;
          divergentes.push({
            deliberacao_id: v.deliberacao_id,
            data: delib.data_reuniao,
            microtema: delib.microtema || "",
          });
        }
      }
    });

    const topTemas = Object.entries(temaCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tema, total]) => ({ tema, total }));

    const tendencia = Object.entries(tendenciaMensal)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, data]) => ({ mes, ...data }));

    return NextResponse.json({
      diretor: {
        id: director.id,
        nome: director.name,
        cargo: director.role,
        agencia: director.agency,
        ativo: director.is_active,
        mandato_inicio: director.mandate_start,
        mandato_fim: director.mandate_end,
      },
      metricas: {
        total_votos: totalVotos,
        votos_externos: votosExternos,
        votos_internos: votosInternos,
        pct_externos: totalVotos > 0 ? Math.round((votosExternos / totalVotos) * 100) : 0,
        pct_internos: totalVotos > 0 ? Math.round((votosInternos / totalVotos) * 100) : 0,
        total_deferidos: totalDeferidos,
        total_indeferidos: totalIndeferidos,
        taxa_deferimento:
          totalDeferidos + totalIndeferidos > 0
            ? Math.round((totalDeferidos / (totalDeferidos + totalIndeferidos)) * 100)
            : 0,
        total_divergentes: divergentes.length,
      },
      top_temas: topTemas,
      tendencia_mensal: tendencia,
      votos_divergentes: divergentes.slice(0, 20),
    });
  } catch (err) {
    console.error("[metricas/diretor-detalhe]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
