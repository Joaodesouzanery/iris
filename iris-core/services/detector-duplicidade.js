/**
 * Serviço de Detecção de Duplicidade - IRIS
 *
 * Detecta deliberações duplicadas antes de salvar no banco
 * Usa múltiplos critérios: número do processo, hash do texto, similaridade
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

// ============================================================================
// PADRÕES PARA EXTRAÇÃO DE NÚMERO DE PROCESSO
// ============================================================================

/**
 * Padrões para identificar números de processo
 */
const PATTERNS_PROCESSO = [
    // Formato ARTESP: ARTESP-PRC-2025/12345
    /ARTESP[_\-]?(?:PRC|PROC)?[_\-]?(\d{4})[\/\-](\d+)/gi,

    // Formato SEI: SEI 015001/000123/2025
    /SEI\s*[:\-]?\s*(\d+)[\/\-](\d+)[\/\-](\d{4})/gi,

    // Formato genérico: Processo nº 12345/2025
    /Processo\s*(?:n[°º]?|número)?\s*[:\-]?\s*(\d+)[\/\-](\d{4})/gi,

    // Formato com prefixo: PA 123/2025, PI 456/2025
    /\b(PA|PI|PD|PE|PRC|PROC)\s*[:\-]?\s*(\d+)[\/\-](\d{4})/gi,

    // Formato administrativo: Expediente 12345/2025
    /(?:Expediente|Requerimento|Protocolo)\s*(?:n[°º]?)?\s*[:\-]?\s*(\d+)[\/\-](\d{4})/gi,

    // Formato numérico simples: 12345/2025 ou 12345-2025
    /\b(\d{4,6})[\/\-](20\d{2})\b/g
];

/**
 * Padrões para identificar número de deliberação
 */
const PATTERNS_DELIBERACAO = [
    // Deliberação nº 123/2025
    /Delibera[çc][ãa]o\s*(?:n[°º]?)?\s*[:\-]?\s*(\d+)[\/\-](\d{4})/gi,

    // RD-2025-123 (Reunião Deliberativa)
    /RD[_\-]?(\d{4})[_\-](\d+)/gi,

    // DEL 123/2025
    /DEL\s*[:\-]?\s*(\d+)[\/\-](\d{4})/gi
];

// ============================================================================
// FUNÇÕES DE EXTRAÇÃO
// ============================================================================

/**
 * Extrai número(s) de processo do texto
 * @param {string} texto - Texto da deliberação
 * @returns {Array<string>} Lista de números de processo encontrados
 */
function extrairNumeroProcesso(texto) {
    if (!texto || typeof texto !== 'string') {
        return [];
    }

    const processos = new Set();

    for (const pattern of PATTERNS_PROCESSO) {
        // Reset do regex
        pattern.lastIndex = 0;

        let match;
        while ((match = pattern.exec(texto)) !== null) {
            // Normaliza o número do processo
            const processo = normalizarNumeroProcesso(match[0]);
            if (processo) {
                processos.add(processo);
            }
        }
    }

    return Array.from(processos);
}

/**
 * Extrai número da deliberação do texto
 * @param {string} texto - Texto da deliberação
 * @returns {string|null} Número da deliberação ou null
 */
function extrairNumeroDeliberacao(texto) {
    if (!texto || typeof texto !== 'string') {
        return null;
    }

    for (const pattern of PATTERNS_DELIBERACAO) {
        pattern.lastIndex = 0;

        const match = pattern.exec(texto);
        if (match) {
            return normalizarNumeroProcesso(match[0]);
        }
    }

    return null;
}

/**
 * Normaliza número de processo para formato padrão
 * @param {string} numero - Número bruto
 * @returns {string} Número normalizado
 */
function normalizarNumeroProcesso(numero) {
    if (!numero) return null;

    return numero
        .toUpperCase()
        .replace(/\s+/g, '')        // Remove espaços
        .replace(/[_]/g, '-')       // Normaliza separadores
        .replace(/[:]/g, '-')
        .replace(/--+/g, '-')       // Remove hífens duplicados
        .trim();
}

/**
 * Gera hash do texto para comparação de duplicidade
 * @param {string} texto - Texto da deliberação
 * @returns {string} Hash MD5 do texto normalizado
 */
function gerarHashTexto(texto) {
    if (!texto || typeof texto !== 'string') {
        return null;
    }

    // Normaliza texto para comparação
    const textoNormalizado = texto
        .toLowerCase()
        .replace(/\s+/g, ' ')        // Normaliza espaços
        .replace(/[^\w\sáàâãéèêíïóôõöúç]/gi, '') // Remove pontuação
        .trim();

    return crypto
        .createHash('md5')
        .update(textoNormalizado)
        .digest('hex');
}

/**
 * Calcula similaridade entre dois textos (Jaccard)
 * @param {string} texto1 - Primeiro texto
 * @param {string} texto2 - Segundo texto
 * @returns {number} Similaridade entre 0 e 1
 */
function calcularSimilaridade(texto1, texto2) {
    if (!texto1 || !texto2) return 0;

    // Tokeniza os textos
    const tokens1 = new Set(
        texto1.toLowerCase()
            .split(/\s+/)
            .filter(t => t.length > 3)
    );

    const tokens2 = new Set(
        texto2.toLowerCase()
            .split(/\s+/)
            .filter(t => t.length > 3)
    );

    // Calcula interseção
    const intersecao = new Set(
        [...tokens1].filter(t => tokens2.has(t))
    );

    // Calcula união
    const uniao = new Set([...tokens1, ...tokens2]);

    if (uniao.size === 0) return 0;

    return intersecao.size / uniao.size;
}

