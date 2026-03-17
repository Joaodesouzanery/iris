/**
 * Gemini Analyzer - Extração de Deliberações via IA
 *
 * Usa a API Gemini 2.0 Flash para extrair dados estruturados
 * de textos de deliberações de agências reguladoras.
 *
 * Quando GEMINI_API_KEY não está configurada, retorna null
 * para que o sistema use o extrator regex como fallback.
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ── Response Cache (by text hash) ──
const geminiCache = new Map();
const CACHE_MAX_SIZE = 500;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(texto) {
    return crypto.createHash('sha256').update(texto).digest('hex');
}

function getCachedResult(key) {
    const entry = geminiCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.time > CACHE_TTL) {
        geminiCache.delete(key);
        return null;
    }
    return entry.data;
}

function setCachedResult(key, data) {
    if (geminiCache.size >= CACHE_MAX_SIZE) {
        const oldest = geminiCache.keys().next().value;
        geminiCache.delete(oldest);
    }
    geminiCache.set(key, { data, time: Date.now() });
}

// ── Quota Tracking ──
const geminiQuota = { calls: 0, resetTime: Date.now() + 3600000 };
const MAX_CALLS_PER_HOUR = 60;

/**
 * Verifica se a API Gemini está disponível
 */
function isGeminiAvailable() {
    const key = process.env.GEMINI_API_KEY;
    return !!(key && key.length > 10 && !key.includes('COLE_') && !key.includes('SUA_'));
}

/**
 * Prompt otimizado para extração completa de deliberações
 * Suporta múltiplas agências reguladoras
 */
