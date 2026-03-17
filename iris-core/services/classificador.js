/**
 * Serviço de Classificação de Deliberações - IRIS
 *
 * Classifica deliberações em:
 * - Tipo: Pleito Externo ou Ato Administrativo Interno
 * - Decisão: Deferido ou Indeferido
 * - Microtema: Inferido do contexto
 */

const logger = require('../utils/logger');

// ============================================================================
// REGRAS DE CLASSIFICAÇÃO - TIPO
// ============================================================================

/**
 * Palavras-chave que indicam PLEITO EXTERNO (solicitação de terceiros)
 */
const KEYWORDS_PLEITO_EXTERNO = [
    // Identificação de requerente externo
    'requerente', 'requerida', 'interessado', 'interessada',
    'solicitante', 'peticionário', 'peticionária',
    'concessionária', 'concessionário', 'permissionária',
    'empresa', 'sociedade', 'companhia', 'ltda', 's.a.', 's/a',

    // Ações de solicitação externa
    'solicita', 'requer', 'pleiteia', 'postula',
    'requerimento', 'solicitação', 'pleito', 'pedido',
    'recurso administrativo', 'recurso hierárquico',
    'impugnação', 'contestação', 'defesa prévia',

    // Contratos e termos
    'contrato de concessão', 'termo de permissão',
    'aditivo contratual', 'revisão tarifária',
    'reequilíbrio econômico', 'reajuste',

    // Processos externos
    'auto de infração', 'notificação',
    'penalidade', 'multa', 'sanção'
];

/**
 * Palavras-chave que indicam ATO ADMINISTRATIVO INTERNO
 */
const KEYWORDS_ATO_INTERNO = [
    // Atos normativos internos
    'portaria', 'resolução', 'instrução normativa',
    'deliberação normativa', 'regulamento',

    // Ações internas
    'designar', 'nomear', 'exonerar', 'dispensar',
    'autorizar servidor', 'conceder férias',
    'aprovar regulamento', 'instituir',

    // Estrutura interna
    'comissão interna', 'grupo de trabalho',
    'diretoria colegiada', 'conselho diretor',

    // Processos internos
    'processo administrativo interno',
    'expediente interno', 'memorando',
    'ordem de serviço', 'comunicado interno',

    // Gestão interna
    'orçamento', 'dotação orçamentária',
    'licitação', 'pregão', 'contratação direta',
    'dispensa de licitação', 'inexigibilidade'
];

// ============================================================================
// REGRAS DE CLASSIFICAÇÃO - DECISÃO
// ============================================================================

/**
 * Padrões que indicam DEFERIDO (aprovado/aceito)
 */
const PATTERNS_DEFERIDO = [
    // Deferimento explícito
    /\bdefer(?:ido|ir|e|imento)\b/i,
    /\bprocedente\b/i,
    /\bacolh(?:ido|er|e|imento)\b/i,
    /\baprovad[oa]\b/i,
    /\bhomologad[oa]\b/i,
    /\bautorizad[oa]\b/i,
    /\bconcedid[oa]\b/i,
    /\baceito\b/i,

    // Expressões de deferimento
    /deliberou?\s+(?:por\s+)?aprovar/i,
    /deliberou?\s+(?:por\s+)?deferir/i,
    /deliberou?\s+(?:por\s+)?autorizar/i,
    /deliberou?\s+(?:por\s+)?conceder/i,
    /deliberou?\s+(?:por\s+)?homologar/i,
    /decide\s+(?:por\s+)?aprovar/i,
    /decide\s+(?:por\s+)?deferir/i,

    // Provimento de recurso
    /recurso\s+provido/i,
    /dar\s+provimento/i,
    /deu\s+provimento/i,

    // Reconhecimento
    /reconhec(?:er|ido|eu)\s+o\s+direito/i,
    /julg(?:ar|ou|ado)\s+procedente/i
];

/**
 * Padrões que indicam INDEFERIDO (negado/rejeitado)
 */
