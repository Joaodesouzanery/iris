/**
 * Edge Function: receive-external-pdf
 *
 * Recebe PDFs já processados do CLI externo (artesp-collector)
 * e insere diretamente na tabela deliberacoes_extraidas
 *
 * Deploy no Supabase:
 * 1. Copie este arquivo para supabase/functions/receive-external-pdf/index.ts
 * 2. Execute: supabase functions deploy receive-external-pdf
 *
 * Uso:
 *   node cli.js --send https://sua-url.supabase.co/functions/v1/receive-external-pdf
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-source, x-timestamp',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ExternalPDFPayload {
  agencia: string;
  nome_arquivo: string;
  texto_pdf: string;
  metadata?: {
    data_coleta?: string;
    eh_novo?: boolean;
    url_original?: string;
    data_documento?: string;
    ano?: string;
    reuniao?: string;
    num_paginas?: number;
    num_caracteres?: number;
    num_palavras?: number;
    tamanho_arquivo?: string;
    eh_escaneado?: boolean;
    hash?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body
    const payload: ExternalPDFPayload = await req.json();

    // Validate required fields
    if (!payload.agencia || !payload.nome_arquivo || !payload.texto_pdf) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          required: ['agencia', 'nome_arquivo', 'texto_pdf']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract meeting info from filename or metadata
    const numeroReuniao = payload.metadata?.reuniao || extractNumeroReuniao(payload.nome_arquivo);
    const dataReuniao = payload.metadata?.data_documento || null;
    const ano = payload.metadata?.ano || extractAno(payload.nome_arquivo);

    // Check for duplicates by hash or filename
    if (payload.metadata?.hash) {
      const { data: existing } = await supabase
        .from('deliberacoes_extraidas')
        .select('id')
        .eq('raw_data->>hash', payload.metadata.hash)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({
            success: true,
            status: 'skipped',
            message: 'PDF already processed (duplicate hash)',
            id: existing.id
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // First, create or find the monitored meeting record
    let reuniaoId: string | null = null;

    if (payload.metadata?.url_original) {
      // Check if meeting already exists
      const { data: existingReuniao } = await supabase
        .from('reunioes_monitoradas')
        .select('id')
        .eq('url_origem', payload.metadata.url_original)
        .single();

      if (existingReuniao) {
        reuniaoId = existingReuniao.id;
      } else {
        // Create new meeting record
        const { data: newReuniao, error: reuniaoError } = await supabase
          .from('reunioes_monitoradas')
          .insert({
            url_origem: payload.metadata.url_original,
            link_pdf: payload.metadata.url_original,
            numero_reuniao: numeroReuniao,
            data_reuniao: dataReuniao,
            tipo: 'DELIBERACAO_PADRAO',
            status: 'processado',
            progresso: 100
          })
          .select('id')
          .single();

        if (newReuniao) {
          reuniaoId = newReuniao.id;
        }
      }
    }

    // Process the text to extract deliberations
    // For now, we'll store the entire text as one deliberation
    // You can enhance this to use AI to split into multiple deliberations

    const deliberacao = {
      reuniao_id: reuniaoId,
      agencia: payload.agencia,
      numero_reuniao: numeroReuniao,
      data_reuniao: dataReuniao,
      processo: `Deliberações ${numeroReuniao || payload.nome_arquivo}`,
      interessado: 'Múltiplos interessados',
      pauta_interna: false,
      microtema: 'A classificar',
      resumo_pleito: payload.texto_pdf.substring(0, 500) + '...',
      decisao: 'A classificar',
      fundamento_decisao: null,
      votos_favor: null,
      votos_contra: null,
      link_pdf: payload.metadata?.url_original || null,
      raw_data: {
        fonte: 'cli-externo',
        nome_arquivo: payload.nome_arquivo,
        texto_completo: payload.texto_pdf,
        hash: payload.metadata?.hash,
        num_paginas: payload.metadata?.num_paginas,
        num_caracteres: payload.metadata?.num_caracteres,
        num_palavras: payload.metadata?.num_palavras,
        eh_escaneado: payload.metadata?.eh_escaneado,
        data_coleta: payload.metadata?.data_coleta,
        eh_novo: payload.metadata?.eh_novo
      }
    };

    // Insert into deliberacoes_extraidas
    const { data: inserted, error: insertError } = await supabase
      .from('deliberacoes_extraidas')
      .insert(deliberacao)
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Failed to insert deliberation',
          details: insertError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally trigger classification
    // You can call your classify-deliberations function here
    // await supabase.functions.invoke('classify-deliberations', { body: { id: inserted.id } });

    return new Response(
      JSON.stringify({
        success: true,
        status: 'inserted',
        message: 'PDF received and stored successfully',
        data: {
          deliberacao_id: inserted.id,
          reuniao_id: reuniaoId,
          nome_arquivo: payload.nome_arquivo,
          num_caracteres: payload.metadata?.num_caracteres || payload.texto_pdf.length
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions
function extractNumeroReuniao(filename: string): string | null {
  // Try to extract meeting number from filename
  // Examples: "deliberacoes_reuniao_123.pdf" or "RD_2025_015.pdf"
  const patterns = [
    /reuniao[_\s-]*(\d+)/i,
    /RD[_\s-]*\d{4}[_\s-]*(\d+)/i,
    /(\d{3,4})[ª°]?\s*reuniao/i
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function extractAno(filename: string): string | null {
  const match = filename.match(/20(2[5-9]|[3-9]\d)/);
  return match ? `20${match[1]}` : null;
}
