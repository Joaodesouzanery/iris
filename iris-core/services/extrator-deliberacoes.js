/**
 * Extrator de Deliberações - IRIS Core
 *
 * Extrai TODAS as deliberações de um texto de PDF
 * e retorna dados estruturados em formato JSON
 */

// Padrões para identificar deliberações (expandidos)
const PADROES = {
    // Número da deliberação - padrões expandidos
    numeroDeliberacao: [
        /DELIBERA[ÇC][ÃA]O\s*(?:N[ºo°]?\s*)?(\d+[-\/]\d+[-\/]?\d*)/gi,
        /DEL[-\s]?(\d+[-\/]\d+[-\/]?\d*)/gi,
        /N[ºo°]\s*(\d+[-\/]\d+[-\/]?\d*)/gi,
        /DELIBERA[ÇC][ÃA]O\s*(\d+)/gi,
        /ATA\s*(?:N[ºo°]?\s*)?(\d+)/gi,
        /ITEM\s*(?:N[ºo°]?\s*)?(\d+)/gi,
        /PAUTA\s*(?:N[ºo°]?\s*)?(\d+)/gi,
        /(?:^|\s)(\d{3,}[-\/]\d{4})/gm
    ],

    // Reunião ordinária - padrões expandidos
    reuniaoOrdinaria: [
        /(\d+)[ªº°]?\s*REUNI[ÃA]O\s*ORDIN[ÁA]RIA/gi,
        /REUNI[ÃA]O\s*ORDIN[ÁA]RIA\s*(?:N[ºo°]?\s*)?(\d+)/gi,
        /R\.?O\.?\s*(?:N[ºo°]?\s*)?(\d+)/gi,
        /(\d+)[ªº°]?\s*R\.?O\.?/gi,
        /REUNI[ÃA]O\s*(?:N[ºo°]?\s*)?(\d+)/gi,
        /SESS[ÃA]O\s*(?:N[ºo°]?\s*)?(\d+)/gi
    ],

    // Interessado/Requerente - padrões expandidos
    interessado: [
        /INTERESSAD[OA]S?[\s:]+([^\n]+)/gi,
        /REQUERENTE[\s:]+([^\n]+)/gi,
        /SOLICITANTE[\s:]+([^\n]+)/gi,
        /EMPRESA[\s:]+([^\n]+)/gi,
        /CONCESSION[ÁA]RIA[\s:]+([^\n]+)/gi,
        /PLEITEANTE[\s:]+([^\n]+)/gi,
        /AUTOR[\s:]+([^\n]+)/gi,
        /REQUERIDO[\s:]+([^\n]+)/gi,
        /(?:CCR|ECORODOVIAS|ARTERIS|AB CONCESSÕES|ABERTIS|TRIUNFO|RODOVIAS DO TIETÊ|CART|AUTOBAN|VIAOESTE|ECOVIAS|TEBE|TRIÂNGULO DO SOL|CENTROVIAS|AUTOVIAS|INTERVIAS|RENOVIAS|SPVIAS|RODOANEL|ECOPISTAS|RODOVIAS DAS COLINAS|ENTREVIAS|TAMOIOS)/gi
    ],

    // Processo - padrões expandidos
    processo: [
        /PROCESSO[\s:]+([^\n,]+)/gi,
        /ARTESP[-\s]?PRC[-\s]?(\d+[-\/]\d+)/gi,
        /SEI[\s:]+([^\n,]+)/gi,
        /PROC\.?[\s:]+([^\n,]+)/gi,
        /(?:^|\s)((?:ARTESP|SEI)[-\s]?\d+[\d\.\/-]+)/gm,
        /N[ºo°]\s*DO\s*PROCESSO[\s:]+([^\n,]+)/gi
    ],

    // Resultado/Decisão - padrões expandidos
    resultado: {
        deferido: [
            /\bDEFERID[OA]\b/gi,
            /\bAPROVAD[OA]\b/gi,
            /\bHOMOLOGAD[OA]\b/gi,
            /\bAUTORIZAD[OA]\b/gi,
            /\bCONCEDID[OA]\b/gi,
            /\bFAVOR[ÁA]VEL\b/gi,
            /\bPROCEDENTE\b/gi,
            /\bACOLHID[OA]\b/gi,
            /\bDEFERIMENTO\b/gi,
            /\bAPROVA[ÇC][ÃA]O\b/gi
        ],
        indeferido: [
            /\bINDEFERID[OA]\b/gi,
            /\bNEGAD[OA]\b/gi,
            /\bREJEITAD[OA]\b/gi,
            /\bARQUIVAD[OA]\b/gi,
            /\bIMPROCEDENTE\b/gi,
            /\bDESFAVOR[ÁA]VEL\b/gi,
            /\bNÃO\s+HOMOLOGAD[OA]\b/gi,
            /\bINDEFERIMENTO\b/gi,
            /\bNÃO\s+APROVAD[OA]\b/gi
        ]
    }
};