const PATTERNS_INDEFERIDO = [
    // Indeferimento explícito
    /\bindefer(?:ido|ir|e|imento)\b/i,
    /\bimprocedente\b/i,
    /\brejeitad[oa]\b/i,
    /\bnegad[oa]\b/i,
    /\bdesacolh(?:ido|er|e)\b/i,
    /\bdesaprovad[oa]\b/i,
    /\brecusad[oa]\b/i,

    // Expressões de indeferimento
    /deliberou?\s+(?:por\s+)?indeferir/i,
    /deliberou?\s+(?:por\s+)?negar/i,
    /deliberou?\s+(?:por\s+)?rejeitar/i,
    /decide\s+(?:por\s+)?indeferir/i,
    /decide\s+(?:por\s+)?negar/i,

    // Desprovimento de recurso
    /recurso\s+(?:im|des)?provido/i,
    /negar\s+provimento/i,
    /negou\s+provimento/i,
    /sem\s+provimento/i,

    // Arquivamento negativo
    /arquiv(?:ar|ado|amento)\s+(?:o\s+)?(?:processo|pedido|requerimento)/i,
    /julg(?:ar|ou|ado)\s+improcedente/i,

    // Perda de objeto
    /perda\s+(?:do\s+)?objeto/i,
    /prejudicad[oa]/i
];

// ============================================================================
// MICROTEMAS - Categorização por contexto
// ============================================================================

const MICROTEMAS = {
    'Revisão Tarifária': [
        'tarifa', 'reajuste tarifário', 'revisão tarifária',
        'reequilíbrio', 'pedágio', 'valor da tarifa'
    ],
    'Penalidades e Multas': [
        'multa', 'penalidade', 'sanção', 'auto de infração',
        'advertência', 'suspensão', 'cassação'
    ],
    'Contratos e Aditivos': [
        'contrato', 'aditivo', 'termo aditivo', 'prorrogação',
        'renovação contratual', 'alteração contratual'
    ],
    'Recursos Administrativos': [
        'recurso', 'reconsideração', 'recurso hierárquico',
        'impugnação', 'defesa', 'contestação'
    ],
    'Obras e Investimentos': [
        'obra', 'investimento', 'construção', 'ampliação',
        'duplicação', 'manutenção', 'conservação'
    ],
    'Qualidade do Serviço': [
        'qualidade', 'nível de serviço', 'indicador',
        'desempenho', 'fiscalização', 'auditoria'
    ],
    'Segurança Viária': [
        'segurança', 'acidente', 'sinalização',
        'velocidade', 'fiscalização eletrônica'
    ],
    'Gestão Interna': [
        'servidor', 'funcionário', 'nomeação', 'exoneração',
        'férias', 'licença', 'designação'
    ],
    'Licitações': [
        'licitação', 'pregão', 'concorrência', 'tomada de preço',
        'dispensa', 'inexigibilidade', 'contratação'
    ],
    'Regulamentação': [
        'regulamento', 'norma', 'resolução', 'portaria',
        'instrução normativa', 'deliberação normativa'
    ]
};

// ============================================================================
// FUNÇÕES DE CLASSIFICAÇÃO
// ============================================================================

/**
 * Classifica o tipo da deliberação
 * @param {string} texto - Texto da deliberação
 * @returns {Object} { tipo, confianca, justificativa }
 */
function classificarTipo(texto) {
    if (!texto || typeof texto !== 'string') {
        return {
            tipo: 'Não Classificado',
            confianca: 0,
            justificativa: 'Texto vazio ou inválido'
        };
    }

    const textoLower = texto.toLowerCase();

    // Conta matches para cada categoria
    let scoreExterno = 0;
    let matchesExterno = [];

    for (const keyword of KEYWORDS_PLEITO_EXTERNO) {
        if (textoLower.includes(keyword.toLowerCase())) {
            scoreExterno++;
            matchesExterno.push(keyword);
        }
    }

    let scoreInterno = 0;
    let matchesInterno = [];

    for (const keyword of KEYWORDS_ATO_INTERNO) {
        if (textoLower.includes(keyword.toLowerCase())) {
            scoreInterno++;
            matchesInterno.push(keyword);
        }
    }

    // Determina classificação
    const totalMatches = scoreExterno + scoreInterno;

    if (totalMatches === 0) {
        return {
            tipo: 'Não Classificado',
            confianca: 0,
            justificativa: 'Nenhuma palavra-chave identificada'
        };
    }

    if (scoreExterno > scoreInterno) {
        const confianca = Math.min(100, Math.round((scoreExterno / totalMatches) * 100));
        return {
            tipo: 'Pleito Externo',
            confianca,
            justificativa: `Palavras-chave encontradas: ${matchesExterno.slice(0, 5).join(', ')}`
        };
    } else if (scoreInterno > scoreExterno) {
        const confianca = Math.min(100, Math.round((scoreInterno / totalMatches) * 100));
        return {
            tipo: 'Ato Administrativo Interno',
            confianca,
            justificativa: `Palavras-chave encontradas: ${matchesInterno.slice(0, 5).join(', ')}`
        };
    } else {
        // Empate - usa heurística adicional
        // Se menciona empresa/concessionária, provavelmente é externo
        if (textoLower.includes('concessionária') || textoLower.includes('empresa')) {
            return {
                tipo: 'Pleito Externo',
                confianca: 50,
                justificativa: 'Empate resolvido por menção a empresa/concessionária'
            };
        }
        return {
            tipo: 'Pleito Externo',
            confianca: 50,
            justificativa: 'Classificação incerta - padrão para Pleito Externo'
        };
    }
}