function buildPrompt(texto) {
    return `Analise o texto abaixo de uma deliberação de agência reguladora brasileira e extraia os dados estruturados.

CONTEXTO: Uma deliberação é um documento oficial produzido durante reuniões ordinárias (colegiadas) de agências reguladoras. Pode ser um Pleito Externo (solicitação de empresa/cidadão) ou Pauta Interna (ato administrativo da própria agência).

REGRAS DE EXTRAÇÃO:

1. NUMERO_DELIBERACAO: Número sequencial da deliberação (ex: "1176", "DEL-2024/123")

2. REUNIAO_ORDINARIA: Número da reunião ordinária onde foi decidido (ex: "1176")

3. PROCESSO: Número completo do processo administrativo (ex: "SEI! nº 134.00037303/2024-01", "ARTESP-PRC-2024/12345")

4. DATA_REUNIAO: Data da reunião no formato YYYY-MM-DD

5. AGENCIA: Sigla da agência reguladora (ARTESP, ANEEL, ANATEL, ANP, ANTT, ANTAQ, ANS, ANVISA, ANA, ANAC, ANM)

6. INTERESSADO: Nome completo da empresa ou pessoa que fez o pedido. Se for ato interno, colocar o nome da agência.

7. CLASSIFICACAO: Tipo da deliberação:
   - "Pleito Externo" → solicitação de empresa ou cidadão
   - "Pauta Interna da Agência" → decisão interna, ato administrativo, nomeação, norma

8. MICROTEMA: Classificar em uma destas categorias:
   - "Reequilíbrio" → pedidos de reequilíbrio econômico-financeiro
   - "Tarifa" → reajustes e revisões tarifárias
   - "Obras" → aprovação de obras e investimentos
   - "Contrato" → alterações contratuais, aditivos, prorrogações
   - "Multa" → aplicação, recurso ou cancelamento de multas
   - "Fiscalização" → ações de fiscalização e auditoria
   - "Segurança" → normas e procedimentos de segurança
   - "Ambiental" → licenciamento e questões ambientais
   - "Desapropriação" → processos de desapropriação
   - "Usuário" → reclamações e direitos de usuários
   - "Concessão" → licitações e contratos de concessão
   - "Permissão" → autorizações e permissões
   - "Regulação" → normas regulatórias gerais
   - "Institucional" → atos administrativos internos
   - "Recursos Humanos" → questões de pessoal
   - "Outros" → demais assuntos

9. RESULTADO: Decisão baseada nas expressões do texto:
   - "Indeferido" ← "NÃO CONHECE", "NEGA PROVIMENTO", "INDEFERE", "MANTÉM INDEFERIMENTO", "IMPROCEDENTE"
   - "Deferido" ← "ACOLHE", "DEFERE", "APROVA", "DÁ PROVIMENTO", "PROCEDENTE", "RECOMENDA O DEFERIMENTO"
   - "Parcialmente Deferido" ← "PARCIALMENTE"
   - "A classificar" ← se não identificar

10. VOTOS: Extraia os nomes COMPLETOS de todos os diretores que participaram da votação.
    TIPOS DE VOTAÇÃO:
    - Unanimidade: todos votaram igual → todos em votos_a_favor
    - Maioria: separar votos_a_favor e votos_contra
    - Voto Divergente: diretor que votou CONTRA a maioria → colocar em votos_contra

11. RESUMO_PLEITO: Resumo claro de 2-3 frases explicando o que foi pedido/deliberado.

12. FUNDAMENTO_DECISAO: Extraia a fundamentação/recomendação da decisão com valores monetários, quantidades e referências legais.

Retorne APENAS JSON válido, sem markdown, sem comentários:
{
  "numero_deliberacao": "número sequencial",
  "reuniao_ordinaria": "número da reunião",
  "processo": "número completo do processo",
  "data_reuniao": "YYYY-MM-DD",
  "agencia": "SIGLA",
  "interessado": "nome completo",
  "classificacao": "Pleito Externo|Pauta Interna da Agência",
  "microtema": "categoria do assunto",
  "resultado": "Deferido|Indeferido|Parcialmente Deferido|A classificar",
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

    // Limita o texto a ~30k chars para não exceder limite de tokens
    const textoTruncado = texto.length > 30000 ? texto.substring(0, 30000) : texto;

    // Check cache first
    const cacheKey = getCacheKey(textoTruncado);
    const cached = getCachedResult(cacheKey);
    if (cached) {
        logger.info('GeminiAnalyzer', 'Cache hit', { keyPrefix: cacheKey.substring(0, 8) });
        return cached;
    }

    // Check quota
    if (Date.now() > geminiQuota.resetTime) {
        geminiQuota.calls = 0;
        geminiQuota.resetTime = Date.now() + 3600000;
    }
    if (geminiQuota.calls >= MAX_CALLS_PER_HOUR) {
        logger.warn('GeminiAnalyzer', 'Quota por hora excedida, usando fallback regex');
        return null;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    geminiQuota.calls++;

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

        let parsed;
        try {
            parsed = JSON.parse(jsonLimpo);
        } catch (parseError) {
            logger.error('GeminiAnalyzer', 'JSON inválido na resposta', { raw: resposta.substring(0, 200) });
            return null;
        }

        // Validar e normalizar campos
        const resultado = normalizarResultado(parsed);

        // Cache the result
        setCachedResult(cacheKey, resultado);

        return resultado;

    } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED';
        logger.warn('GeminiAnalyzer', `Erro na análise Gemini: ${isTimeout ? 'timeout (30s)' : 'falha na requisição'}`, {
            status: error.response?.status,
            timeout: isTimeout
        });
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
    const textoTruncado = texto.length > 50000 ? texto.substring(0, 50000) : texto;

    // Check cache
    const cacheKey = getCacheKey('multi:' + textoTruncado);
    const cached = getCachedResult(cacheKey);
    if (cached) {
        logger.info('GeminiAnalyzer', 'Cache hit (múltiplas)', { keyPrefix: cacheKey.substring(0, 8) });
        return cached;
    }

    // Check quota
    if (Date.now() > geminiQuota.resetTime) {
        geminiQuota.calls = 0;
        geminiQuota.resetTime = Date.now() + 3600000;
    }
    if (geminiQuota.calls >= MAX_CALLS_PER_HOUR) {
        logger.warn('GeminiAnalyzer', 'Quota por hora excedida, usando fallback regex');
        return null;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    geminiQuota.calls++;

    const promptMultiplo = `Analise o texto abaixo que pode conter MÚLTIPLAS deliberações de agência reguladora.
Extraia TODAS as deliberações encontradas.

Para cada deliberação, extraia TODOS estes campos:
- numero_deliberacao: número sequencial
- reuniao_ordinaria: número da reunião
- processo: número completo do processo
- data_reuniao: formato YYYY-MM-DD
- agencia: sigla (ARTESP, ANEEL, etc.)
- interessado: nome da empresa/pessoa
- classificacao: "Pleito Externo" ou "Pauta Interna da Agência"
- microtema: categoria (Reequilíbrio, Tarifa, Obras, Contrato, Multa, Fiscalização, Segurança, Ambiental, Desapropriação, Usuário, Concessão, Permissão, Regulação, Institucional, Recursos Humanos, Outros)
- resultado: "Deferido", "Indeferido", "Parcialmente Deferido" ou "A classificar"
- votos_a_favor: array de nomes completos dos diretores
- votos_contra: array de nomes (votos divergentes)
- resumo_pleito: resumo de 2-3 frases
- fundamento_decisao: fundamentação com referências legais e valores

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

        let parsed;
        try {
            parsed = JSON.parse(jsonLimpo);
        } catch (parseError) {
            logger.error('GeminiAnalyzer', 'JSON inválido na resposta múltipla', { raw: resposta.substring(0, 200) });
            const resultado = await analisarComGemini(texto);
            return resultado ? [resultado] : null;
        }

        // Se retornou objeto único, wrappa em array
        if (!Array.isArray(parsed)) {
            parsed = [parsed];
        }

        const resultados = parsed.map(normalizarResultado);
        setCachedResult(cacheKey, resultados);
        return resultados;

    } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED';
        logger.warn('GeminiAnalyzer', `Erro na análise múltipla: ${isTimeout ? 'timeout (60s)' : 'falha na requisição'}`, {
            status: error.response?.status,
            timeout: isTimeout
        });
        // Fallback: tenta análise simples
        const resultado = await analisarComGemini(texto);
        return resultado ? [resultado] : null;
    }
}

