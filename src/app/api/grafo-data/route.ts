import { NextResponse } from "next/server";
import { getServiceClient, supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const client = getServiceClient() || supabase;
    if (!client) return NextResponse.json({ nodes: [], links: [] });

    const { data, error } = await client
      .from("deliberacoes_extraidas")
      .select("interessado, microtema, decisao, agencia, votos_favoraveis, votos_contrarios")
      .limit(300);

    if (error) throw error;
    const deliberacoes = data || [];

    const nodeMap = new Map<string, { id: string; label: string; type: string; size: number }>();
    const linkMap = new Map<string, { source: string; target: string; weight: number }>();

    const addNode = (id: string, label: string, type: string) => {
      if (!nodeMap.has(id)) nodeMap.set(id, { id, label, type, size: 1 });
      else nodeMap.get(id)!.size++;
    };

    deliberacoes.forEach((d) => {
      if (d.interessado) addNode(d.interessado, d.interessado, "empresa");
      if (d.microtema) addNode(d.microtema, d.microtema, "tema");
      if (d.interessado && d.microtema) {
        const key = `${d.interessado}__${d.microtema}`;
        if (!linkMap.has(key)) linkMap.set(key, { source: d.interessado, target: d.microtema, weight: 1 });
        else linkMap.get(key)!.weight++;
      }
      [...(d.votos_favoraveis || []), ...(d.votos_contrarios || [])].forEach((dir: string) => {
        addNode(dir, dir, "diretor");
        if (d.microtema) {
          const key = `${dir}__${d.microtema}`;
          if (!linkMap.has(key)) linkMap.set(key, { source: dir, target: d.microtema, weight: 1 });
          else linkMap.get(key)!.weight++;
        }
      });
    });

    return NextResponse.json({
      nodes: [...nodeMap.values()],
      links: [...linkMap.values()],
    });
  } catch (err) {
    console.error("[grafo-data]", err);
    return NextResponse.json({ nodes: [], links: [] });
  }
}
