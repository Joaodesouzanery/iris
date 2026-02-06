/**
 * Extrator de Deliberações - IRIS Core
 *
 * Extrai TODAS as deliberações de um texto de PDF
 * e retorna dados estruturados em formato JSON
 */

// Padrões para identificar deliberações
const PADROES = {
    // Número da deliberação: DEL-001-1234/2025, DELIBERAÇÃO Nº 001, etc.
    numeroDeliberacao: [
        /DELIBERA[ÇC][ÃA]O\s*(?:N[ºo°]?\s*)?(\d+[-\/]\d+[-\/]?\d*)/gi,
        /DEL[-\s]?(\d+[-\/]\d+[-\/]?\d*)/gi,
        /N[ºo°]\s*(\d+[-\/]\d+[-\/]?\d*)/gi
    ],

    // Reunião ordinária
    reuniaoOrdinaria: [
        /(\d+)[ªº°]?\s*REUNI[ÃA]O\s*ORDIN[ÁA]RIA/gi,
        /REUNI[ÃA]O\s*ORDIN[ÁA]RIA\s*(?:N[ºo°]?\s*)?(\d+)/gi,
        /R\.?O\.?\s*(?:N[ºo°]?\s*)?(\d+)/gi
    ],

    // Interessado/Requerente
    interessado: [
        /INTERESSAD[OA]S?[\s:]+([^\n]+)/gi,
        /REQUERENTE[\s:]+([^\n]+)/gi,
        /SOLICITANTE[\s:]+([^\n]+)/gi,
        /EMPRESA[\s:]+([^\n]+)/gi,
        /CONCESSION[ÁA]RIA[\s:]+([^\n]+)/gi
    ],

    // Processo
    processo: [
        /PROCESSO[\s:]+([^\n,]+)/gi,
        /ARTESP[-\s]?PRC[-\s]?(\d+[-\/]\d+)/gi,
        /SEI[\s:]+([^\n,]+)/gi
    ],

    // Resultado/Decisão
    resultado: {
        deferido: [
            /\bDEFERID[OA]\b/gi,
            /\bAPROVAD[OA]\b/gi,
            /\bHOMOLOGAD[OA]\b/gi,
            /\bAUTORIZAD[OA]\b/gi,
            /\bCONCEDID[OA]\b/gi
        ],
        indeferido: [
            /\bINDEFERID[OA]\b/gi,
            /\bNEGAD[OA]\b/gi,
            /\bREJEITAD[OA]\b/gi,
            /\bARQUIVAD[OA]\b/gi,
            /\bIMPROCEDENTE\b/gi
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
 */
function extrairDeliberacoes(texto) {
    if (!texto || texto.length < 100) {
        return { deliberations: [], erro: 'Texto muito curto' };
    }

    const deliberacoes = [];

    // Tenta dividir o texto em seções de deliberação
    const secoes = dividirEmSecoes(texto);

    if (secoes.length === 0) {
        // Se não conseguiu dividir, trata como uma única deliberação
        const delib = extrairDadosDeliberacao(texto);
        if (delib.numero_deliberacao || delib.interessado) {
            deliberacoes.push(delib);
        }
    } else {
        for (const secao of secoes) {
            const delib = extrairDadosDeliberacao(secao);
            if (delib.numero_deliberacao || delib.interessado) {
                deliberacoes.push(delib);
            }
        }
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
