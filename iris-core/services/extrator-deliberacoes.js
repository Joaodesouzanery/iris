/**
 * Extrator de Deliberações - IRIS Core
 *
 * Extrai TODAS as deliberações de um texto de PDF
 * e retorna dados estruturados em formato JSON
 *
 * Suporta múltiplas agências reguladoras:
 * - ARTESP, ANEEL, ANATEL, ANP, ANTT, ANTAQ, ANS, ANVISA, ANA
 */

// ============================================
// CONFIGURAÇÃO POR AGÊNCIA
// ============================================
const AGENCIAS_CONFIG = {
    'ARTESP': {
        nome: 'Agência de Transporte do Estado de São Paulo',
        tipoDocumento: ['DELIBERAÇÃO', 'ATA', 'PAUTA'],
        prefixoProcesso: ['ARTESP-PRC', 'SEI'],
        diretores: ['André Isper', 'Diego Zanatto', 'Fernanda Esbizaro', 'Raquel França'],
        microtemas: ['reequilibrio', 'tarifa', 'obras', 'contrato', 'multa', 'fiscalizacao']
    },
    'ANEEL': {
        nome: 'Agência Nacional de Energia Elétrica',
        tipoDocumento: ['RESOLUÇÃO', 'DESPACHO', 'NOTA TÉCNICA'],
        prefixoProcesso: ['REH', 'REN', 'RGE'],
        diretores: ['Diretor-Geral', 'Diretor'],
        microtemas: ['tarifa', 'reajuste', 'revisao', 'qualidade', 'outorga', 'geracao']
    },
    'ANATEL': {
        nome: 'Agência Nacional de Telecomunicações',
        tipoDocumento: ['RESOLUÇÃO', 'ATO', 'DESPACHO', 'SÚMULA'],
        prefixoProcesso: ['SEI', 'ANATEL'],
        diretores: ['Conselheiro', 'Presidente'],
        microtemas: ['espectro', 'telefonia', 'internet', 'outorga', 'sanção', 'qualidade']
    },
    'ANP': {
        nome: 'Agência Nacional do Petróleo',
        tipoDocumento: ['RESOLUÇÃO', 'DESPACHO', 'AUTORIZAÇÃO'],
        prefixoProcesso: ['ANP', 'SEI'],
        diretores: ['Diretor-Geral', 'Diretor'],
        microtemas: ['exploracao', 'producao', 'refino', 'combustivel', 'gas', 'preco']
    },
    'ANTT': {
        nome: 'Agência Nacional de Transportes Terrestres',
        tipoDocumento: ['DELIBERAÇÃO', 'RESOLUÇÃO', 'PORTARIA'],
        prefixoProcesso: ['ANTT', 'SEI'],
        diretores: ['Diretor-Geral', 'Diretor'],
        microtemas: ['ferrovia', 'rodovia', 'transporte', 'concessao', 'tarifa', 'fiscalizacao']
    },
    'ANTAQ': {
        nome: 'Agência Nacional de Transportes Aquaviários',
        tipoDocumento: ['RESOLUÇÃO', 'DELIBERAÇÃO', 'PORTARIA'],
        prefixoProcesso: ['ANTAQ', 'SEI'],
        diretores: ['Diretor-Geral', 'Diretor'],
        microtemas: ['porto', 'navegacao', 'afretamento', 'concessao', 'tarifa', 'arrendamento']
    },
    'ANS': {
        nome: 'Agência Nacional de Saúde Suplementar',
        tipoDocumento: ['RESOLUÇÃO NORMATIVA', 'RESOLUÇÃO OPERACIONAL', 'SÚMULA'],
        prefixoProcesso: ['ANS', 'SEI'],
        diretores: ['Diretor-Presidente', 'Diretor'],
        microtemas: ['plano', 'cobertura', 'reajuste', 'operadora', 'beneficiario', 'fiscalizacao']
    },
    'ANVISA': {
        nome: 'Agência Nacional de Vigilância Sanitária',
        tipoDocumento: ['RESOLUÇÃO', 'RDC', 'INSTRUÇÃO NORMATIVA'],
        prefixoProcesso: ['ANVISA', 'SEI'],
        diretores: ['Diretor-Presidente', 'Diretor'],
        microtemas: ['registro', 'medicamento', 'alimento', 'cosmetico', 'fiscalizacao', 'importacao']
    },
    'ANA': {
        nome: 'Agência Nacional de Águas',
        tipoDocumento: ['RESOLUÇÃO', 'DELIBERAÇÃO', 'PORTARIA'],
        prefixoProcesso: ['ANA', 'SEI'],
        diretores: ['Diretor-Presidente', 'Diretor'],
        microtemas: ['outorga', 'recursos', 'bacia', 'cobranca', 'seguranca', 'barragem']
    }
};

