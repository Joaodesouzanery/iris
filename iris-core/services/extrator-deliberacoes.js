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

// Microtemas conhecidos
const MICROTEMAS = {
    'reequilibrio': ['reequilíbrio', 'reequilibrio', 'equilíbrio econômico', 'revisão tarifária', 'reequilíbrio econômico-financeiro'],
    'tarifa': ['tarifa', 'pedágio', 'cobrança', 'isenção', 'desconto', 'reajuste tarifário'],
    'obras': ['obra', 'construção', 'duplicação', 'pavimentação', 'manutenção', 'conservação'],
    'contrato': ['contrato', 'aditivo', 'prorrogação', 'rescisão', 'termo aditivo', 'autorização'],
    'multa': ['multa', 'penalidade', 'sanção', 'advertência', 'infração', 'auto de infração'],
    'fiscalizacao': ['fiscalização', 'vistoria', 'inspeção', 'auditoria', 'monitoramento'],
    'seguranca': ['segurança', 'acidente', 'atendimento', 'guincho', 'ambulância', 'socorro'],
    'ambiental': ['ambiental', 'licença', 'compensação', 'fauna', 'flora', 'meio ambiente'],
    'desapropriacao': ['desapropriação', 'faixa de domínio', 'invasão', 'ocupação', 'área non aedificandi'],
    'usuario': ['usuário', 'reclamação', 'ouvidoria', 'ressarcimento', 'indenização', 'dano']
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
function extrairDadosDeliberacao(texto, agencia = 'ARTESP') {
    const delib = {
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

    // Identifica microtema
    const textoLower = texto.toLowerCase();
    for (const [tema, palavras] of Object.entries(MICROTEMAS)) {
        for (const palavra of palavras) {
            if (textoLower.includes(palavra.toLowerCase())) {
                delib.microtema = tema;
                break;
            }
        }
        if (delib.microtema) break;
    }

    // Identifica resultado (incluindo parcialmente deferido)
    let countDeferido = 0;
    let countParcial = 0;
    let countIndeferido = 0;

    // Verifica parcialmente deferido primeiro (mais específico)
    for (const padrao of PADROES.resultado.parcialmenteDeferido) {
        const matches = texto.match(padrao);
        if (matches) countParcial += matches.length;
    }

    for (const padrao of PADROES.resultado.deferido) {
        const matches = texto.match(padrao);
        if (matches) countDeferido += matches.length;
    }

    for (const padrao of PADROES.resultado.indeferido) {
        const matches = texto.match(padrao);
        if (matches) countIndeferido += matches.length;
    }

    // Parcialmente deferido tem prioridade
    if (countParcial > 0) {
        delib.resultado = 'Parcialmente Deferido';
    } else if (countDeferido > countIndeferido) {
        delib.resultado = 'Deferido';
    } else if (countIndeferido > countDeferido) {
        delib.resultado = 'Indeferido';
    } else if (countDeferido > 0) {
        delib.resultado = 'Deferido';
    }

    // Extrai votos
    const votos = extrairVotos(texto);
    delib.votos_a_favor = votos.favor;
    delib.votos_contra = votos.contra;

    // Classifica como pauta interna se interessado for ARTESP ou vazio
    if (delib.interessado === 'Sem interessado' || textoLower.includes('pauta interna')) {
        delib.classificacao = 'Pauta Interna da Agência';
    }

    return delib;
}

/**
 * Extrai data da reunião do texto
 */
function extrairDataReuniao(texto) {
    // Tenta formato DD/MM/YYYY ou DD-MM-YYYY
    const matchNumerico = texto.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (matchNumerico) {
        let dia = matchNumerico[1].padStart(2, '0');
        let mes = matchNumerico[2].padStart(2, '0');
        let ano = matchNumerico[3];
        if (ano.length === 2) {
            ano = '20' + ano;
        }
        return `${ano}-${mes}-${dia}`;
    }

    // Tenta formato "DD de MÊS de YYYY"
    const matchExtenso = texto.match(/(\d{1,2})\s+(?:de\s+)?(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(?:de\s+)?(\d{4})/i);
    if (matchExtenso) {
        const dia = matchExtenso[1].padStart(2, '0');
        const mes = MESES[matchExtenso[2].toLowerCase()];
        const ano = matchExtenso[3];
        return `${ano}-${mes}-${dia}`;
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

    // Busca votos individuais
    for (const nomeCompleto of diretoresMencionados) {
        // Pega contexto ao redor do nome
        const idx = textoUpper.indexOf(nomeCompleto.toUpperCase());
        if (idx === -1) continue;

        const contexto = texto.substring(Math.max(0, idx - 150), Math.min(texto.length, idx + 150)).toLowerCase();

        // Padrões que indicam voto contra
        if (/contr[áa]rio|voto\s+contra|voto\s+vencido|divergente|discordou|se\s+opôs|votou\s+contra/i.test(contexto)) {
            votos.contra.push(nomeCompleto);
        }
        // Padrões que indicam voto a favor
        else if (/favor[áa]vel|voto\s+a\s+favor|aprovou|deferiu|concordou|acompanhou|votou\s+(?:pela\s+)?aprova/i.test(contexto)) {
            votos.favor.push(nomeCompleto);
        }
        // Se não encontrou indicação específica, assume a favor (mais comum em deliberações)
        else {
            votos.favor.push(nomeCompleto);
        }
    }

    return votos;
}

/**
 * Analisa texto e retorna JSON estruturado
 */
function analisarTexto(texto, agencia = 'ARTESP') {
    return extrairDeliberacoes(texto, agencia);
}

module.exports = {
    extrairDeliberacoes,
    analisarTexto,
    extrairDadosDeliberacao,
    extrairVotos,
    extrairDataReuniao,
    DIRETORES,
    MICROTEMAS
};