// Microtemas conhecidos
const MICROTEMAS = {
    'reequilibrio': ['reequilíbrio', 'reequilibrio', 'equilíbrio econômico', 'revisão tarifária'],
    'tarifa': ['tarifa', 'pedágio', 'cobrança', 'isenção', 'desconto'],
    'obras': ['obra', 'construção', 'duplicação', 'pavimentação', 'manutenção'],
    'contrato': ['contrato', 'aditivo', 'prorrogação', 'rescisão', 'termo aditivo'],
    'multa': ['multa', 'penalidade', 'sanção', 'advertência', 'infração'],
    'fiscalizacao': ['fiscalização', 'vistoria', 'inspeção', 'auditoria'],
    'seguranca': ['segurança', 'acidente', 'atendimento', 'guincho', 'ambulância'],
    'ambiental': ['ambiental', 'licença', 'compensação', 'fauna', 'flora'],
    'desapropriacao': ['desapropriação', 'faixa de domínio', 'invasão', 'ocupação'],
    'usuario': ['usuário', 'reclamação', 'ouvidoria', 'ressarcimento', 'indenização']
};

// Diretores conhecidos da ARTESP
const DIRETORES = [
    'Milton Persoli',
    'Sergio Massaru Harada',
    'Carlos Eduardo Simões',
    'Antonio Carlos de Almeida',
    'Flavio Augusto Trevisan Saes'
];

/**
 * Extrai todas as deliberações do texto
 * IMPORTANTE: Cada PDF deve gerar pelo menos uma deliberação
 */
function extrairDeliberacoes(texto) {
    if (!texto || texto.length < 50) {
        // Mesmo com texto curto, cria uma deliberação vazia para registrar
        return {
            deliberations: [{
                numero_deliberacao: '',
                reuniao_ordinaria: '',
                interessado: '',
                processo: '',
                microtema: '',
                resultado: '',
                votos_a_favor: [],
                votos_contra: [],
                classificacao: '',
                observacao: 'Texto muito curto para análise completa'
            }]
        };
    }

    const deliberacoes = [];

    // Tenta dividir o texto em seções de deliberação
    const secoes = dividirEmSecoes(texto);

    if (secoes.length === 0) {
        // Se não conseguiu dividir, trata como uma única deliberação
        // SEMPRE adiciona, independente dos campos extraídos
        const delib = extrairDadosDeliberacao(texto);
        deliberacoes.push(delib);
    } else {
        for (const secao of secoes) {
            const delib = extrairDadosDeliberacao(secao);
            deliberacoes.push(delib);
        }
    }

    // GARANTIA: Se ainda não tem deliberações, cria uma com os dados disponíveis
    if (deliberacoes.length === 0) {
        const delib = extrairDadosDeliberacao(texto);
        deliberacoes.push(delib);
    }

    return { deliberations: deliberacoes };
}

/**
 * Divide o texto em seções de deliberação
 */
function dividirEmSecoes(texto) {
    const secoes = [];

    // Padrões que indicam início de nova deliberação
    const separadores = [
        /(?=DELIBERA[ÇC][ÃA]O\s*(?:N[ºo°]?\s*)?\d+)/gi,
        /(?=DEL[-\s]?\d+[-\/])/gi,
        /(?=PROCESSO[\s:]+ARTESP)/gi
    ];

    let partes = [texto];

    for (const sep of separadores) {
        const novasPartes = [];
        for (const parte of partes) {
            const dividido = parte.split(sep).filter(p => p.trim().length > 50);
            novasPartes.push(...dividido);
        }
        if (novasPartes.length > partes.length) {
            partes = novasPartes;
        }
    }

    return partes.length > 1 ? partes : [];
}

/**
 * Extrai dados de uma seção de deliberação
 */
