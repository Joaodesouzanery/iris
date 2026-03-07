"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Eye,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  ClipboardPaste,
} from "lucide-react";

interface AnaliseResult {
  success: boolean;
  arquivo?: string;
  tamanho?: number;
  textLength?: number;
  tamanhoTexto?: number;
  analise: {
    tipo: string;
    tipoConfianca: number;
    decisao: string;
    decisaoConfianca: number;
    microtema: string;
    microtemaConfianca: number;
    confiancaGeral: number;
    tipoVotacao?: string;
    diretores?: string[];
    votos?: Array<{ diretor: string; voto: string }>;
    resumoVotos?: { favoraveis: number; contrarios: number; abstencoes: number };
    processos?: string[];
    numeroDeliberacao?: string | null;
  };
  deliberacoes: Array<{
    numero: string;
    resultado: string;
    microtema: string;
    interessado: string;
    processo: string;
    votos?: Array<{ diretor: string; voto: string }>;
  }>;
  textoPreview?: string;
  error?: string;
}

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnaliseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "text">("upload");
  const [textInput, setTextInput] = useState("");

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/pdf-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao processar PDF");
        return;
      }

      setResult(data);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTextAnalysis = useCallback(async () => {
    if (textInput.length < 20) {
      setError("O texto deve ter pelo menos 20 caracteres");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/pdf-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: textInput, agencia: "ARTESP" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao analisar texto");
        return;
      }

      setResult(data);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [textInput]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-white font-mono">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-[#8B5CF6]" />
            <span className="font-bold text-lg">IRIS</span>
            <span className="text-[#6B7280]">/</span>
            <span className="text-[#8B5CF6]">Upload & Análise de PDFs</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </a>
            <a
              href="/"
              className="text-sm text-[#A1A1AA] hover:text-white transition-colors"
            >
              Site
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => { setMode("upload"); setResult(null); setError(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              mode === "upload"
                ? "bg-[#8B5CF6] text-white"
                : "bg-white/5 text-[#A1A1AA] hover:text-white border border-white/10"
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload PDF
          </button>
          <button
            onClick={() => { setMode("text"); setResult(null); setError(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              mode === "text"
                ? "bg-[#8B5CF6] text-white"
                : "bg-white/5 text-[#A1A1AA] hover:text-white border border-white/10"
            }`}
          >
            <ClipboardPaste className="w-4 h-4 inline mr-2" />
            Colar Texto
          </button>
        </div>

        {/* Upload Area */}
        {mode === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging
                ? "border-[#8B5CF6] bg-[#8B5CF6]/10"
                : "border-white/10 hover:border-white/20 bg-[#111113]"
            }`}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-[#6B7280]" />
            <p className="text-lg mb-2">Arraste um PDF aqui</p>
            <p className="text-sm text-[#6B7280] mb-4">ou clique para selecionar</p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <p className="text-xs text-[#52525B]">Máximo: 20MB | Apenas PDFs com texto (não escaneados)</p>
          </div>
        )}

        {/* Text Input Area */}
        {mode === "text" && (
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Cole aqui o texto da deliberação ou ata de reunião para análise..."
              className="w-full h-64 bg-[#111113] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-[#6B7280] resize-none focus:outline-none focus:border-[#8B5CF6]/50 font-mono"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B7280]">{textInput.length} caracteres</span>
              <button
                onClick={handleTextAnalysis}
                disabled={isLoading || textInput.length < 20}
                className="px-6 py-2 bg-[#8B5CF6] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7C3AED] transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 inline mr-2 animate-spin" />Analisando...</>
                ) : (
                  "Analisar Texto"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && mode === "upload" && (
          <div className="bg-[#111113] border border-white/10 rounded-xl p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#8B5CF6]" />
            <p className="text-sm text-[#A1A1AA]">Processando PDF com IA regulatória...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[#EF4444]">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="cursor-pointer">
              <X className="w-4 h-4 text-[#EF4444]" />
            </button>
          </div>
        )}

        {/* Results */}
        {result && result.success && (
          <div className="space-y-4">
            {/* Success Header */}
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#22C55E]" />
              <div>
                <p className="text-sm font-bold text-[#22C55E]">Análise concluída</p>
                <p className="text-xs text-[#A1A1AA]">
                  {result.arquivo ? `${result.arquivo} — ` : ""}
                  {result.textLength || result.tamanhoTexto} caracteres extraídos
                  {result.deliberacoes?.length > 0 && ` — ${result.deliberacoes.length} deliberação(ões) encontrada(s)`}
                </p>
              </div>
            </div>

            {/* Classification */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ResultCard
                label="Tipo"
                value={result.analise.tipo}
                confidence={result.analise.tipoConfianca}
              />
              <ResultCard
                label="Decisão"
                value={result.analise.decisao}
                confidence={result.analise.decisaoConfianca}
                valueColor={
                  result.analise.decisao === "Deferido"
                    ? "text-[#22C55E]"
                    : result.analise.decisao === "Indeferido"
                    ? "text-[#EF4444]"
                    : "text-[#F59E0B]"
                }
              />
              <ResultCard
                label="Microtema"
                value={result.analise.microtema}
                confidence={result.analise.microtemaConfianca}
              />
            </div>

            {/* Confidence Bar */}
            <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6B7280] uppercase">Confiança Geral</span>
                <span className="text-sm font-bold">{result.analise.confiancaGeral}%</span>
              </div>
              <div className="h-2 bg-[#1A1A1F] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${result.analise.confiancaGeral}%`,
                    backgroundColor:
                      result.analise.confiancaGeral >= 70
                        ? "#22C55E"
                        : result.analise.confiancaGeral >= 40
                        ? "#F59E0B"
                        : "#EF4444",
                  }}
                />
              </div>
            </div>

            {/* Votes */}
            {result.analise.votos && result.analise.votos.length > 0 && (
              <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider">Votação</h3>
                {result.analise.tipoVotacao && (
                  <p className="text-xs text-[#A1A1AA] mb-3">Tipo: {result.analise.tipoVotacao}</p>
                )}
                <div className="space-y-2">
                  {result.analise.votos.map((v, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-[#A1A1AA]">{v.diretor}</span>
                      <span
                        className={
                          v.voto.toLowerCase().includes("favorável")
                            ? "text-[#22C55E]"
                            : v.voto.toLowerCase().includes("contrário")
                            ? "text-[#EF4444]"
                            : "text-[#F59E0B]"
                        }
                      >
                        {v.voto}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deliberations */}
            {result.deliberacoes && result.deliberacoes.length > 0 && (
              <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider">
                  Deliberações Extraídas ({result.deliberacoes.length})
                </h3>
                <div className="space-y-3">
                  {result.deliberacoes.map((d, i) => (
                    <div key={i} className="p-3 bg-[#1A1A1F] rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-[#8B5CF6]" />
                        <span className="text-sm font-bold">{d.numero || `Deliberação ${i + 1}`}</span>
                        {d.resultado && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              d.resultado.toLowerCase().includes("defer")
                                ? "text-[#22C55E] bg-[#22C55E]/10"
                                : "text-[#EF4444] bg-[#EF4444]/10"
                            }`}
                          >
                            {d.resultado}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-[#A1A1AA]">
                        {d.microtema && <span>Tema: {d.microtema}</span>}
                        {d.interessado && <span>Interessado: {d.interessado}</span>}
                        {d.processo && <span>Processo: {d.processo}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processes found */}
            {result.analise.processos && result.analise.processos.length > 0 && (
              <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider">Processos Identificados</h3>
                <div className="flex flex-wrap gap-2">
                  {result.analise.processos.map((p, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs font-mono bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 rounded-lg"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Text Preview */}
            {result.textoPreview && (
              <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider">Preview do Texto Extraído</h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">
                  {result.textoPreview}...
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ResultCard({
  label,
  value,
  confidence,
  valueColor = "text-white",
}: {
  label: string;
  value: string;
  confidence: number;
  valueColor?: string;
}) {
  return (
    <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
      <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${valueColor}`}>{value || "N/A"}</p>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1 bg-[#1A1A1F] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${confidence}%`,
              backgroundColor: confidence >= 70 ? "#22C55E" : confidence >= 40 ? "#F59E0B" : "#EF4444",
            }}
          />
        </div>
        <span className="text-xs text-[#6B7280]">{confidence}%</span>
      </div>
    </div>
  );
}
