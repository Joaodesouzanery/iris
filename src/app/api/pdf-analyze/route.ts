import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { texto, agencia } = body;

    if (!texto || typeof texto !== "string" || texto.length < 20) {
      return NextResponse.json(
        { error: "Texto deve ter pelo menos 20 caracteres" },
        { status: 400 }
      );
    }

    // Dynamic import of iris-core (CommonJS module)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const irisCore = require("../../../../iris-core");

    // Analyze text without saving to DB
    const analise = irisCore.analisarTexto(texto);

    // Extract structured deliberations
    const extracao = irisCore.extrairDeliberacoesEstruturadas(texto);

    return NextResponse.json({
      success: true,
      analise,
      deliberacoes: extracao?.deliberations || extracao?.deliberacoes || [],
      agencia: agencia || "ARTESP",
      tamanhoTexto: texto.length,
    });
  } catch (err) {
    console.error("[PDF-ANALYZE] Error:", err);
    return NextResponse.json(
      { error: "Erro ao analisar texto", details: String(err) },
      { status: 500 }
    );
  }
}
