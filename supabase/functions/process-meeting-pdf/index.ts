import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// EDGE FUNCTION: process-meeting-pdf
// Processa PDFs de deliberacoes da ARTESP (1 PDF = 1 deliberacao)
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let reuniao_id: string | null = null;

  try {
    const { reuniao_id: rid, pdf_base64, link_pdf } = await req.json();
    reuniao_id = rid;

    if (!pdf_base64) {
      throw new Error('PDF nao fornecido');
    }

    console.log('[IRIS] Iniciando processamento de PDF...');

    // ========================================
    // ETAPA UNICA: Extrair e Classificar
    // ========================================
    await updateStatus(supabase, reuniao_id, 'processando', 30);

    const deliberacao = await processarPDF(pdf_base64);

    console.log('[IRIS] Deliberacao extraida:', deliberacao.numero_deliberacao);

    // ========================================
    // VERIFICAR DUPLICATA
    // ========================================
    await updateStatus(supabase, reuniao_id, 'verificando', 70);

    const { data: existe } = await supabase
      .from('deliberacoes_extraidas')
      .select('id')
      .eq('processo', deliberacao.numero_deliberacao)
      .eq('numero_reuniao', deliberacao.reuniao_ordinaria)
      .maybeSingle();

    if (existe) {
      console.log('[IRIS] Deliberacao duplicada, ignorando...');
      await updateStatus(supabase, reuniao_id, 'duplicado', 100);

      return new Response(JSON.stringify({
        success: true,
        duplicado: true,
        message: 'Deliberacao ja existe no banco'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========================================
    // SALVAR NO BANCO
    // ========================================
    await updateStatus(supabase, reuniao_id, 'salvando', 90);

    // Normalizar interessado (se contem ARTESP)
    const interessadoNormalizado = deliberacao.interessado?.toUpperCase().includes('ARTESP')
      ? 'ARTESP'
      : deliberacao.interessado;

    // Determinar tipo de deliberacao
    const isPautaInterna = deliberacao.classificacao === 'Pauta Interna da Agencia' ||
                          interessadoNormalizado === 'ARTESP';

    const registro = {
      reuniao_id,
      agencia: 'ARTESP',
      processo: deliberacao.numero_deliberacao,
      numero_reuniao: deliberacao.reuniao_ordinaria,
      data_reuniao: deliberacao.data_reuniao || null,
      interessado: interessadoNormalizado,
      microtema: deliberacao.microtema,
      decisao: deliberacao.resultado,
      tipo_deliberacao: isPautaInterna ? 'Ato Administrativo Interno' : 'Pleito Externo',
      pauta_interna: isPautaInterna,
      votos_favor: Array.isArray(deliberacao.votos_a_favor)
        ? deliberacao.votos_a_favor.join(', ')
        : deliberacao.votos_a_favor || null,
      votos_contra: Array.isArray(deliberacao.votos_contra)
        ? deliberacao.votos_contra.join(', ')
        : deliberacao.votos_contra || null,
      link_pdf: link_pdf || null,
      raw_data: {
        fonte: 'upload-manual',
        processado_em: new Date().toISOString(),
        resposta_gemini: deliberacao
      }
    };

    const { error: insertError } = await supabase
      .from('deliberacoes_extraidas')
      .insert(registro);

    if (insertError) {
      throw new Error(`Erro ao salvar: ${insertError.message}`);
    }

    await updateStatus(supabase, reuniao_id, 'processado', 100);

    console.log('[IRIS] Deliberacao salva com sucesso!');

    return new Response(JSON.stringify({
      success: true,
      duplicado: false,
      deliberacao: {
        processo: registro.processo,
        interessado: registro.interessado,
        microtema: registro.microtema,
        decisao: registro.decisao,
        tipo: registro.tipo_deliberacao
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[IRIS] Erro no processamento:', error);

    // Atualizar status de erro
    if (reuniao_id) {
      await supabase
        .from('reunioes_monitoradas')
        .update({
          status: 'erro',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', reuniao_id);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================================
// FUNCAO: Processar PDF com Gemini (Uma unica chamada)
// ============================================================================
async function processarPDF(pdfBase64: string): Promise<DeliberacaoExtraida> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY nao configurada');
  }

  const prompt = `Analise este PDF de deliberacao da ARTESP e extraia os dados estruturados.

REGRAS DE CLASSIFICACAO:

1. RESULTADO (baseado nas expressoes encontradas no texto):
   - Se contem: "NAO CONHECE", "NEGA PROVIMENTO", "INDEFERE", "MANTEM INDEFERIMENTO", "IMPROCEDENTE" → "Indeferido"
   - Se contem: "ACOLHE", "DEFERE", "APROVA", "DA PROVIMENTO", "PROCEDENTE" → "Deferido"
   - Se contem: "PARCIALMENTE" → "Parcialmente Deferido"
   - Se nao identificar claramente → "A classificar"

2. CLASSIFICACAO:
   - Se o interessado contem "ARTESP" ou trata de assuntos internos da agencia → "Pauta Interna da Agencia"
   - Caso contrario → deixar vazio ""

3. MICROTEMA (inferir do contexto):
   Exemplos: "Multa", "Revisao Tarifaria", "Reequilibrio Economico", "Aditivo Contratual",
   "Recurso Administrativo", "Autorizacao", "Fiscalizacao", "Penalidade", "Prorrogacao", etc.

4. VOTOS:
   - Extraia os nomes dos diretores das assinaturas no final do documento
   - Se todos votaram igual (unanime), coloque todos em votos_a_favor
   - Se houve divergencia, separe entre votos_a_favor e votos_contra

5. DATA_REUNIAO:
   - Extraia a data da reuniao no formato YYYY-MM-DD
   - Procure por expressoes como "Reuniao realizada em", "Data:", etc.

Retorne APENAS JSON valido, sem markdown, sem comentarios:
{
  "numero_deliberacao": "numero do processo ou deliberacao (ex: DER-2024/12345)",
  "reuniao_ordinaria": "numero da reuniao (ex: 1234)",
  "data_reuniao": "2025-01-15",
  "interessado": "nome da empresa, pessoa ou orgao",
  "microtema": "tema inferido",
  "resultado": "Deferido|Indeferido|Parcialmente Deferido|A classificar",
  "votos_a_favor": ["Nome Diretor 1", "Nome Diretor 2"],
  "votos_contra": [],
  "classificacao": "Pauta Interna da Agencia ou vazio"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: pdfBase64
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Gemini: ${data.error.message}`);
  }

  const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  // Limpar resposta (remover markdown se houver)
  const jsonLimpo = resposta
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const parsed = JSON.parse(jsonLimpo);

    // Validar campos obrigatorios
    if (!parsed.numero_deliberacao) {
      parsed.numero_deliberacao = 'Nao identificado';
    }
    if (!parsed.reuniao_ordinaria) {
      parsed.reuniao_ordinaria = 'N/A';
    }
    if (!parsed.interessado) {
      parsed.interessado = 'Nao identificado';
    }
    if (!parsed.resultado) {
      parsed.resultado = 'A classificar';
    }
    if (!parsed.microtema) {
      parsed.microtema = 'A classificar';
    }

    return parsed;

  } catch (parseError) {
    console.error('[IRIS] Erro ao parsear JSON:', jsonLimpo);
    throw new Error('Falha ao parsear resposta do Gemini');
  }
}

// ============================================================================
// FUNCAO: Atualizar Status da Reuniao
// ============================================================================
async function updateStatus(
  supabase: any,
  reuniaoId: string | null,
  status: string,
  progresso: number
): Promise<void> {
  if (!reuniaoId) return;

  await supabase
    .from('reunioes_monitoradas')
    .update({
      status,
      progresso,
      updated_at: new Date().toISOString()
    })
    .eq('id', reuniaoId);
}

// ============================================================================
// TIPOS
// ============================================================================
interface DeliberacaoExtraida {
  numero_deliberacao: string;
  reuniao_ordinaria: string;
  data_reuniao?: string;
  interessado: string;
  microtema: string;
  resultado: 'Deferido' | 'Indeferido' | 'Parcialmente Deferido' | 'A classificar';
  votos_a_favor: string[];
  votos_contra: string[];
  classificacao: string;
}
