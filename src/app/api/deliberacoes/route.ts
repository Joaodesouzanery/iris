import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const microtema = searchParams.get("microtema");
    const resultado = searchParams.get("resultado");
    const reuniao = searchParams.get("reuniao");
    const diretor = searchParams.get("diretor");
    const agencia = searchParams.get("agencia");
    const ano = searchParams.get("ano");
    const dataInicio = searchParams.get("data_inicio");
    const dataFim = searchParams.get("data_fim");
    const pautaExterna = searchParams.get("pauta_externa");
    const busca = searchParams.get("busca");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = Math.min(parseInt(searchParams.get("per_page") || "50", 10), 200);

    const client = getServiceClient() || supabase;
    if (!client) {
      return NextResponse.json({ total: 0, deliberacoes: [] });
    }

    let query = client
      .from("deliberacoes_extraidas")
      .select("*", { count: "exact" })
      .order("data_reuniao", { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (microtema) query = query.eq("microtema", microtema);
    if (resultado) query = query.eq("decisao", resultado);
    if (reuniao) query = query.eq("numero_reuniao", reuniao);
    if (agencia) query = query.eq("agencia", agencia);
    if (ano) query = query.gte("data_reuniao", `${ano}-01-01`).lte("data_reuniao", `${ano}-12-31`);
    if (dataInicio) query = query.gte("data_reuniao", dataInicio);
    if (dataFim) query = query.lte("data_reuniao", dataFim);
    if (pautaExterna === "true") query = query.eq("pauta_interna", false);
    if (busca) query = query.or(`interessado.ilike.%${busca}%,processo.ilike.%${busca}%,resumo_pleito.ilike.%${busca}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    const deliberacoes = (data || []).map((d) => ({
      id: d.id,
      pdf_nome: d.link_pdf || "",
      numero_deliberacao: d.processo || "",
      reuniao_ordinaria: d.numero_reuniao || "",
      data_reuniao: d.data_reuniao || "",
      agencia: d.agencia || "ARTESP",
      interessado: d.interessado || "",
      processo: d.processo || "",
      classificacao: d.pauta_interna
        ? "Pauta Interna da Agência"
        : "Pleito Externo",
      microtema: d.microtema || "",
      resultado: d.decisao || "",
      votos_a_favor: d.votos_favoraveis || [],
      votos_contra: d.votos_contrarios || [],
      resumo_pleito: d.resumo_pleito || "",
      fundamento_decisao: d.fundamento_decisao || "",
    }));

    let filtered = deliberacoes;
    if (diretor) {
      filtered = filtered.filter((d) =>
        [...(d.votos_a_favor || []), ...(d.votos_contra || [])].some((v) =>
          String(v).includes(diretor)
        )
      );
    }

    return NextResponse.json({
      total: count ?? filtered.length,
      page,
      per_page: perPage,
      deliberacoes: filtered,
    });
  } catch (err) {
    console.error("[deliberacoes]", err);
    return NextResponse.json({ total: 0, deliberacoes: [] });
  }
}
