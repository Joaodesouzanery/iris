import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencia = searchParams.get("agencia") || "ARTESP";

    const client = getServiceClient() || supabase;
    if (!client) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const { data: deliberacoes, error } = await client
      .from("deliberacoes_extraidas")
      .select("id, data_reuniao, numero_reuniao, pauta_interna, decisao, microtema")
      .eq("agencia", agencia)
      .order("data_reuniao", { ascending: true });

    if (error) throw error;

    const rows = deliberacoes || [];

    // Meetings per year
    const anoCount: Record<string, Set<string>> = {};
    const pautaInterna: Record<string, number> = {};
    const pautaExterna: Record<string, number> = {};

    rows.forEach((d: { data_reuniao: string; numero_reuniao: string; pauta_interna: boolean; decisao: string }) => {
      if (!d.data_reuniao) return;
      const ano = d.data_reuniao.substring(0, 4);
      if (!anoCount[ano]) anoCount[ano] = new Set();
      if (d.numero_reuniao) anoCount[ano].add(d.numero_reuniao);

      if (d.pauta_interna) {
        pautaInterna[ano] = (pautaInterna[ano] || 0) + 1;
      } else {
        pautaExterna[ano] = (pautaExterna[ano] || 0) + 1;
      }
    });

    const reunioesPorAno = Object.entries(anoCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ano, reunioes]) => ({
        ano,
        total_reunioes: reunioes.size,
        pauta_interna: pautaInterna[ano] || 0,
        pauta_externa: pautaExterna[ano] || 0,
      }));

    // Average interval between meetings (days)
    const meetingDates = rows
      .filter((d: { data_reuniao: string }) => d.data_reuniao)
      .map((d: { data_reuniao: string }) => new Date(d.data_reuniao).getTime())
      .sort((a: number, b: number) => a - b);

    let avgIntervalDays = 0;
    if (meetingDates.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < meetingDates.length; i++) {
        const diff = (meetingDates[i] - meetingDates[i - 1]) / (1000 * 60 * 60 * 24);
        if (diff > 0 && diff < 60) intervals.push(diff); // filter outliers
      }
      if (intervals.length > 0) {
        avgIntervalDays = Math.round(
          intervals.reduce((a, b) => a + b, 0) / intervals.length
        );
      }
    }

    // Totals
    const totalDeliberacoes = rows.length;
    const totalInterna = rows.filter((d: { pauta_interna: boolean }) => d.pauta_interna).length;
    const totalExterna = totalDeliberacoes - totalInterna;
    const pctInterna = totalDeliberacoes > 0 ? Math.round((totalInterna / totalDeliberacoes) * 100) : 0;

    // Normative acts (approximation: pauta_interna = true counts as normative)
    const atosNormativos = totalInterna;

    // Calendar data: group by month
    const calendarMap: Record<string, number> = {};
    rows.forEach((d: { data_reuniao: string }) => {
      if (!d.data_reuniao) return;
      const mes = d.data_reuniao.substring(0, 7);
      calendarMap[mes] = (calendarMap[mes] || 0) + 1;
    });

    const calendario = Object.entries(calendarMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, total]) => ({ mes, total }));

    return NextResponse.json({
      agencia,
      resumo: {
        total_deliberacoes: totalDeliberacoes,
        total_interna: totalInterna,
        total_externa: totalExterna,
        pct_interna: pctInterna,
        pct_externa: 100 - pctInterna,
        atos_normativos: atosNormativos,
        intervalo_medio_dias: avgIntervalDays,
      },
      reunioes_por_ano: reunioesPorAno,
      calendario,
    });
  } catch (err) {
    console.error("[metricas/institucional]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