/**
 * Classifica a decisão da deliberação
 * @param {string} texto - Texto da deliberação
 * @returns {Object} { decisao, confianca, justificativa }
 */
function classificarDecisao(texto) {
    if (!texto || typeof texto !== 'string') {
        return {
            decisao: 'Não Identificada',
            confianca: 0,
            justificativa: 'Texto vazio ou inválido'
        };
    }

    const textoLower = texto.toLowerCase();

    // Verifica padrões de deferimento
    let matchesDeferido = [];
    for (const pattern of PATTERNS_DEFERIDO) {
        const match = textoLower.match(pattern);
        if (match) {
            matchesDeferido.push(match[0]);
        }
    }

    // Verifica padrões de indeferimento
    let matchesIndeferido = [];
    for (const pattern of PATTERNS_INDEFERIDO) {
        const match = textoLower.match(pattern);
        if (match) {
            matchesIndeferido.push(match[0]);
        }
    }

    const totalDeferido = matchesDeferido.length;
    const totalIndeferido = matchesIndeferido.length;

    if (totalDeferido === 0 && totalIndeferido === 0) {
        return {
            decisao: 'Não Identificada',
            confianca: 0,
            justificativa: 'Nenhum padrão de decisão encontrado'
        };
    }

    // Prioriza a decisão que aparece mais vezes ou por último no texto
    if (totalDeferido > totalIndeferido) {
        const confianca = Math.min(100, 60 + (totalDeferido * 10));
        return {
            decisao: 'Deferido',
            confianca,
            justificativa: `Padrões encontrados: ${matchesDeferido.slice(0, 3).join(', ')}`
        };
    } else if (totalIndeferido > totalDeferido) {
        const confianca = Math.min(100, 60 + (totalIndeferido * 10));
        return {
            decisao: 'Indeferido',
            confianca,
            justificativa: `Padrões encontrados: ${matchesIndeferido.slice(0, 3).join(', ')}`
        };
    } else {
        // Empate - verifica qual aparece por último (decisão final)
        const lastDeferido = findLastPosition(textoLower, matchesDeferido);
        const lastIndeferido = findLastPosition(textoLower, matchesIndeferido);

        if (lastDeferido > lastIndeferido) {
            return {
                decisao: 'Deferido',
                confianca: 55,
                justificativa: 'Decisão final identificada como deferimento'
            };
        } else {
            return {
                decisao: 'Indeferido',
                confianca: 55,
                justificativa: 'Decisão final identificada como indeferimento'
            };
        }
    }
}

/**
 * Encontra a última posição de qualquer termo no texto
 */
function findLastPosition(texto, termos) {
    let lastPos = -1;
    for (const termo of termos) {
        const pos = texto.lastIndexOf(termo.toLowerCase());
        if (pos > lastPos) {
            lastPos = pos;
        }
    }
    return lastPos;
}

/**
 * Infere o microtema da deliberação
 * @param {string} texto - Texto da deliberação
 * @returns {Object} { microtema, confianca, justificativa }
 */