/**
 * Verifica duplicidade de uma deliberação
 * @param {Object} deliberacao - Deliberação a verificar
 * @param {Array<Object>} existentes - Deliberações existentes no banco
 * @returns {Object} Resultado da verificação
 */
function verificarDuplicidade(deliberacao, existentes) {
    const startTime = Date.now();

    logger.info('DetectorDuplicidade', 'Verificando duplicidade', {
        numeroProcessos: deliberacao.processos?.length || 0,
        totalExistentes: existentes?.length || 0
    });

    const resultado = {
        ehDuplicata: false,
        duplicataEncontrada: null,
        criterioMatch: null,
        confianca: 0,
        detalhes: []
    };

    if (!existentes || existentes.length === 0) {
        resultado.detalhes.push('Nenhuma deliberação existente para comparar');
        return resultado;
    }

    // 1. Verifica por número de processo (critério mais forte)
    if (deliberacao.processos && deliberacao.processos.length > 0) {
        for (const existente of existentes) {
            const processosExistentes = existente.processos || [];

            for (const processo of deliberacao.processos) {
                if (processosExistentes.includes(processo)) {
                    resultado.ehDuplicata = true;
                    resultado.duplicataEncontrada = existente;
                    resultado.criterioMatch = 'numero_processo';
                    resultado.confianca = 95;
                    resultado.detalhes.push(
                        `Processo ${processo} já existe na deliberação ID ${existente.id}`
                    );

                    logger.warn('DetectorDuplicidade', 'Duplicata encontrada por processo', {
                        processo,
                        deliberacaoExistenteId: existente.id
                    });

                    return resultado;
                }
            }
        }
    }

    // 2. Verifica por número de deliberação
    if (deliberacao.numeroDeliberacao) {
        for (const existente of existentes) {
            if (existente.numeroDeliberacao === deliberacao.numeroDeliberacao) {
                resultado.ehDuplicata = true;
                resultado.duplicataEncontrada = existente;
                resultado.criterioMatch = 'numero_deliberacao';
                resultado.confianca = 90;
                resultado.detalhes.push(
                    `Deliberação ${deliberacao.numeroDeliberacao} já existe com ID ${existente.id}`
                );

                logger.warn('DetectorDuplicidade', 'Duplicata encontrada por número de deliberação', {
                    numeroDeliberacao: deliberacao.numeroDeliberacao,
                    deliberacaoExistenteId: existente.id
                });

                return resultado;
            }
        }
    }

    // 3. Verifica por hash do texto (duplicata exata)
    if (deliberacao.hashTexto) {
        for (const existente of existentes) {
            if (existente.hashTexto === deliberacao.hashTexto) {
                resultado.ehDuplicata = true;
                resultado.duplicataEncontrada = existente;
                resultado.criterioMatch = 'hash_texto';
                resultado.confianca = 99;
                resultado.detalhes.push(
                    `Texto idêntico encontrado na deliberação ID ${existente.id}`
                );

                logger.warn('DetectorDuplicidade', 'Duplicata encontrada por hash', {
                    hash: deliberacao.hashTexto,
                    deliberacaoExistenteId: existente.id
                });

                return resultado;
            }
        }
    }

    // 4. Verifica por similaridade de texto (duplicata parcial)
    if (deliberacao.texto) {
        for (const existente of existentes) {
            if (existente.texto) {
                const similaridade = calcularSimilaridade(deliberacao.texto, existente.texto);

                if (similaridade > 0.85) {
                    resultado.ehDuplicata = true;
                    resultado.duplicataEncontrada = existente;
                    resultado.criterioMatch = 'similaridade_texto';
                    resultado.confianca = Math.round(similaridade * 100);
                    resultado.detalhes.push(
                        `Similaridade de ${Math.round(similaridade * 100)}% com deliberação ID ${existente.id}`
                    );

                    logger.warn('DetectorDuplicidade', 'Possível duplicata por similaridade', {
                        similaridade: Math.round(similaridade * 100),
                        deliberacaoExistenteId: existente.id
                    });

                    return resultado;
                }
            }
        }
    }

    resultado.detalhes.push('Nenhuma duplicata encontrada');

    logger.info('DetectorDuplicidade', 'Verificação concluída - não é duplicata', {
        tempoMs: Date.now() - startTime
    });

    return resultado;
}

/**
 * Prepara dados de deliberação para verificação de duplicidade
 * @param {string} texto - Texto da deliberação
 * @returns {Object} Dados preparados para verificação
 */
function prepararParaVerificacao(texto) {
    return {
        texto: texto,
        processos: extrairNumeroProcesso(texto),
        numeroDeliberacao: extrairNumeroDeliberacao(texto),
        hashTexto: gerarHashTexto(texto)
    };
}

module.exports = {
    extrairNumeroProcesso,
    extrairNumeroDeliberacao,
    normalizarNumeroProcesso,
    gerarHashTexto,
    calcularSimilaridade,
    verificarDuplicidade,
    prepararParaVerificacao,

    // Exporta padrões para testes
    PATTERNS_PROCESSO,
    PATTERNS_DELIBERACAO
};
