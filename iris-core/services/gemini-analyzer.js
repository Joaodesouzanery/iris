/**
 * Gemini Analyzer - Extração de Deliberações via IA
 *
 * Usa a API Gemini 2.0 Flash para extrair dados estruturados
 * de textos de deliberações de agências reguladoras.
 *
 * Quando GEMINI_API_KEY não está configurada, retorna null
 * para que o sistema use o extrator regex como fallback.
 */

const logger = require('../utils/logger');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Verifica se a API Gemini está disponível
 */
function isGeminiAvailable() {
    const key = process.env.GEMINI_API_KEY;
    return !!(key && key.length > 10 && !key.includes('COLE_') && !key.includes('SUA_'));
}

/**
 * Prompt otimizado para extração de deliberações da ARTESP
 */
function buildPrompt(texto) {
    return `Analise o texto abaixo de uma deliberação da ARTESP (Agência de Transporte do Estado de São Paulo) e extraia os dados estruturados.

REGRAS DE EXTRAÇÃO:

1. PROCESSO: Extraia o número completo do processo (ex: "SEI! nº 134.00037303/2024-01" ou "ARTESP-PRC-2024/12345")

2. NUMERO_REUNIAO: Número da reunião ordinária (ex: "1176")

3. DATA_REUNIAO: Data da reunião no formato YYYY-MM-DD

4. INTERESSADO: Nome completo da empresa ou pessoa interessada

5. DECISAO (baseado nas expressões encontradas no texto):
   - "NAO CONHECE", "NEGA PROVIMENTO", "INDEFERE", "MANTEM INDEFERIMENTO", "IMPROCEDENTE" → "Indeferido"
   - "ACOLHE", "DEFERE", "APROVA", "DA PROVIMENTO", "PROCEDENTE", "RECOMENDA O DEFERIMENTO" → "Deferido"
   - "PARCIALMENTE" → "Parcialmente Deferido"
   - Se não identificar → "A classificar"

6. MICROTEMA (inferir do contexto):
   Exemplos: "Multa", "Revisão Tarifária", "Reequilíbrio Econômico", "Aditivo Contratual",
   "Recurso Administrativo", "Autorização", "Fiscalização", "Penalidade", "Prorrogação",
   "Obras e Investimentos", "Segurança Viária", "Ressarcimento", "Gratuidade", "Outros"

7. PAUTA_INTERNA: true se o interessado for a própria ARTESP ou se tratar de assuntos internos

8. VOTOS:
   - Extraia os nomes COMPLETOS dos diretores
   - Se unanimidade, coloque todos em votos_a_favor
   - Se divergência, separe entre votos_a_favor e votos_contra

9. RESUMO_PLEITO: Escreva um resumo de 2-3 frases do que foi solicitado/deliberado.
   Deve ser claro e informativo, explicando o pedido do interessado.

10. FUNDAMENTO_DECISAO: Extraia a fundamentação/recomendação da decisão.
    Inclua valores monetários, quantidades e referências legais quando presentes no texto.

Retorne APENAS JSON válido, sem markdown, sem comentários:
{
  "processo": "número completo do processo",
  "numero_reuniao": "número da reunião",
  "data_reuniao": "YYYY-MM-DD",
  "interessado": "nome completo",
  "decisao": "Deferido|Indeferido|Parcialmente Deferido|A classificar",
  "microtema": "tema inferido",
  "pauta_interna": false,
  "votos_a_favor": ["Nome Completo Diretor 1", "Nome Completo Diretor 2"],
  "votos_contra": [],
  "resumo_pleito": "Resumo de 2-3 frases do pedido/deliberação",
  "fundamento_decisao": "Fundamentação completa da decisão com valores e referências"
}

TEXTO DA DELIBERAÇÃO:
${texto}`;
}

/**
 * Chama a API Gemini para extrair dados de uma deliberação
 * @param {string} texto - Texto extraído do PDF
 * @returns {Promise<Object|null>} Dados extraídos ou null se indisponível
 */