function inferirMicrotema(texto) {
    if (!texto || typeof texto !== 'string') {
        return {
            microtema: 'Não Classificado',
            confianca: 0,
            justificativa: 'Texto vazio ou inválido'
        };
    }

    const textoLower = texto.toLowerCase();

    // Conta matches para cada microtema
    const scores = {};
    const matches = {};

    for (const [microtema, keywords] of Object.entries(MICROTEMAS)) {
        scores[microtema] = 0;
        matches[microtema] = [];

        for (const keyword of keywords) {
            if (textoLower.includes(keyword.toLowerCase())) {
                scores[microtema]++;
                matches[microtema].push(keyword);
            }
        }
    }

    // Encontra o microtema com maior score
    let melhorMicrotema = null;
    let melhorScore = 0;

    for (const [microtema, score] of Object.entries(scores)) {
        if (score > melhorScore) {
            melhorScore = score;
            melhorMicrotema = microtema;
        }
    }

    if (!melhorMicrotema || melhorScore === 0) {
        return {
            microtema: 'Outros',
            confianca: 30,
            justificativa: 'Nenhum microtema específico identificado'
        };
    }

    const confianca = Math.min(100, 50 + (melhorScore * 15));

    return {
        microtema: melhorMicrotema,
        confianca,
        justificativa: `Palavras-chave: ${matches[melhorMicrotema].slice(0, 4).join(', ')}`
    };
}

/**
 * Classifica uma deliberação completa
 * @param {string} texto - Texto da deliberação
 * @param {Object} metadata - Metadados adicionais (opcional)
 * @returns {Object} Classificação completa
 */
function classificarDeliberacao(texto, metadata = {}) {
    const startTime = Date.now();

    logger.info('Classificador', 'Iniciando classificação de deliberação', {
        tamanhoTexto: texto?.length || 0
    });

    const tipo = classificarTipo(texto);
    const decisao = classificarDecisao(texto);
    const microtema = inferirMicrotema(texto);

    const confiancaGeral = Math.round((tipo.confianca + decisao.confianca + microtema.confianca) / 3);

    // Threshold de confiança: se muito baixa, marcar como "A classificar"
    const THRESHOLD_CONFIANCA = 30;
    const decisaoFinal = decisao.confianca < THRESHOLD_CONFIANCA ? 'A classificar' : decisao.decisao;
    const microtemaFinal = microtema.confianca < THRESHOLD_CONFIANCA ? 'A classificar' : microtema.microtema;

    if (decisaoFinal === 'A classificar' || microtemaFinal === 'A classificar') {
        logger.warn('Classificador', 'Confiança abaixo do threshold', {
            decisaoConfianca: decisao.confianca,
            microtemaConfianca: microtema.confianca,
            threshold: THRESHOLD_CONFIANCA
        });
    }

    const resultado = {
        tipo: tipo.tipo,
        tipoConfianca: tipo.confianca,
        tipoJustificativa: tipo.justificativa,

        decisao: decisaoFinal,
        decisaoConfianca: decisao.confianca,
        decisaoJustificativa: decisaoFinal === 'A classificar'
            ? `Confiança (${decisao.confianca}%) abaixo do threshold (${THRESHOLD_CONFIANCA}%)`
            : decisao.justificativa,

        microtema: microtemaFinal,
        microtemaConfianca: microtema.confianca,
        microtemaJustificativa: microtemaFinal === 'A classificar'
            ? `Confiança (${microtema.confianca}%) abaixo do threshold (${THRESHOLD_CONFIANCA}%)`
            : microtema.justificativa,

        confiancaGeral,

        processadoEm: new Date().toISOString(),
        tempoProcessamento: Date.now() - startTime
    };

    logger.info('Classificador', 'Classificação concluída', {
        tipo: resultado.tipo,
        decisao: resultado.decisao,
        microtema: resultado.microtema,
        confiancaGeral: resultado.confiancaGeral,
        tempoMs: resultado.tempoProcessamento
    });

    return resultado;
}

module.exports = {
    classificarTipo,
    classificarDecisao,
    inferirMicrotema,
    classificarDeliberacao,

    // Exporta constantes para testes
    KEYWORDS_PLEITO_EXTERNO,
    KEYWORDS_ATO_INTERNO,
    PATTERNS_DEFERIDO,
    PATTERNS_INDEFERIDO,
    MICROTEMAS
};