/**
 * Normaliza e valida o resultado da extração Gemini
 */
function normalizarResultado(parsed) {
    const isPautaInterna = !!parsed.pauta_interna ||
        parsed.classificacao === 'Pauta Interna da Agência' ||
        (parsed.interessado && /^(ARTESP|ANEEL|ANATEL|ANP|ANTT|ANTAQ|ANS|ANVISA|ANA)$/i.test(parsed.interessado));

    return {
        numero_deliberacao: String(parsed.numero_deliberacao || parsed.numero_reuniao || ''),
        reuniao_ordinaria: String(parsed.reuniao_ordinaria || parsed.numero_reuniao || ''),
        processo: parsed.processo || 'Não identificado',
        data_reuniao: validarData(parsed.data_reuniao) || '',
        agencia: parsed.agencia || 'ARTESP',
        interessado: parsed.interessado || 'Não identificado',
        classificacao: isPautaInterna ? 'Pauta Interna da Agência' : (parsed.classificacao || 'Pleito Externo'),
        microtema: parsed.microtema || 'Outros',
        resultado: normalizarDecisao(parsed.resultado || parsed.decisao),
        votos_a_favor: normalizarVotos(parsed.votos_a_favor || parsed.votos_favor),
        votos_contra: normalizarVotos(parsed.votos_contra),
        resumo_pleito: parsed.resumo_pleito || '',
        fundamento_decisao: parsed.fundamento_decisao || '',
        // Campos de compatibilidade
        pauta_interna: isPautaInterna,
        decisao: normalizarDecisao(parsed.resultado || parsed.decisao),
        numero_reuniao: String(parsed.reuniao_ordinaria || parsed.numero_reuniao || 'N/A'),
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