async function analisarComGemini(texto) {
    if (!isGeminiAvailable()) {
        return null;
    }

    if (!texto || texto.length < 50) {
        logger.warn('GeminiAnalyzer', 'Texto muito curto para análise', { length: texto?.length });
        return null;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Limita o texto a ~30k chars para não exceder limite de tokens
    const textoTruncado = texto.length > 30000 ? texto.substring(0, 30000) : texto;

    try {
        const axios = require('axios');

        const response = await axios.post(
            `${GEMINI_API_URL}?key=${apiKey}`,
            {
                contents: [{
                    parts: [{ text: buildPrompt(textoTruncado) }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2048
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            }
        );

        const resposta = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        // Limpar resposta (remover markdown se houver)
        const jsonLimpo = resposta
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(jsonLimpo);

        // Validar e normalizar campos
        return normalizarResultado(parsed);

    } catch (error) {
        logger.warn('GeminiAnalyzer', `Erro na análise Gemini: ${error.message}`);
        console.log(`[IRIS-Gemini] Erro: ${error.message} - usando fallback regex`);
        return null;
    }
}

/**
 * Analisa múltiplas deliberações de um mesmo texto
 * Se o texto contém múltiplas deliberações, retorna array
 * @param {string} texto - Texto do PDF (pode conter múltiplas deliberações)
 * @returns {Promise<Array|null>} Array de deliberações ou null
 */
async function analisarMultiplasDeliberacoes(texto) {
    if (!isGeminiAvailable()) {
        return null;
    }

    if (!texto || texto.length < 50) {
        return null;
    }

    // Para textos curtos, usar análise simples
    if (texto.length < 5000) {
        const resultado = await analisarComGemini(texto);
        return resultado ? [resultado] : null;
    }

    // Para textos longos, tentar extrair múltiplas deliberações
    const apiKey = process.env.GEMINI_API_KEY;
    const textoTruncado = texto.length > 50000 ? texto.substring(0, 50000) : texto;

    const promptMultiplo = `Analise o texto abaixo que pode conter MÚLTIPLAS deliberações da ARTESP.
Extraia TODAS as deliberações encontradas.

REGRAS: Mesmas regras de extração de processo, decisão, votos, etc.
Para cada deliberação, extraia: processo, numero_reuniao, data_reuniao, interessado, decisao, microtema, pauta_interna, votos_a_favor, votos_contra, resumo_pleito, fundamento_decisao.

Retorne APENAS um JSON array válido:
[
  { ...deliberacao1... },
  { ...deliberacao2... }
]

Se houver apenas 1 deliberação, retorne array com 1 elemento.

TEXTO:
${textoTruncado}`;

    try {
        const axios = require('axios');

        const response = await axios.post(
            `${GEMINI_API_URL}?key=${apiKey}`,
            {
                contents: [{
                    parts: [{ text: promptMultiplo }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 4096
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000
            }
        );

        const resposta = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        const jsonLimpo = resposta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let parsed = JSON.parse(jsonLimpo);

        // Se retornou objeto único, wrappa em array
        if (!Array.isArray(parsed)) {
            parsed = [parsed];
        }

        return parsed.map(normalizarResultado);

    } catch (error) {
        logger.warn('GeminiAnalyzer', `Erro na análise múltipla: ${error.message}`);
        // Fallback: tenta análise simples
        const resultado = await analisarComGemini(texto);
        return resultado ? [resultado] : null;
    }
}

/**
 * Normaliza e valida o resultado da extração Gemini
 */
function normalizarResultado(parsed) {
    return {
        processo: parsed.processo || 'Não identificado',
        numero_reuniao: String(parsed.numero_reuniao || parsed.reuniao_ordinaria || 'N/A'),
        data_reuniao: validarData(parsed.data_reuniao) || '',
        interessado: parsed.interessado || 'Não identificado',
        decisao: normalizarDecisao(parsed.decisao || parsed.resultado),
        microtema: parsed.microtema || 'Outros',
        pauta_interna: !!parsed.pauta_interna,
        votos_a_favor: normalizarVotos(parsed.votos_a_favor || parsed.votos_favor),
        votos_contra: normalizarVotos(parsed.votos_contra),
        resumo_pleito: parsed.resumo_pleito || '',
        fundamento_decisao: parsed.fundamento_decisao || '',
        fonte: 'gemini'
    };
}

/**
 * Valida formato de data YYYY-MM-DD
 */
function validarData(data) {
    if (!data) return null;
    const match = String(data).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, ano, mes, dia] = match;
    if (parseInt(mes) < 1 || parseInt(mes) > 12) return null;
    if (parseInt(dia) < 1 || parseInt(dia) > 31) return null;
    if (parseInt(ano) < 1990 || parseInt(ano) > 2099) return null;
    return data;
}

/**
 * Normaliza a decisão para valores aceitos
 */
function normalizarDecisao(decisao) {
    if (!decisao) return 'A classificar';
    const d = decisao.toLowerCase();
    if (d.includes('parcial')) return 'Parcialmente Deferido';
    if (d.includes('deferido') || d.includes('aprovado') || d.includes('procedente')) return 'Deferido';
    if (d.includes('indeferido') || d.includes('negado') || d.includes('improcedente')) return 'Indeferido';
    return 'A classificar';
}

/**
 * Normaliza array de votos
 */
function normalizarVotos(votos) {
    if (!votos) return [];
    if (typeof votos === 'string') return votos.split(',').map(v => v.trim()).filter(Boolean);
    if (Array.isArray(votos)) return votos.filter(v => v && typeof v === 'string');
    return [];
}

module.exports = {
    isGeminiAvailable,
    analisarComGemini,
    analisarMultiplasDeliberacoes,
    normalizarResultado
};