// ============================================
// NORMALIZAÇÃO DE EMPRESAS (Fuzzy Matching)
// ============================================
const EMPRESAS_NORMALIZADAS = {
    // Grupos de Concessionárias Rodoviárias
    'CCR': ['CCR', 'C.C.R', 'GRUPO CCR', 'CCR S.A', 'CCR SA'],
    'ECORODOVIAS': ['ECORODOVIAS', 'ECO RODOVIAS', 'ECOVIAS', 'ECOPISTAS'],
    'ARTERIS': ['ARTERIS', 'ARTERIS S.A', 'ARTERIS SA'],
    'AB CONCESSÕES': ['AB CONCESSÕES', 'AB CONCESSOES', 'ABERTIS', 'AB'],
    'TRIUNFO': ['TRIUNFO', 'TPI', 'TRIUNFO PARTICIPAÇÕES'],
    // Empresas de Energia
    'CPFL': ['CPFL', 'CPFL ENERGIA', 'CPFL PAULISTA', 'CPFL PIRATININGA'],
    'ENEL': ['ENEL', 'ELETROPAULO', 'ENEL SP', 'ENEL DISTRIBUIÇÃO'],
    'ENERGISA': ['ENERGISA', 'ENERGISA SP', 'ENERGISA MT'],
    'NEOENERGIA': ['NEOENERGIA', 'ELEKTRO', 'COELBA', 'CELPE'],
    'EQUATORIAL': ['EQUATORIAL', 'EQUATORIAL ENERGIA'],
    // Telecomunicações
    'VIVO': ['VIVO', 'TELEFONICA', 'TELEFÔNICA', 'TELEFONICA BRASIL'],
    'CLARO': ['CLARO', 'CLARO S.A', 'NET', 'EMBRATEL'],
    'TIM': ['TIM', 'TIM CELULAR', 'TIM S.A'],
    'OI': ['OI', 'OI S.A', 'OI MÓVEL', 'OI FIXO'],
    // Petróleo e Gás
    'PETROBRAS': ['PETROBRAS', 'PETROBRÁS', 'PETRÓLEO BRASILEIRO'],
    'RAIZEN': ['RAÍZEN', 'RAIZEN', 'COSAN RAIZEN'],
    'IPIRANGA': ['IPIRANGA', 'GRUPO ULTRA', 'ULTRAPAR'],
    'SHELL': ['SHELL', 'SHELL BRASIL'],
    'BR DISTRIBUIDORA': ['BR DISTRIBUIDORA', 'VIBRA', 'VIBRA ENERGIA']
};

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

    // Data da reunião
    dataReuniao: [
        /DATA[\s:]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
        /REALIZADA\s+(?:EM\s+)?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
        /(?:DIA|EM)\s+(\d{1,2})\s+(?:DE\s+)?(JANEIRO|FEVEREIRO|MARÇO|MARCO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\s+(?:DE\s+)?(\d{4})/gi,
        /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g
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

    // Resultado/Decisão - padrões expandidos (incluindo parcialmente deferido)
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
        parcialmenteDeferido: [
            /PARCIALMENTE\s+DEFERIDO/gi,
            /DEFERIDO\s+EM\s+PARTE/gi,
            /PARCIALMENTE\s+PROCEDENTE/gi,
            /PARCIAL(?:MENTE)?\s+APROVAD[OA]/gi,
            /DEFERIDO\s+PARCIALMENTE/gi
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

// Microtemas conhecidos (expandidos para múltiplas agências)
const MICROTEMAS = {
    // Transporte/Rodovias
    'reequilibrio': ['reequilíbrio', 'reequilibrio', 'equilíbrio econômico', 'revisão tarifária', 'reequilíbrio econômico-financeiro', 'revisão extraordinária'],
    'tarifa': ['tarifa', 'pedágio', 'cobrança', 'isenção', 'desconto', 'reajuste tarifário', 'preço público'],
    'obras': ['obra', 'construção', 'duplicação', 'pavimentação', 'manutenção', 'conservação', 'implantação', 'ampliação'],
    'contrato': ['contrato', 'aditivo', 'prorrogação', 'rescisão', 'termo aditivo', 'autorização', 'concessão', 'permissão'],
    'multa': ['multa', 'penalidade', 'sanção', 'advertência', 'infração', 'auto de infração', 'TAC', 'termo de ajustamento'],
    'fiscalizacao': ['fiscalização', 'vistoria', 'inspeção', 'auditoria', 'monitoramento', 'supervisão'],
    'seguranca': ['segurança', 'acidente', 'atendimento', 'guincho', 'ambulância', 'socorro', 'emergência'],
    'ambiental': ['ambiental', 'licença', 'compensação', 'fauna', 'flora', 'meio ambiente', 'impacto ambiental', 'EIA', 'RIMA'],
    'desapropriacao': ['desapropriação', 'faixa de domínio', 'invasão', 'ocupação', 'área non aedificandi', 'servidão'],
    'usuario': ['usuário', 'reclamação', 'ouvidoria', 'ressarcimento', 'indenização', 'dano', 'consumidor'],
    // Energia
    'energia_tarifa': ['tarifa de energia', 'reajuste tarifário', 'revisão tarifária', 'bandeira tarifária', 'encargo setorial'],
    'energia_geracao': ['geração distribuída', 'micro e minigeração', 'fonte renovável', 'solar', 'eólica', 'hidrelétrica'],
    'energia_distribuicao': ['distribuição de energia', 'concessionária', 'permissionária', 'rede elétrica'],
    'energia_qualidade': ['qualidade do fornecimento', 'DEC', 'FEC', 'interrupção', 'compensação'],
    // Telecom
    'telecom_espectro': ['espectro', 'radiofrequência', 'banda', 'MHz', 'GHz', '5G', '4G'],
    'telecom_qualidade': ['qualidade do serviço', 'velocidade', 'banda larga', 'cobertura'],
    'telecom_outorga': ['outorga', 'autorização', 'licença de estação', 'SCM', 'SMP'],
    // Petróleo/Gás
    'petroleo_exploracao': ['exploração', 'produção', 'campo', 'poço', 'bacia sedimentar'],
    'petroleo_refino': ['refino', 'refinaria', 'derivados', 'gasolina', 'diesel', 'GLP'],
    'petroleo_distribuicao': ['distribuição', 'revenda', 'posto', 'combustível', 'preço'],
    // Saúde
    'saude_plano': ['plano de saúde', 'operadora', 'beneficiário', 'cobertura', 'carência'],
    'saude_reajuste': ['reajuste de plano', 'mensalidade', 'sinistralidade', 'ANS'],
    'saude_medicamento': ['medicamento', 'registro', 'genérico', 'similar', 'referência'],
    // Saneamento
    'saneamento_tarifa': ['tarifa de água', 'tarifa de esgoto', 'universalização'],
    'saneamento_qualidade': ['qualidade da água', 'tratamento', 'abastecimento', 'coleta']
};

// Padrões para extração de valores monetários
const PADROES_VALORES = {
    reais: [
        /R\$\s*([\d.,]+)\s*(?:mil|milhão|milhões|bilhão|bilhões)?/gi,
        /(?:valor|montante|quantia|importância)\s*(?:de)?\s*R\$\s*([\d.,]+)/gi
    ],
    porcentagem: [
        /([\d.,]+)\s*%/g,
        /(?:alíquota|taxa|índice)\s*(?:de)?\s*([\d.,]+)\s*%/gi
    ]
};

// Meses em português para conversão de data
const MESES = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
    'abril': '04', 'maio': '05', 'junho': '06',
    'julho': '07', 'agosto': '08', 'setembro': '09',
    'outubro': '10', 'novembro': '11', 'dezembro': '12'
};

// Diretores conhecidos da ARTESP (atualizados 2024-2025)
const DIRETORES = [
    // Diretoria atual (2024-2025)
    { nome: 'André Isper Rodrigues Barnabé', aliases: ['Andre Isper', 'Isper', 'Barnabé', 'Barnabe'] },
    { nome: 'Diego Albert Zanatto', aliases: ['Diego Zanatto', 'Zanatto', 'Diego Albert'] },
    { nome: 'Fernanda Esbizaro Rodrigues Rudnik', aliases: ['Fernanda Esbizaro', 'Esbizaro', 'Rudnik'] },
    { nome: 'Raquel França Carneiro', aliases: ['Raquel França', 'Raquel Franca', 'França', 'Carneiro'] },
    // Diretoria anterior (para PDFs históricos)
    { nome: 'Milton Persoli', aliases: ['Persoli'] },
    { nome: 'Sergio Massaru Harada', aliases: ['Sergio Harada', 'Harada', 'Massaru'] },
    { nome: 'Carlos Eduardo Simões', aliases: ['Carlos Simões', 'Carlos Simoes', 'Simões'] },
    { nome: 'Antonio Carlos de Almeida', aliases: ['Antonio Almeida', 'Almeida'] },
    { nome: 'Flavio Augusto Trevisan Saes', aliases: ['Flavio Saes', 'Trevisan', 'Saes'] }
];

/**
 * Extrai todas as deliberações do texto
 * IMPORTANTE: Cada PDF deve gerar pelo menos uma deliberação
 */
function extrairDeliberacoes(texto, agencia = 'ARTESP') {
    if (!texto || texto.length < 50) {
        // Mesmo com texto curto, cria uma deliberação vazia para registrar
        return {
            deliberations: [{
                numero_deliberacao: '',
                reuniao_ordinaria: '',
                data_reuniao: '',
                interessado: '',
                processo: '',
                microtema: '',
                resultado: '',
                votos_a_favor: [],
                votos_contra: [],
                classificacao: null,
                agencia: agencia,
                observacao: 'Texto muito curto para análise completa'
            }],
            total: 1
        };
    }

    const deliberacoes = [];

    // Tenta dividir o texto em seções de deliberação
    const secoes = dividirEmSecoes(texto);

    if (secoes.length === 0) {
        // Se não conseguiu dividir, trata como uma única deliberação
        const delib = extrairDadosDeliberacao(texto, agencia);
        deliberacoes.push(delib);
    } else {
        for (const secao of secoes) {
            const delib = extrairDadosDeliberacao(secao, agencia);
            deliberacoes.push(delib);
        }
    }

    // GARANTIA: Se ainda não tem deliberações, cria uma com os dados disponíveis
    if (deliberacoes.length === 0) {
        const delib = extrairDadosDeliberacao(texto, agencia);
        deliberacoes.push(delib);
    }

    return {
        deliberations: deliberacoes,
        total: deliberacoes.length,
        analisadoEm: new Date().toISOString()
    };
}

/**
 * Divide o texto em seções de deliberação
 * Usa múltiplos separadores e valida que cada seção tem conteúdo relevante
 */
function dividirEmSecoes(texto) {
    // Padrões que indicam início de nova deliberação (em ordem de especificidade)
    const separadores = [
        /(?=DELIBERA[ÇC][ÃA]O\s*(?:N[ºo°]?\s*)?\d+)/gi,
        /(?=DEL[-\s]?\d+[-\/])/gi,
        /(?=PROCESSO[\s:]+(?:ARTESP|SEI))/gi,
        /(?=ITEM\s*(?:N[ºo°]?\s*)?\d+\s*[-–:])/gi,
        /(?=PAUTA\s*(?:N[ºo°]?\s*)?\d+\s*[-–:])/gi
    ];

    let melhorDivisao = [texto];

    for (const sep of separadores) {
        const partes = texto.split(sep).filter(p => p.trim().length > 50);
        if (partes.length > melhorDivisao.length) {
            melhorDivisao = partes;
        }
    }

    // Valida que cada seção tem algum conteúdo substantivo
    // (pelo menos um número de processo, data, ou palavra-chave de deliberação)
    const secoesValidadas = melhorDivisao.filter(secao => {
        const temNumero = /\d+[-\/]\d+/i.test(secao);
        const temPalavraChave = /delibera|processo|interessad|requerent|deferido|indeferido/i.test(secao);
        return temNumero || temPalavraChave;
    });

    return secoesValidadas.length > 1 ? secoesValidadas : [];
}

/**
 * Extrai dados de uma seção de deliberação
 */
function extrairDadosDeliberacao(texto, agencia = 'ARTESP') {
    const delib = {
        numero_deliberacao: '',
        reuniao_ordinaria: '',
        data_reuniao: '',
        interessado: '',
        processo: '',
        microtema: '',
        microtemas: [],
        resultado: '',
        votos_a_favor: [],
        votos_contra: [],
        classificacao: null,
        confianca: 0,
        agencia: agencia
    };

    // Extrai número da deliberação
    for (const padrao of PADROES.numeroDeliberacao) {
        const match = texto.match(padrao);
        if (match) {
            let numero = match[0].replace(/DELIBERA[ÇC][ÃA]O\s*N[ºo°]?\s*/i, '').trim();
            numero = numero.replace(/DEL[-\s]?/i, 'DEL-');
            delib.numero_deliberacao = numero;
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

    // Extrai data da reunião
    delib.data_reuniao = extrairDataReuniao(texto);

    // Extrai interessado
    for (const padrao of PADROES.interessado) {
        const match = texto.match(padrao);
        if (match) {
            let interessado = match[1] ? match[1].trim() : match[0].trim();
            // Limpa o texto
            interessado = interessado.split(/[\n\r]/)[0].trim();
            interessado = interessado.replace(/\s{2,}/g, ' ');
            // Remove pontuação final
            interessado = interessado.replace(/[.:;,]+$/, '').trim();
            // Se muito longo, trunca
            if (interessado.length > 100) {
                interessado = interessado.substring(0, 100) + '...';
            }
            // Normaliza ARTESP se for pauta interna
            if (/^ARTESP$/i.test(interessado) || interessado === '') {
                interessado = 'Sem interessado';
            }
            delib.interessado = interessado;
            break;
        }
    }

    // Se não encontrou interessado, verifica se é pauta interna
    if (!delib.interessado || delib.interessado === 'Sem interessado') {
        if (/pauta\s+interna|ato\s+administrativo|portaria|designa[çc][ãa]o/i.test(texto)) {
            delib.interessado = 'Sem interessado';
            delib.classificacao = 'Pauta Interna da Agência';
        }
    }

    // Extrai processo
    for (const padrao of PADROES.processo) {
        const match = texto.match(padrao);
        if (match) {
            let processo = match[1] ? match[1].trim() : match[0].replace(/PROCESSO[\s:]+/i, '').trim();
            processo = processo.split(/[\n\r]/)[0].trim();
            processo = processo.replace(/[.:;,]+$/, '').trim();
            if (processo.length > 5) {
                delib.processo = processo;
                break;
            }
        }
    }

    // Identifica microtemas (múltiplos permitidos)
    const textoLower = texto.toLowerCase();
    const microtemasEncontrados = [];
    for (const [tema, palavras] of Object.entries(MICROTEMAS)) {
        for (const palavra of palavras) {
            if (textoLower.includes(palavra.toLowerCase())) {
                microtemasEncontrados.push(tema);
                break;
            }
        }
    }
    // Campo principal mantém o primeiro (compatibilidade), novo campo tem todos
    delib.microtema = microtemasEncontrados[0] || '';
    delib.microtemas = microtemasEncontrados;

    // Identifica resultado buscando na frase de decisão (deliberou/decide/resolve)
    // Em vez de contar no texto todo, primeiro tenta localizar a frase decisória
    const frasesDecisao = texto.match(/(?:deliberou?|decid[eiu]|resolve[ur]?|result(?:ou|ado)|voto)[^\n.;]{0,300}/gi) || [];
    const textoDecisao = frasesDecisao.length > 0 ? frasesDecisao.join(' ') : texto;

    let countDeferido = 0;
    let countParcial = 0;
    let countIndeferido = 0;

    // Verifica parcialmente deferido primeiro (mais específico)
    for (const padrao of PADROES.resultado.parcialmenteDeferido) {
        const matches = textoDecisao.match(padrao);
        if (matches) countParcial += matches.length;
    }

    for (const padrao of PADROES.resultado.deferido) {
        const matches = textoDecisao.match(padrao);
        if (matches) countDeferido += matches.length;
    }

    for (const padrao of PADROES.resultado.indeferido) {
        const matches = textoDecisao.match(padrao);
        if (matches) countIndeferido += matches.length;
    }

    // Verifica negações comuns que invertem o resultado
    const negacoes = textoDecisao.match(/n[ãa]o\s+(?:foi\s+)?(?:deferido|aprovado|homologado|autorizado)/gi) || [];
    if (negacoes.length > 0) {
        // Cada negação converte um deferido em indeferido
        countDeferido = Math.max(0, countDeferido - negacoes.length);
        countIndeferido += negacoes.length;
    }

    // Parcialmente deferido tem prioridade
    if (countParcial > 0) {
        delib.resultado = 'Parcialmente Deferido';
    } else if (countDeferido > countIndeferido) {
        delib.resultado = 'Deferido';
    } else if (countIndeferido > countDeferido) {
        delib.resultado = 'Indeferido';
    } else if (countDeferido > 0) {
        // Empate: verifica qual aparece por último no texto (decisão final)
        let lastDeferido = -1;
        let lastIndeferido = -1;
        for (const padrao of PADROES.resultado.deferido) {
            let m; const re = new RegExp(padrao.source, padrao.flags);
            while ((m = re.exec(textoDecisao)) !== null) lastDeferido = Math.max(lastDeferido, m.index);
        }
        for (const padrao of PADROES.resultado.indeferido) {
            let m; const re = new RegExp(padrao.source, padrao.flags);
            while ((m = re.exec(textoDecisao)) !== null) lastIndeferido = Math.max(lastIndeferido, m.index);
        }
        delib.resultado = lastIndeferido > lastDeferido ? 'Indeferido' : 'Deferido';
    }

    // Extrai votos
    const votos = extrairVotos(texto);
    delib.votos_a_favor = votos.favor;
    delib.votos_contra = votos.contra;

    // Classifica como pauta interna se interessado for ARTESP ou vazio
    if (delib.interessado === 'Sem interessado' || textoLower.includes('pauta interna')) {
        delib.classificacao = 'Pauta Interna da Agência';
    }

    // Calcula confiança da extração
    delib.confianca = calcularConfianca(delib);

    return delib;
}

/**
 * Valida uma data extraída (dia, mês, ano)
 * @returns {string|null} Data no formato YYYY-MM-DD ou null se inválida
 */
function validarData(dia, mes, ano) {
    const d = parseInt(dia, 10);
    const m = parseInt(mes, 10);
    const a = parseInt(ano, 10);

    // Validações básicas
    if (isNaN(d) || isNaN(m) || isNaN(a)) return null;
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;
    if (a < 1990 || a > 2099) return null;

    // Dias máximos por mês (considerando ano bissexto)
    const diasPorMes = [31, ((a % 4 === 0 && a % 100 !== 0) || a % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (d > diasPorMes[m - 1]) return null;

    return `${String(a).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Extrai data da reunião do texto
 */
function extrairDataReuniao(texto) {
    // Tenta formato DD/MM/YYYY ou DD-MM-YYYY
    const matchNumerico = texto.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (matchNumerico) {
        let dia = matchNumerico[1];
        let mes = matchNumerico[2];
        let ano = matchNumerico[3];
        if (ano.length === 2) {
            ano = '20' + ano;
        }
        const dataValidada = validarData(dia, mes, ano);
        if (dataValidada) return dataValidada;
    }

    // Tenta formato "DD de MÊS de YYYY"
    const matchExtenso = texto.match(/(\d{1,2})\s+(?:de\s+)?(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(?:de\s+)?(\d{4})/i);
    if (matchExtenso) {
        const dia = matchExtenso[1];
        const mes = MESES[matchExtenso[2].toLowerCase()];
        const ano = matchExtenso[3];
        const dataValidada = validarData(dia, mes, ano);
        if (dataValidada) return dataValidada;
    }

    return '';
}

/**
 * Extrai votos dos diretores
 */
function extrairVotos(texto) {
    const votos = { favor: [], contra: [] };
    const textoUpper = texto.toUpperCase();

    // Verifica se é votação unânime
    const ehUnanimidade = /UN[ÂA]NIME|UNANIMIDADE|POR\s+UNANIMIDADE|VOTA[ÇC][ÃA]O\s+UN[ÂA]NIME/i.test(texto);

    // Encontra diretores mencionados no texto
    const diretoresMencionados = [];
    for (const diretor of DIRETORES) {
        // Verifica nome completo ou aliases
        const nomeUpper = diretor.nome.toUpperCase();
        if (textoUpper.includes(nomeUpper)) {
            diretoresMencionados.push(diretor.nome);
            continue;
        }
        // Verifica aliases
        for (const alias of diretor.aliases) {
            if (textoUpper.includes(alias.toUpperCase())) {
                diretoresMencionados.push(diretor.nome);
                break;
            }
        }
    }

    // Se unanimidade, todos a favor
    if (ehUnanimidade) {
        votos.favor = diretoresMencionados;
        return votos;
    }

    // Busca votos individuais - apenas atribui se houver evidência explícita
    for (const nomeCompleto of diretoresMencionados) {
        // Pega contexto ao redor do nome
        const idx = textoUpper.indexOf(nomeCompleto.toUpperCase());
        if (idx === -1) continue;

        const contexto = texto.substring(Math.max(0, idx - 150), Math.min(texto.length, idx + 150)).toLowerCase();

        // Padrões que indicam voto contra
        if (/contr[áa]rio|voto\s+contra|voto\s+vencido|divergente|discordou|se\s+opôs|votou\s+contra/i.test(contexto)) {
            votos.contra.push(nomeCompleto);
        }
        // Padrões que indicam voto a favor explicitamente
        else if (/favor[áa]vel|voto\s+a\s+favor|aprovou|deferiu|concordou|acompanhou|votou\s+(?:pela\s+)?aprova/i.test(contexto)) {
            votos.favor.push(nomeCompleto);
        }
        // Sem indicação explícita: NÃO presumir voto - registrar apenas como mencionado
        // (evita falsos positivos de assinaturas de testemunha ou menções contextuais)
    }

    return votos;
}

/**
 * Analisa texto e retorna JSON estruturado
 */
function analisarTexto(texto, agencia = null) {
    // Detecta agência automaticamente se não fornecida
    if (!agencia) {
        agencia = detectarAgencia(texto);
    }
    return extrairDeliberacoes(texto, agencia);
}

/**
 * Detecta automaticamente a agência reguladora do texto
 */
function detectarAgencia(texto) {
    const textoUpper = texto.toUpperCase();

    // Pontuação por agência
    const scores = {};

    for (const [sigla, config] of Object.entries(AGENCIAS_CONFIG)) {
        scores[sigla] = 0;

        // Verifica menção à sigla
        const regexSigla = new RegExp(`\\b${sigla}\\b`, 'g');
        const matchesSigla = textoUpper.match(regexSigla);
        if (matchesSigla) {
            scores[sigla] += matchesSigla.length * 10;
        }

        // Verifica tipos de documento
        for (const tipo of config.tipoDocumento) {
            if (textoUpper.includes(tipo.toUpperCase())) {
                scores[sigla] += 5;
            }
        }

        // Verifica prefixos de processo
        for (const prefixo of config.prefixoProcesso) {
            if (textoUpper.includes(prefixo.toUpperCase())) {
                scores[sigla] += 8;
            }
        }
    }

    // Retorna a agência com maior pontuação
    let melhorAgencia = 'ARTESP'; // Default
    let melhorScore = 0;

    for (const [sigla, score] of Object.entries(scores)) {
        if (score > melhorScore) {
            melhorScore = score;
            melhorAgencia = sigla;
        }
    }

    return melhorAgencia;
}

/**
 * Normaliza nome de empresa usando fuzzy matching
 */
function normalizarEmpresa(nome) {
    if (!nome) return nome;

    const nomeUpper = nome.toUpperCase().trim();

    for (const [normalizado, variacoes] of Object.entries(EMPRESAS_NORMALIZADAS)) {
        for (const variacao of variacoes) {
            if (nomeUpper.includes(variacao.toUpperCase())) {
                return normalizado;
            }
        }
    }

    // Se não encontrou, retorna o nome original limpo
    return nome.replace(/\s+/g, ' ').trim();
}

/**
 * Extrai todas as empresas mencionadas no texto
 */
function extrairEmpresas(texto) {
    const empresas = new Set();
    const textoUpper = texto.toUpperCase();

    for (const [normalizado, variacoes] of Object.entries(EMPRESAS_NORMALIZADAS)) {
        for (const variacao of variacoes) {
            if (textoUpper.includes(variacao.toUpperCase())) {
                empresas.add(normalizado);
                break;
            }
        }
    }

    return Array.from(empresas);
}

/**
 * Calcula confiança da extração (0-100)
 */
function calcularConfianca(delib) {
    let confianca = 0;

    if (delib.numero_deliberacao) confianca += 20;
    if (delib.data_reuniao) confianca += 15;
    if (delib.interessado && delib.interessado !== 'Sem interessado') confianca += 20;
    if (delib.processo) confianca += 15;
    if (delib.microtema) confianca += 10;
    if (delib.resultado) confianca += 15;
    if (delib.votos_a_favor.length > 0 || delib.votos_contra.length > 0) confianca += 5;

    return Math.min(100, confianca);
}

/**
 * Extrai valores monetários do texto
 */
function extrairValoresMonetarios(texto) {
    const valores = [];

    for (const padrao of PADROES_VALORES.reais) {
        let match;
        const regex = new RegExp(padrao.source, padrao.flags);
        while ((match = regex.exec(texto)) !== null) {
            let valor = match[1] || match[0];
            valor = valor.replace(/R\$\s*/gi, '').trim();

            // Converte para número
            let numerico = parseFloat(valor.replace(/\./g, '').replace(',', '.'));

            // Multiplica se tiver sufixo
            const textoAoRedor = texto.substring(Math.max(0, match.index - 10), match.index + match[0].length + 20).toLowerCase();
            if (/bilh[ãõo]/i.test(textoAoRedor)) numerico *= 1000000000;
            else if (/milh[ãõo]/i.test(textoAoRedor)) numerico *= 1000000;
            else if (/mil\b/i.test(textoAoRedor)) numerico *= 1000;

            if (!isNaN(numerico) && numerico > 0) {
                valores.push({
                    original: match[0],
                    numerico: numerico,
                    formatado: numerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                });
            }
        }
    }

    // Remove duplicatas e ordena por valor
    const unicos = [...new Map(valores.map(v => [v.numerico, v])).values()];
    return unicos.sort((a, b) => b.numerico - a.numerico);
}

/**
 * Extrai CNPJs do texto
 */
function extrairCNPJs(texto) {
    const cnpjs = [];
    const regex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g;
    let match;
    while ((match = regex.exec(texto)) !== null) {
        if (!cnpjs.includes(match[0])) {
            cnpjs.push(match[0]);
        }
    }
    return cnpjs;
}

/**
 * Extrai CPFs do texto (mascarados para LGPD)
 */
function extrairCPFs(texto) {
    const cpfs = [];
    const regex = /\d{3}\.\d{3}\.\d{3}-\d{2}/g;
    let match;
    while ((match = regex.exec(texto)) !== null) {
        // Mascara os dígitos centrais para LGPD
        const mascarado = match[0].replace(/(\d{3})\.\d{3}\.\d{3}(-\d{2})/, '$1.***.***$2');
        if (!cpfs.includes(mascarado)) {
            cpfs.push(mascarado);
        }
    }
    return cpfs;
}

/**
 * Identifica todos os microtemas presentes no texto
 */
function identificarTodosMicrotemas(texto) {
    const encontrados = [];
    const textoLower = texto.toLowerCase();

    for (const [tema, palavras] of Object.entries(MICROTEMAS)) {
        for (const palavra of palavras) {
            if (textoLower.includes(palavra.toLowerCase())) {
                if (!encontrados.includes(tema)) {
                    encontrados.push(tema);
                }
                break;
            }
        }
    }

    return encontrados;
}

/**
 * Versão aprimorada da extração com suporte multi-agência
 */
function extrairDeliberacoesMultiAgencia(texto, agenciaFornecida = null) {
    const agencia = agenciaFornecida || detectarAgencia(texto);
    const resultado = extrairDeliberacoes(texto, agencia);

    // Extrai dados globais do texto
    const valoresMonetarios = extrairValoresMonetarios(texto);
    const cnpjs = extrairCNPJs(texto);
    const cpfs = extrairCPFs(texto);
    const todosMicrotemas = identificarTodosMicrotemas(texto);

    // Enriquece com dados adicionais
    resultado.deliberations = resultado.deliberations.map(delib => {
        // Normaliza empresa interessada
        if (delib.interessado) {
            delib.interessado_normalizado = normalizarEmpresa(delib.interessado);
        }

        // Extrai empresas mencionadas
        delib.empresas_mencionadas = extrairEmpresas(texto);

        // Calcula confiança
        delib.confianca = calcularConfianca(delib);

        // Adiciona metadata da agência
        delib.agencia_config = {
            sigla: agencia,
            nome: AGENCIAS_CONFIG[agencia]?.nome || agencia
        };

        // Adiciona valores monetários encontrados
        delib.valores_monetarios = valoresMonetarios;

        // Adiciona CNPJs e CPFs (mascarados)
        delib.cnpjs_mencionados = cnpjs;
        delib.cpfs_mencionados = cpfs;

        // Adiciona todos os microtemas identificados
        delib.microtemas_identificados = todosMicrotemas;

        return delib;
    });

    resultado.agencia_detectada = agencia;
    resultado.metadados = {
        total_valores: valoresMonetarios.length,
        valor_total: valoresMonetarios.reduce((sum, v) => sum + v.numerico, 0),
        total_cnpjs: cnpjs.length,
        total_cpfs: cpfs.length,
        microtemas: todosMicrotemas
    };

    return resultado;
}

// ============================================
// EXTRAÇÃO DE PRAZOS E DATAS LIMITE
// ============================================
const PADROES_PRAZOS = [
    // Prazos em dias
    /(?:prazo|no prazo)\s*(?:de|máximo de)?\s*(\d+)\s*(?:dias?\s*(?:úteis|corridos)?)/gi,
    /(?:no prazo de|em até)\s*(\d+)\s*dias?/gi,
    // Prazos em meses/anos
    /(?:prazo de|em)\s*(\d+)\s*(?:meses?|anos?)/gi,
    // Datas específicas
    /(?:até|data limite|prazo final|vencimento em|vigência até)\s*[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
    /(?:até|data limite)\s*[:\s]*(\d{1,2}\s*(?:de\s*)?\w+\s*(?:de\s*)?\d{2,4})/gi,
    // Prazos relativos
    /(?:dentro de|no período de)\s*(\d+)\s*(?:dias?|meses?|anos?)/gi
];

/**
 * Extrai prazos e datas limite do texto
 */
function extrairPrazos(texto) {
    const prazos = [];

    for (const padrao of PADROES_PRAZOS) {
        let match;
        const regex = new RegExp(padrao.source, padrao.flags);
        while ((match = regex.exec(texto)) !== null) {
            const contexto = texto.substring(
                Math.max(0, match.index - 50),
                Math.min(texto.length, match.index + match[0].length + 50)
            ).replace(/\s+/g, ' ').trim();

            // Determina tipo do prazo
            let tipo = 'indefinido';
            const textoMatch = match[0].toLowerCase();
            if (/dias?\s*úteis/i.test(textoMatch)) tipo = 'dias_uteis';
            else if (/dias?(?:\s*corridos)?/i.test(textoMatch)) tipo = 'dias_corridos';
            else if (/meses?/i.test(textoMatch)) tipo = 'meses';
            else if (/anos?/i.test(textoMatch)) tipo = 'anos';
            else if (/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(match[1] || '')) tipo = 'data_especifica';

            // Extrai valor numérico se existir
            const valorNumerico = parseInt(match[1]) || null;

            // Calcula data estimada se possível
            let dataEstimada = null;
            if (valorNumerico && tipo !== 'data_especifica' && tipo !== 'indefinido') {
                const hoje = new Date();
                if (tipo === 'dias_corridos' || tipo === 'dias_uteis') {
                    hoje.setDate(hoje.getDate() + valorNumerico);
                } else if (tipo === 'meses') {
                    hoje.setMonth(hoje.getMonth() + valorNumerico);
                } else if (tipo === 'anos') {
                    hoje.setFullYear(hoje.getFullYear() + valorNumerico);
                }
                dataEstimada = hoje.toISOString().split('T')[0];
            }

            prazos.push({
                texto_original: match[0].trim(),
                valor: valorNumerico,
                tipo: tipo,
                data_estimada: dataEstimada,
                contexto: contexto
            });
        }
    }

    // Remove duplicatas
    const unicos = prazos.filter((p, idx, arr) =>
        arr.findIndex(x => x.texto_original === p.texto_original) === idx
    );

    return unicos;
}

// ============================================
// EXTRAÇÃO DE RODOVIAS E TRECHOS
// ============================================
const PADROES_RODOVIAS = {
    // Rodovias estaduais
    estaduais: [
        /\b(SP[-\s]?\d{3})/gi,           // SP-XXX
        /\b(PR[-\s]?\d{3})/gi,           // PR-XXX
        /\b(MG[-\s]?\d{3})/gi,           // MG-XXX
        /\b(RJ[-\s]?\d{3})/gi,           // RJ-XXX
        /\b(RS[-\s]?\d{3})/gi,           // RS-XXX
        /\b(BA[-\s]?\d{3})/gi,           // BA-XXX
        /\b(SC[-\s]?\d{3})/gi,           // SC-XXX
        /\b(GO[-\s]?\d{3})/gi,           // GO-XXX
        /\b(MT[-\s]?\d{3})/gi,           // MT-XXX
        /\b(MS[-\s]?\d{3})/gi,           // MS-XXX
        /\b(PE[-\s]?\d{3})/gi,           // PE-XXX
        /\b(CE[-\s]?\d{3})/gi,           // CE-XXX
    ],
    // Rodovias federais
    federais: [
        /\b(BR[-\s]?\d{3})/gi,           // BR-XXX
    ],
    // Trechos específicos
    trechos: [
        /(?:km|quilômetro)\s*(\d+(?:[,\.]\d+)?)\s*(?:ao?\s*(?:km|quilômetro)\s*(\d+(?:[,\.]\d+)?))?/gi,
        /(?:entre\s*(?:os?\s*)?(?:km|quilômetros?)\s*)(\d+(?:[,\.]\d+)?)\s*(?:e|a)\s*(\d+(?:[,\.]\d+)?)/gi
    ],
    // Nomes de rodovias conhecidas
    nomes: [
        /\b(Anhanguera)\b/gi,
        /\b(Bandeirantes)\b/gi,
        /\b(Imigrantes)\b/gi,
        /\b(Anchieta)\b/gi,
        /\b(Raposo Tavares)\b/gi,
        /\b(Castelo Branco)\b/gi,
        /\b(Presidente Dutra)\b/gi,
        /\b(Fernão Dias)\b/gi,
        /\b(Régis Bittencourt)\b/gi,
        /\b(Via Dutra)\b/gi,
        /\b(Ayrton Senna)\b/gi,
        /\b(Carvalho Pinto)\b/gi,
        /\b(Dom Pedro I)\b/gi,
        /\b(Washington Luís)\b/gi,
        /\b(Marechal Rondon)\b/gi
    ]
};

/**
 * Extrai rodovias e trechos mencionados no texto
 */
function extrairRodovias(texto) {
    const rodovias = [];

    // Extrai rodovias estaduais
    for (const padrao of PADROES_RODOVIAS.estaduais) {
        let match;
        const regex = new RegExp(padrao.source, padrao.flags);
        while ((match = regex.exec(texto)) !== null) {
            const codigo = match[1].replace(/\s+/g, '-').toUpperCase();
            if (!rodovias.find(r => r.codigo === codigo)) {
                rodovias.push({
                    codigo: codigo,
                    tipo: 'estadual',
                    estado: codigo.substring(0, 2)
                });
            }
        }
    }

    // Extrai rodovias federais
    for (const padrao of PADROES_RODOVIAS.federais) {
        let match;
        const regex = new RegExp(padrao.source, padrao.flags);
        while ((match = regex.exec(texto)) !== null) {
            const codigo = match[1].replace(/\s+/g, '-').toUpperCase();
            if (!rodovias.find(r => r.codigo === codigo)) {
                rodovias.push({
                    codigo: codigo,
                    tipo: 'federal',
                    estado: null
                });
            }
        }
    }

    // Extrai nomes de rodovias conhecidas
    for (const padrao of PADROES_RODOVIAS.nomes) {
        let match;
        const regex = new RegExp(padrao.source, padrao.flags);
        while ((match = regex.exec(texto)) !== null) {
            const nome = match[1];
            if (!rodovias.find(r => r.nome === nome)) {
                rodovias.push({
                    nome: nome,
                    tipo: 'rodovia_nomeada',
                    codigo: null
                });
            }
        }
    }

    // Extrai trechos (km inicial a km final)
    const trechos = [];
    for (const padrao of PADROES_RODOVIAS.trechos) {
        let match;
        const regex = new RegExp(padrao.source, padrao.flags);
        while ((match = regex.exec(texto)) !== null) {
            const kmInicial = parseFloat((match[1] || '').replace(',', '.'));
            const kmFinal = match[2] ? parseFloat(match[2].replace(',', '.')) : null;

            if (!isNaN(kmInicial)) {
                trechos.push({
                    km_inicial: kmInicial,
                    km_final: kmFinal,
                    extensao: kmFinal ? Math.abs(kmFinal - kmInicial) : null
                });
            }
        }
    }

    return {
        rodovias: rodovias,
        trechos: trechos,
        total_rodovias: rodovias.length,
        total_trechos: trechos.length
    };
}

// ============================================
// ANÁLISE DE SENTIMENTO DA DECISÃO
// ============================================
const DICIONARIO_SENTIMENTO = {
    // Palavras positivas (favoráveis)
    positivo: [
        'aprovado', 'aprovada', 'deferido', 'deferida', 'homologado', 'homologada',
        'autorizado', 'autorizada', 'concedido', 'concedida', 'aceito', 'aceita',
        'procedente', 'favorável', 'acolhido', 'acolhida', 'validado', 'validada',
        'ratificado', 'ratificada', 'confirmado', 'confirmada', 'reconhecido',
        'benefício', 'beneficia', 'ganho', 'êxito', 'sucesso', 'adequado',
        'regular', 'conforme', 'atendido', 'satisfatório', 'cumprido'
    ],
    // Palavras negativas (desfavoráveis)
    negativo: [
        'indeferido', 'indeferida', 'negado', 'negada', 'rejeitado', 'rejeitada',
        'arquivado', 'arquivada', 'improcedente', 'desfavorável', 'cassado', 'cassada',
        'revogado', 'revogada', 'anulado', 'anulada', 'cancelado', 'cancelada',
        'multa', 'penalidade', 'sanção', 'infração', 'irregularidade', 'descumprimento',
        'violação', 'inadimplência', 'falha', 'deficiência', 'irregularidades',
        'advertência', 'notificação', 'intimação', 'autuação', 'embargo'
    ],
    // Palavras neutras/procedimentais
    neutro: [
        'encaminhado', 'encaminhada', 'remetido', 'remetida', 'informado', 'informada',
        'comunicado', 'comunicada', 'notificado', 'notificada', 'publicado', 'publicada',
        'registrado', 'registrada', 'protocolado', 'protocolada', 'autuado', 'autuada',
        'juntado', 'juntada', 'anexado', 'anexada', 'sobrestado', 'sobrestada',
        'suspenso', 'suspensa', 'adiado', 'adiada', 'prorrogado', 'prorrogada'
    ],
    // Intensificadores
    intensificadores: [
        'muito', 'extremamente', 'totalmente', 'completamente', 'integralmente',
        'parcialmente', 'em parte', 'significativamente', 'gravemente'
    ]
};

/**
 * Analisa o sentimento/tom da deliberação
 */
function analisarSentimento(texto) {
    const textoLower = texto.toLowerCase();
    const palavrasTexto = textoLower.split(/\s+/);

    let scorePositivo = 0;
    let scoreNegativo = 0;
    let scoreNeutro = 0;

    const palavrasEncontradas = {
        positivas: [],
        negativas: [],
        neutras: []
    };

    // Conta ocorrências de cada categoria
    for (const palavra of DICIONARIO_SENTIMENTO.positivo) {
        const regex = new RegExp(`\\b${palavra}\\b`, 'gi');
        const matches = textoLower.match(regex);
        if (matches) {
            scorePositivo += matches.length;
            if (!palavrasEncontradas.positivas.includes(palavra)) {
                palavrasEncontradas.positivas.push(palavra);
            }
        }
    }

    for (const palavra of DICIONARIO_SENTIMENTO.negativo) {
        const regex = new RegExp(`\\b${palavra}\\b`, 'gi');
        const matches = textoLower.match(regex);
        if (matches) {
            scoreNegativo += matches.length;
            if (!palavrasEncontradas.negativas.includes(palavra)) {
                palavrasEncontradas.negativas.push(palavra);
            }
        }
    }

    for (const palavra of DICIONARIO_SENTIMENTO.neutro) {
        const regex = new RegExp(`\\b${palavra}\\b`, 'gi');
        const matches = textoLower.match(regex);
        if (matches) {
            scoreNeutro += matches.length;
            if (!palavrasEncontradas.neutras.includes(palavra)) {
                palavrasEncontradas.neutras.push(palavra);
            }
        }
    }

    // Verifica intensificadores
    let multiplicador = 1;
    for (const intensificador of DICIONARIO_SENTIMENTO.intensificadores) {
        if (textoLower.includes(intensificador)) {
            multiplicador = 1.2;
            break;
        }
    }

    // Calcula scores finais
    const totalScore = (scorePositivo + scoreNegativo + scoreNeutro) || 1;
    const percentPositivo = Math.round((scorePositivo / totalScore) * 100);
    const percentNegativo = Math.round((scoreNegativo / totalScore) * 100);
    const percentNeutro = Math.round((scoreNeutro / totalScore) * 100);

    // Determina classificação
    let classificacao = 'neutro';
    let confiancaSentimento = 'baixa';

    if (scorePositivo > scoreNegativo && scorePositivo > scoreNeutro) {
        classificacao = 'favoravel';
        confiancaSentimento = scorePositivo > 3 ? 'alta' : 'media';
    } else if (scoreNegativo > scorePositivo && scoreNegativo > scoreNeutro) {
        classificacao = 'desfavoravel';
        confiancaSentimento = scoreNegativo > 3 ? 'alta' : 'media';
    } else if (scoreNeutro > scorePositivo && scoreNeutro > scoreNegativo) {
        classificacao = 'neutro';
        confiancaSentimento = 'media';
    } else {
        classificacao = 'misto';
        confiancaSentimento = 'baixa';
    }

    return {
        classificacao: classificacao,
        confianca: confiancaSentimento,
        scores: {
            positivo: scorePositivo,
            negativo: scoreNegativo,
            neutro: scoreNeutro
        },
        percentuais: {
            positivo: percentPositivo,
            negativo: percentNegativo,
            neutro: percentNeutro
        },
        palavras_chave: palavrasEncontradas,
        resumo: classificacao === 'favoravel' ? 'Decisão predominantemente favorável ao interessado' :
                classificacao === 'desfavoravel' ? 'Decisão predominantemente desfavorável ao interessado' :
                classificacao === 'misto' ? 'Decisão com elementos favoráveis e desfavoráveis' :
                'Decisão de caráter procedimental/informativo'
    };
}

// ============================================
// RELACIONAMENTOS EMPRESA-DIRETOR-PROCESSO
// ============================================

/**
 * Extrai e vincula relacionamentos entre entidades
 */
function extrairRelacionamentos(texto, deliberacoes = []) {
    const relacionamentos = [];
    const entidades = {
        empresas: new Set(),
        diretores: new Set(),
        processos: new Set()
    };

    // Extrai empresas do texto
    const empresasTexto = extrairEmpresas(texto);
    empresasTexto.forEach(e => entidades.empresas.add(e));

    // Extrai CNPJs e associa a empresas
    const cnpjs = extrairCNPJs(texto);

    // Extrai diretores conhecidos
    for (const [agencia, config] of Object.entries(AGENCIAS_CONFIG)) {
        for (const diretor of config.diretores) {
            if (texto.toLowerCase().includes(diretor.toLowerCase())) {
                entidades.diretores.add(diretor);
            }
        }
    }

    // Extrai nomes de diretores do texto (padrão: Nome Sobrenome com título)
    const padroesDiretores = [
        /(?:Diretor[a]?(?:-Presidente)?|Conselheiro[a]?)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)+)/g,
        /(?:Relator[a]?|Presidente)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)+)/g
    ];

    for (const padrao of padroesDiretores) {
        let match;
        const regex = new RegExp(padrao.source, padrao.flags);
        while ((match = regex.exec(texto)) !== null) {
            entidades.diretores.add(match[1].trim());
        }
    }

    // Extrai números de processos
    const padroesProcesso = [
        /\b(\d{4,}[-\/]\d{4,}[-\/]?\d*)\b/g,
        /(?:Processo|PRC|SEI)\s*(?:n[°ºo]?)?\s*([\d\-\/\.]+)/gi,
        /\b(ARTESP-PRC-\d+[-\/]\d+)\b/gi
    ];

    for (const padrao of padroesProcesso) {
        let match;
        const regex = new RegExp(padrao.source, padrao.flags);
        while ((match = regex.exec(texto)) !== null) {
            entidades.processos.add(match[1].trim());
        }
    }

    // Cria relacionamentos baseados nas deliberações
    deliberacoes.forEach(delib => {
        // Empresa -> Processo
        if (delib.interessado && delib.processo) {
            relacionamentos.push({
                tipo: 'EMPRESA_INTERESSADA_PROCESSO',
                origem: normalizarEmpresa(delib.interessado),
                destino: delib.processo,
                atributos: {
                    resultado: delib.resultado,
                    data: delib.data_reuniao
                }
            });
        }

        // Diretor -> Processo (votação)
        if (delib.votos_a_favor) {
            delib.votos_a_favor.forEach(diretor => {
                relacionamentos.push({
                    tipo: 'DIRETOR_VOTOU_PROCESSO',
                    origem: diretor,
                    destino: delib.processo || delib.numero_deliberacao,
                    atributos: {
                        voto: 'favoravel',
                        data: delib.data_reuniao
                    }
                });
            });
        }

        if (delib.votos_contra) {
            delib.votos_contra.forEach(diretor => {
                relacionamentos.push({
                    tipo: 'DIRETOR_VOTOU_PROCESSO',
                    origem: diretor,
                    destino: delib.processo || delib.numero_deliberacao,
                    atributos: {
                        voto: 'contrario',
                        data: delib.data_reuniao
                    }
                });
            });
        }
    });

    // Identifica relações de controle societário mencionadas
    const padroesControle = [
        /([A-Z][A-Za-z\s]+)\s*(?:,\s*)?(?:controlada|subsidiária|coligada)\s*(?:da|do|de)\s*([A-Z][A-Za-z\s]+)/gi,
        /([A-Z][A-Za-z\s]+)\s*(?:,\s*)?(?:controla|possui)\s*(?:a|o)?\s*([A-Z][A-Za-z\s]+)/gi
    ];

    for (const padrao of padroesControle) {
        let match;
        const regex = new RegExp(padrao.source, padrao.flags);
        while ((match = regex.exec(texto)) !== null) {
            const empresa1 = normalizarEmpresa(match[1].trim());
            const empresa2 = normalizarEmpresa(match[2].trim());

            if (empresa1 && empresa2 && empresa1 !== empresa2) {
                relacionamentos.push({
                    tipo: 'CONTROLE_SOCIETARIO',
                    origem: empresa2,
                    destino: empresa1,
                    atributos: {
                        detectado_automaticamente: true
                    }
                });
            }
        }
    }

    return {
        entidades: {
            empresas: Array.from(entidades.empresas),
            diretores: Array.from(entidades.diretores),
            processos: Array.from(entidades.processos)
        },
        relacionamentos: relacionamentos,
        estatisticas: {
            total_empresas: entidades.empresas.size,
            total_diretores: entidades.diretores.size,
            total_processos: entidades.processos.size,
            total_relacionamentos: relacionamentos.length
        }
    };
}

// ============================================
// OCR - INTEGRAÇÃO PARA PDFs ESCANEADOS
// ============================================

/**
 * Verifica se o texto parece ser de um PDF escaneado (pouco texto extraído)
 */
function verificarNecessidadeOCR(texto, tamanhoPDF = 0) {
    // Heurísticas para detectar PDFs escaneados
    const caracteresTexto = texto.replace(/\s+/g, '').length;
    const palavras = texto.split(/\s+/).filter(p => p.length > 2).length;

    // Se o PDF é grande mas tem pouco texto, provavelmente é escaneado
    const densidadeTexto = tamanhoPDF > 0 ? caracteresTexto / tamanhoPDF : 0;

    // Verifica padrões de texto corrompido/ilegível comuns em OCR ruim
    const caracteresEspeciais = (texto.match(/[^\w\sÀ-ÿ.,;:!?()[\]{}"-]/g) || []).length;
    const proporcaoEspeciais = caracteresEspeciais / (caracteresTexto || 1);

    const indicadores = {
        poucas_palavras: palavras < 50,
        baixa_densidade: densidadeTexto < 0.01,
        muitos_caracteres_especiais: proporcaoEspeciais > 0.1,
        texto_muito_curto: caracteresTexto < 200
    };

    const necessitaOCR = indicadores.poucas_palavras ||
                         indicadores.texto_muito_curto ||
                         (indicadores.baixa_densidade && tamanhoPDF > 50000);

    return {
        necessita_ocr: necessitaOCR,
        indicadores: indicadores,
        estatisticas: {
            caracteres: caracteresTexto,
            palavras: palavras,
            densidade: densidadeTexto.toFixed(4),
            proporcao_especiais: proporcaoEspeciais.toFixed(4)
        },
        recomendacao: necessitaOCR ?
            'Recomendado processar com OCR (Tesseract ou Google Vision API)' :
            'Texto extraído parece adequado para análise'
    };
}

/**
 * Placeholder para integração com Tesseract OCR
 * Em produção, conectar com tesseract.js ou API externa
 */
async function processarComOCR(imagemBuffer, opcoes = {}) {
    // Esta função seria implementada com tesseract.js:
    // const Tesseract = require('tesseract.js');
    // const resultado = await Tesseract.recognize(imagemBuffer, 'por', opcoes);
    // return resultado.data.text;

    return {
        sucesso: false,
        mensagem: 'OCR não configurado. Instale tesseract.js: npm install tesseract.js',
        instrucoes: [
            '1. npm install tesseract.js',
            '2. Importar: const Tesseract = require("tesseract.js")',
            '3. Usar: await Tesseract.recognize(imagem, "por")',
            '4. Alternativa cloud: Google Cloud Vision API'
        ],
        configuracao_sugerida: {
            biblioteca: 'tesseract.js',
            idioma: 'por', // Português
            oem: 1, // LSTM neural net
            psm: 3  // Fully automatic page segmentation
        }
    };
}

// ============================================
// VERSÃO COMPLETA COM TODAS AS MELHORIAS
// ============================================

/**
 * Extração completa com todas as melhorias implementadas
 */
function extrairDeliberacoesCompleto(texto, agenciaFornecida = null, opcoes = {}) {
    const agencia = agenciaFornecida || detectarAgencia(texto);
    const resultado = extrairDeliberacoesMultiAgencia(texto, agencia);

    // Verifica necessidade de OCR
    const analiseOCR = verificarNecessidadeOCR(texto, opcoes.tamanhoPDF || 0);

    // Extrai prazos
    const prazos = extrairPrazos(texto);

    // Extrai rodovias
    const rodovias = extrairRodovias(texto);

    // Analisa sentimento
    const sentimento = analisarSentimento(texto);

    // Extrai relacionamentos
    const relacionamentos = extrairRelacionamentos(texto, resultado.deliberations);

    // Enriquece cada deliberação
    resultado.deliberations = resultado.deliberations.map(delib => {
        // Analisa sentimento específico da deliberação
        const textoDelib = [
            delib.ementa,
            delib.resultado,
            delib.objeto
        ].filter(Boolean).join(' ');

        delib.sentimento = analisarSentimento(textoDelib);

        return delib;
    });

    // Adiciona novos metadados
    resultado.analise_ocr = analiseOCR;
    resultado.prazos = prazos;
    resultado.rodovias = rodovias;
    resultado.sentimento_geral = sentimento;
    resultado.relacionamentos = relacionamentos;

    // Atualiza metadados gerais
    resultado.metadados = {
        ...resultado.metadados,
        total_prazos: prazos.length,
        total_rodovias: rodovias.total_rodovias,
        total_trechos: rodovias.total_trechos,
        sentimento: sentimento.classificacao,
        total_relacionamentos: relacionamentos.estatisticas.total_relacionamentos,
        necessita_ocr: analiseOCR.necessita_ocr
    };

    return resultado;
}

module.exports = {
    // Funções principais de extração
    extrairDeliberacoes,
    extrairDeliberacoesMultiAgencia,
    extrairDeliberacoesCompleto,  // NOVA: versão com todas as melhorias
    analisarTexto,

    // Extração de dados específicos
    extrairDadosDeliberacao,
    extrairVotos,
    extrairDataReuniao,
    extrairValoresMonetarios,
    extrairCNPJs,
    extrairCPFs,

    // NOVAS funcionalidades
    extrairPrazos,           // Extrai prazos e datas limite
    extrairRodovias,         // Extrai rodovias e trechos (SP-330, BR-116)
    analisarSentimento,      // Análise de sentimento da decisão
    extrairRelacionamentos,  // Vincula empresa-diretor-processo
    verificarNecessidadeOCR, // Detecta se precisa OCR
    processarComOCR,         // Placeholder para integração OCR

    // Funções auxiliares
    detectarAgencia,
    normalizarEmpresa,
    extrairEmpresas,
    identificarTodosMicrotemas,
    calcularConfianca,

    // Constantes exportadas
    DIRETORES,
    MICROTEMAS,
    AGENCIAS_CONFIG,
    EMPRESAS_NORMALIZADAS,
    DICIONARIO_SENTIMENTO,   // NOVO: dicionário para análise de sentimento
    PADROES_RODOVIAS         // NOVO: padrões para extração de rodovias
};
