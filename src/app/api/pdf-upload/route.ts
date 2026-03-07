import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Apenas arquivos PDF são aceitos" },
        { status: 400 }
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 20MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF using simple text extraction
    const texto = extractTextFromPDF(buffer);

    if (!texto || texto.length < 20) {
      return NextResponse.json(
        {
          error: "Não foi possível extrair texto do PDF. O arquivo pode ser escaneado (imagem) ou estar protegido.",
          textoExtraido: texto?.length || 0,
        },
        { status: 422 }
      );
    }

    // Analyze with iris-core
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const irisCore = require("../../../../iris-core");

    const analise = irisCore.analisarTexto(texto);
    const extracao = irisCore.extrairDeliberacoesEstruturadas(texto);

    return NextResponse.json({
      success: true,
      arquivo: file.name,
      tamanho: file.size,
      textLength: texto.length,
      analise,
      deliberacoes: extracao?.deliberations || extracao?.deliberacoes || [],
      textoPreview: texto.substring(0, 500),
    });
  } catch (err) {
    console.error("[PDF-UPLOAD] Error:", err);
    return NextResponse.json(
      { error: "Erro ao processar PDF", details: String(err) },
      { status: 500 }
    );
  }
}

/**
 * Simple PDF text extraction - extracts readable text from PDF buffer.
 * Works for text-based PDFs (not scanned images).
 */
function extractTextFromPDF(buffer: Buffer): string {
  const content = buffer.toString("latin1");
  const textParts: string[] = [];

  // Extract text between BT (begin text) and ET (end text) operators
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;

  while ((match = btEtRegex.exec(content)) !== null) {
    const block = match[1];
    // Extract text from Tj and TJ operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textParts.push(decodePDFString(tjMatch[1]));
    }

    // TJ operator (array of strings)
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const innerRegex = /\(([^)]*)\)/g;
      let inner;
      while ((inner = innerRegex.exec(tjArrMatch[1])) !== null) {
        textParts.push(decodePDFString(inner[1]));
      }
    }
  }

  // Also try stream-based text extraction
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  while ((match = streamRegex.exec(content)) !== null) {
    const stream = match[1];
    if (stream.includes("BT") && stream.includes("ET")) {
      const innerBtEt = /BT\s([\s\S]*?)ET/g;
      let innerMatch;
      while ((innerMatch = innerBtEt.exec(stream)) !== null) {
        const block = innerMatch[1];
        const tjRegex2 = /\(([^)]*)\)\s*Tj/g;
        let tj2;
        while ((tj2 = tjRegex2.exec(block)) !== null) {
          textParts.push(decodePDFString(tj2[1]));
        }
        const tjArr2 = /\[(.*?)\]\s*TJ/g;
        let ta2;
        while ((ta2 = tjArr2.exec(block)) !== null) {
          const innerRegex2 = /\(([^)]*)\)/g;
          let in2;
          while ((in2 = innerRegex2.exec(ta2[1])) !== null) {
            textParts.push(decodePDFString(in2[1]));
          }
        }
      }
    }
  }

  let text = textParts.join(" ");

  // Clean up
  text = text
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s/g, "$1\n")
    .trim();

  return text;
}

function decodePDFString(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}