function extrairDadosDeliberacao(texto) {
    const delib = {
        numero_deliberacao: '',
        reuniao_ordinaria: '',
        interessado: '',
        processo: '',
        microtema: '',
        resultado: '',
        votos_a_favor: [],
        votos_contra: [],
        classificacao: ''
    };

    // Extrai número da deliberação
    for (const padrao of PADROES.numeroDeliberacao) {
        const match = texto.match(padrao);
        if (match) {
            delib.numero_deliberacao = match[0].replace(/DELIBERA[ÇC][ÃA]O\s*N[ºo°]?\s*/i, '').trim();
            break;
        }
    }

    // Extrai reunião ordinária
    for (const padrao of PADROES.reuniaoOrdinaria) {
        const match = texto.match(padrao);
        if (match && match[1]) {
            delib.reuniao_ordinaria = match[1];
            break;
        }
    }

    // Extrai interessado
    for (const padrao of PADROES.interessado) {
        const match = texto.match(padrao);
        if (match && match[1]) {
            let interessado = match[1].trim();
            // Limpa o texto
            interessado = interessado.split(/[\n\r]/)[0].trim();
            interessado = interessado.replace(/\s{2,}/g, ' ');
            // Normaliza ARTESP
            if (/ARTESP/i.test(interessado)) {
                interessado = 'ARTESP';
            }
            delib.interessado = interessado;
            break;
        }
    }

    // Extrai processo
    for (const padrao of PADROES.processo) {
        const match = texto.match(padrao);
        if (match) {
            delib.processo = match[0].replace(/PROCESSO[\s:]+/i, '').trim();
            break;
        }
    }

    // Identifica microtema
    const textoLower = texto.toLowerCase();
    for (const [tema, palavras] of Object.entries(MICROTEMAS)) {
        for (const palavra of palavras) {
            if (textoLower.includes(palavra)) {
                delib.microtema = tema;
                break;
            }
        }
        if (delib.microtema) break;
    }

    // Identifica resultado
    let countDeferido = 0;
    let countIndeferido = 0;

    for (const padrao of PADROES.resultado.deferido) {
        const matches = texto.match(padrao);
        if (matches) countDeferido += matches.length;
    }

    for (const padrao of PADROES.resultado.indeferido) {
        const matches = texto.match(padrao);
        if (matches) countIndeferido += matches.length;
    }

    if (countDeferido > countIndeferido) {
        delib.resultado = 'Deferido';
    } else if (countIndeferido > countDeferido) {
        delib.resultado = 'Indeferido';
    }

    // Extrai votos
    const votos = extrairVotos(texto);
    delib.votos_a_favor = votos.favor;
    delib.votos_contra = votos.contra;

    // Classifica como pauta interna se interessado for ARTESP
    if (delib.interessado === 'ARTESP' || textoLower.includes('pauta interna')) {
        delib.classificacao = 'Pauta Interna da Agência';
    }

    return delib;
}

/**
 * Extrai votos dos diretores
 */
function extrairVotos(texto) {
    const votos = { favor: [], contra: [] };

    // Verifica se é votação unânime
    if (/un[âa]nime|unanimidade|por unanimidade/i.test(texto)) {
        // Todos votaram a favor
        for (const diretor of DIRETORES) {
            if (texto.includes(diretor)) {
                votos.favor.push(diretor);
            }
        }
        return votos;
    }

    // Busca votos individuais
    for (const diretor of DIRETORES) {
        if (!texto.includes(diretor)) continue;

        // Pega contexto ao redor do nome
        const idx = texto.indexOf(diretor);
        const contexto = texto.substring(Math.max(0, idx - 100), Math.min(texto.length, idx + 100)).toLowerCase();

        if (/contr[áa]rio|contra|voto vencido|divergente/i.test(contexto)) {
            votos.contra.push(diretor);
        } else if (/favor[áa]vel|favor|aprovou|deferiu/i.test(contexto)) {
            votos.favor.push(diretor);
        } else {
            // Se não encontrou indicação, assume a favor (mais comum)
            votos.favor.push(diretor);
        }
    }

    return votos;
}

/**
 * Analisa texto e retorna JSON estruturado
 */
function analisarTexto(texto) {
    const resultado = extrairDeliberacoes(texto);

    // Adiciona metadados
    resultado.total = resultado.deliberations.length;
    resultado.analisadoEm = new Date().toISOString();

    return resultado;
}

module.exports = {
    extrairDeliberacoes,
    analisarTexto,
    extrairDadosDeliberacao,
    extrairVotos
};
