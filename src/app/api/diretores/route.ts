import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencia = searchParams.get("agencia") || "ARTESP";

    const client = getServiceClient() || supabase;
    if (!client) {
      return NextResponse.json({ diretores: [] });
    }

    // Fetch directors
    const { data: directors, error: dirError } = await client
      .from("directors")
      .select("*")
      .eq("agency", agencia)
      .order("mandate_start", { ascending: false });

    if (dirError) throw dirError;

    if (!directors || directors.length === 0) {
      return NextResponse.json({ diretores: [], agencia });
    }

    // Fetch votes for all directors in this agency
    const directorIds = directors.map((d: { id: string }) => d.id);

    const { data: votes } = await client
      .from("votes")
      .select("director_id, vote_type, deliberacao_id")
      .in("director_id", directorIds);

    // Fetch deliberacoes to determine pauta_interna vs external
    const { data: deliberacoes } = await client
      .from("deliberacoes_extraidas")
      .select("id, microtema, pauta_interna, agencia")
      .eq("agencia", agencia);

    const deliberacoesMap = new Map(
      (deliberacoes || []).map((d: { id: string; microtema: string; pauta_interna: boolean }) => [d.id, d])
    );

    const now = new Date();

    const diretores = directors.map((dir: {
      id: string;
      name: string;
      role: string;
      agency: string;
      is_active: boolean;
      mandate_start: string;
      mandate_end: string;
    }) => {
      const dirVotes = (votes || []).filter(
        (v: { director_id: string }) => v.director_id === dir.id
      );

      const voteBreakdown = {
        FAVORABLE: 0,
        AGAINST: 0,
        ABSTENTION: 0,
        ABSENT: 0,
      };

      let colegiado = 0;
      let divergente = 0;

      dirVotes.forEach((v: { vote_type: string; deliberacao_id: string }) => {
        const type = v.vote_type as keyof typeof voteBreakdown;
        if (type in voteBreakdown) voteBreakdown[type]++;

        // Count colegiado (voted with majority — simplified: FAVORABLE)
        if (v.vote_type === "FAVORABLE") colegiado++;
        if (v.vote_type === "AGAINST") divergente++;
      });

      // Votes by microtema
      const temaCount: Record<string, number> = {};
      dirVotes.forEach((v: { deliberacao_id: string }) => {
        const delib = deliberacoesMap.get(v.deliberacao_id);
        if (delib?.microtema) {
          temaCount[delib.microtema] = (temaCount[delib.microtema] || 0) + 1;
        }
      });

      const votosPorTema = Object.entries(temaCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tema, total]) => ({ tema, total }));

      // Mandate progress
      const start = dir.mandate_start ? new Date(dir.mandate_start) : null;
      const end = dir.mandate_end ? new Date(dir.mandate_end) : null;
      let mandatoPercent = 0;
      if (start && end && end > start) {
        const total = end.getTime() - start.getTime();
        const elapsed = Math.min(now.getTime() - start.getTime(), total);
        mandatoPercent = Math.round((elapsed / total) * 100);
      }

      return {
        id: dir.id,
        nome: dir.name,
        cargo: dir.role,
        agencia: dir.agency,
        ativo: dir.is_active,
        mandato_inicio: dir.mandate_start,
        mandato_fim: dir.mandate_end,
        mandato_percent: Math.max(0, Math.min(100, mandatoPercent)),
        participacoes: dirVotes.length,
        votos: voteBreakdown,
        colegiado,
        divergente,
        votos_por_tema: votosPorTema,
      };
    });

    return NextResponse.json({ diretores, agencia: agencia });
  } catch (err) {
    console.error("[diretores]", err);
    return NextResponse.json({ diretores: [], error: String(err) });
  }
}
