import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const microtema = searchParams.get("microtema");
    const resultado = searchParams.get("resultado");
    const reuniao = searchParams.get("reuniao");
    const diretor = searchParams.get("diretor");

    const client = getServiceClient() || supabase;
    if (!client) {
      return NextResponse.json({ total: 0, deliberacoes: [] });
    }

    let query = client
      .from("deliberacoes_extraidas")
      .select("*")
      .order("data_reuniao", { ascending: false })
      .limit(500);

    if (microtema) query = query.eq("microtema", microtema);
    if (resultado) query = query.eq("decisao", resultado);
    if (reuniao) query = query.eq("numero_reuniao", reuniao);

    const { data, error } = await query;
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

    return NextResponse.json({ total: filtered.length, deliberacoes: filtered });
  } catch (err) {
    console.error("[deliberacoes]", err);
    return NextResponse.json({ total: 0, deliberacoes: [] });
  }
}
