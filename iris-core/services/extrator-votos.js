/**
 * Serviço de Extração de Votos - IRIS
 *
 * Extrai votos dos diretores a partir das assinaturas
 * no final do texto das deliberações
 */

const logger = require('../utils/logger');

// ============================================================================
// PADRÕES DE ASSINATURA DE DIRETORES
// ============================================================================

/**
 * Padrões para identificar assinaturas de diretores
 */
const PATTERNS_ASSINATURA = [
    // Nome seguido de cargo
    /([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+)+)\s*[-–]\s*(?:Diretor|Diretora|Presidente|Vice)/gi,

    // Cargo seguido de nome
    /(?:Diretor|Diretora|Presidente|Vice)[a-z\s]*[-–:]\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+)+)/gi,

    // Nome em linha separada após "Assinado por" ou similar
    /(?:Assinado|Aprovado|Votaram?)\s+(?:por|:)\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+)+)/gi
];

/**
 * Padrões para identificar tipo de votação
 */
const PATTERNS_VOTACAO = {
    unanimidade: [
        /por\s+unanimidade/i,
        /unanimemente/i,
        /voto\s+un[âa]nime/i,
        /aprova[çc][ãa]o\s+un[âa]nime/i,
        /todos\s+os\s+(?:membros|diretores)\s+votaram/i
    ],
    maioria: [
        /por\s+maioria/i,
        /maioria\s+(?:simples|absoluta|qualificada)/i,
        /voto\s+(?:de\s+)?(?:minerva|desempate)/i
    ],
    ausencia: [
        /aus[êe]ncia\s+(?:de|do|da)/i,
        /n[ãa]o\s+(?:participou|votou|compareceu)/i,
        /impedido/i,
        /suspeito/i,
        /declara(?:do|ção\s+de)\s+imped/i
    ]
};

/**
 * Cargos conhecidos na diretoria colegiada
 */
const CARGOS_DIRETORIA = [
    'Diretor-Presidente',
    'Diretor Presidente',
    'Presidente',
    'Vice-Presidente',
    'Diretor-Geral',
    'Diretor Geral',
    'Diretor de Assuntos Jurídicos',
    'Diretor Jurídico',
    'Diretor de Fiscalização',
    'Diretora de Fiscalização',
    'Diretor Técnico',
    'Diretora Técnica',
    'Diretor de Planejamento',
    'Diretora de Planejamento',
    'Diretor Administrativo',
    'Diretora Administrativa',
    'Diretor Financeiro',
    'Diretora Financeira',
    'Diretor de Operações',
    'Diretora de Operações',
    'Diretor de Regulação',
    'Diretora de Regulação',
    'Diretor de Investimentos',
    'Diretora de Investimentos',
    'Conselheiro',
    'Conselheira',
    'Membro'
];

/**
 * Diretores conhecidos da ARTESP (para identificação direta)
 */
const DIRETORES_CONHECIDOS = [
    // Diretoria atual (2024-2025)
    { nome: 'André Isper Rodrigues Barnabé', cargo: 'Diretor-Presidente', variantes: ['Andre Isper', 'Barnabé', 'Barnabe'] },
    { nome: 'Diego Albert Zanatto', cargo: 'Diretor de Fiscalização', variantes: ['Diego Zanatto', 'Zanatto'] },
    { nome: 'Fernanda Esbizaro Rodrigues Rudnik', cargo: 'Diretora de Planejamento', variantes: ['Fernanda Rudnik', 'Esbizaro', 'Rudnik'] },
    { nome: 'Raquel França Carneiro', cargo: 'Diretora de Investimentos', variantes: ['Raquel Carneiro', 'França Carneiro', 'Franca Carneiro'] },
    // Diretoria anterior (para PDFs históricos)
    { nome: 'Milton Persoli', cargo: 'Diretor-Presidente', variantes: ['Persoli'] },
    { nome: 'Sergio Massaru Harada', cargo: 'Diretor', variantes: ['Massaru', 'Harada'] },
    { nome: 'Carlos Eduardo Simões', cargo: 'Diretor', variantes: ['Carlos Simões', 'Carlos Simoes'] },
    { nome: 'Antonio Carlos de Almeida', cargo: 'Diretor', variantes: ['Antonio Almeida'] },
    { nome: 'Flavio Augusto Trevisan Saes', cargo: 'Diretor', variantes: ['Trevisan Saes', 'Flavio Saes'] }
];

// ============================================================================
// FUNÇÕES DE EXTRAÇÃO
// ============================================================================

/**
 * Extrai nomes de diretores das assinaturas
 * @param {string} texto - Texto da deliberação
 * @returns {Array<Object>} Lista de diretores encontrados
 */
function extrairDiretores(texto) {
    if (!texto || typeof texto !== 'string') {
        return [];
    }

    const diretores = new Map(); // Usa Map para evitar duplicatas
    const textoNormalizado = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // PRIMEIRO: Busca diretores conhecidos em TODO o texto
    for (const diretor of DIRETORES_CONHECIDOS) {
        const nomeNormalizado = diretor.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        // Verifica nome completo
        if (textoNormalizado.includes(nomeNormalizado)) {
            diretores.set(diretor.nome.toLowerCase(), {
                nome: diretor.nome,
                cargo: diretor.cargo
            });
            continue;
        }

        // Verifica variantes
        for (const variante of diretor.variantes || []) {
            const varianteNormalizada = variante.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            if (textoNormalizado.includes(varianteNormalizada)) {
                diretores.set(diretor.nome.toLowerCase(), {
                    nome: diretor.nome,
                    cargo: diretor.cargo
                });
                break;
            }
        }
    }

    // Procura na parte final do texto (últimos 30%)
    const tamanhoTexto = texto.length;
    const parteAssinaturas = texto.substring(Math.floor(tamanhoTexto * 0.7));

    // Tenta cada padrão de assinatura
    for (const pattern of PATTERNS_ASSINATURA) {
        // Reset do regex para cada iteração
        pattern.lastIndex = 0;

        let match;
        while ((match = pattern.exec(parteAssinaturas)) !== null) {
            const nome = limparNome(match[1]);

            if (nome && nome.length > 5 && !diretores.has(nome.toLowerCase())) {
                diretores.set(nome.toLowerCase(), {
                    nome: nome,
                    cargo: identificarCargo(parteAssinaturas, nome)
                });
            }
        }
    }

    // Também procura por nomes em formato específico de assinatura
    // (linha com apenas nome em maiúsculas ou com título)
    const linhas = parteAssinaturas.split('\n');
    for (const linha of linhas) {
        const linhaTrim = linha.trim();

        // Verifica se é uma linha de assinatura
        if (pareceAssinatura(linhaTrim)) {
            const nome = extrairNomeDaLinha(linhaTrim);

            if (nome && nome.length > 5 && !diretores.has(nome.toLowerCase())) {
                diretores.set(nome.toLowerCase(), {
                    nome: nome,
                    cargo: identificarCargo(parteAssinaturas, nome)
                });
            }
        }
    }

    return Array.from(diretores.values());
}

/**
 * Limpa e normaliza nome extraído
 */
function limparNome(nome) {
    if (!nome) return null;

    return nome
        .replace(/^\s+|\s+$/g, '') // Trim
        .replace(/\s+/g, ' ')      // Normaliza espaços
        .replace(/[-–]\s*$/, '')   // Remove traço no final
        .replace(/^\d+\.?\s*/, '') // Remove números no início
        .replace(/[,;:]$/, '');    // Remove pontuação no final
}

/**
 * Verifica se uma linha parece ser uma assinatura
 */
function pareceAssinatura(linha) {
    if (!linha || linha.length < 5 || linha.length > 100) {
        return false;
    }

    // Verifica se contém cargo
    for (const cargo of CARGOS_DIRETORIA) {
        if (linha.toLowerCase().includes(cargo.toLowerCase())) {
            return true;
        }
    }

    // Verifica se é nome em maiúsculas (comum em assinaturas)
    if (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\s]+$/.test(linha) && linha.split(' ').length >= 2) {
        return true;
    }

    return false;
}

/**
 * Extrai nome de uma linha de assinatura
 */
function extrairNomeDaLinha(linha) {
    // Remove cargos conhecidos
    let nome = linha;

    for (const cargo of CARGOS_DIRETORIA) {
        nome = nome.replace(new RegExp(cargo, 'gi'), '');
    }

    // Remove caracteres especiais
    nome = nome
        .replace(/[-–:]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Capitaliza corretamente
    if (/^[A-Z\s]+$/.test(nome)) {
        nome = nome.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }

    return nome.length > 5 ? nome : null;
}

/**
 * Identifica o cargo de um diretor no texto
 */
function identificarCargo(texto, nome) {
    const textoLower = texto.toLowerCase();
    const nomeLower = nome.toLowerCase();

    // Procura cargo próximo ao nome
    const posNome = textoLower.indexOf(nomeLower);

    if (posNome === -1) {
        return null;
    }

    // Procura cargo 100 caracteres antes ou depois do nome
    const contexto = texto.substring(
        Math.max(0, posNome - 100),
        Math.min(texto.length, posNome + nome.length + 100)
    );

    for (const cargo of CARGOS_DIRETORIA) {
        if (contexto.toLowerCase().includes(cargo.toLowerCase())) {
            return cargo;
        }
    }

    return null;
}

/**
 * Identifica o tipo de votação
 * @param {string} texto - Texto da deliberação
 * @returns {Object} { tipo, confianca, detalhes }
 */
function identificarTipoVotacao(texto) {
    if (!texto || typeof texto !== 'string') {
        return {
            tipo: 'Não Identificado',
            confianca: 0,
            detalhes: null
        };
    }

    const textoLower = texto.toLowerCase();

    // Verifica unanimidade
    for (const pattern of PATTERNS_VOTACAO.unanimidade) {
        if (pattern.test(textoLower)) {
            return {
                tipo: 'Unanimidade',
                confianca: 90,
                detalhes: 'Votação por unanimidade identificada'
            };
        }
    }

    // Verifica maioria
    for (const pattern of PATTERNS_VOTACAO.maioria) {
        if (pattern.test(textoLower)) {
            return {
                tipo: 'Maioria',
                confianca: 85,
                detalhes: 'Votação por maioria identificada'
            };
        }
    }

    // Verifica ausências/impedimentos
    let temAusencia = false;
    for (const pattern of PATTERNS_VOTACAO.ausencia) {
        if (pattern.test(textoLower)) {
            temAusencia = true;
            break;
        }
    }

    // Se encontrou assinaturas mas sem tipo específico, NÃO presumir unanimidade
    const diretores = extrairDiretores(texto);
    if (diretores.length > 0) {
        return {
            tipo: temAusencia ? 'Com Ausências' : 'Não Explícito',
            confianca: temAusencia ? 70 : 40,
            detalhes: temAusencia
                ? 'Votação com ausências ou impedimentos detectados'
                : 'Tipo de votação não explícito — diretores encontrados mas sem padrão de votação claro'
        };
    }

    return {
        tipo: 'Não Identificado',
        confianca: 0,
        detalhes: 'Não foi possível identificar padrão de votação'
    };
}

/**
 * Extrai votos individuais de cada diretor
 * @param {string} texto - Texto da deliberação
 * @param {Array<Object>} diretores - Lista de diretores
 * @returns {Array<Object>} Lista de votos
 */
function extrairVotosIndividuais(texto, diretores) {
    if (!texto || !diretores || diretores.length === 0) {
        return [];
    }

    const textoLower = texto.toLowerCase();
    const tipoVotacao = identificarTipoVotacao(texto);

    // Se é unanimidade explícita, todos votaram a favor
    if (tipoVotacao.tipo === 'Unanimidade') {
        return diretores.map(diretor => ({
            diretor: diretor.nome,
            cargo: diretor.cargo,
            voto: 'Favorável',
            confianca: tipoVotacao.confianca,
            observacao: 'Voto inferido por unanimidade explícita'
        }));
    }

    // Tenta identificar votos individuais no texto
    const votos = [];

    for (const diretor of diretores) {
        const voto = identificarVotoIndividual(texto, diretor.nome);
        votos.push({
            diretor: diretor.nome,
            cargo: diretor.cargo,
            voto: voto.voto,
            confianca: voto.confianca,
            observacao: voto.observacao
        });
    }

    return votos;
}

/**
 * Identifica o voto individual de um diretor
 */
function identificarVotoIndividual(texto, nomeDiretor) {
    const textoLower = texto.toLowerCase();
    const nomeLower = nomeDiretor.toLowerCase();

    // Procura padrões de voto próximo ao nome
    const posNome = textoLower.indexOf(nomeLower);

    if (posNome === -1) {
        return {
            voto: 'Não Identificado',
            confianca: 0,
            observacao: 'Nome não encontrado no contexto de votação'
        };
    }

    // Contexto próximo ao nome
    const contexto = textoLower.substring(
        Math.max(0, posNome - 50),
        Math.min(texto.length, posNome + nomeDiretor.length + 100)
    );

    // Verifica voto contra
    if (/voto\s+(?:contr[áa]rio|contra|vencido)/i.test(contexto) ||
        /divergi/i.test(contexto)) {
        return {
            voto: 'Contrário',
            confianca: 80,
            observacao: 'Voto contrário identificado'
        };
    }

    // Verifica abstenção
    if (/abst(?:eve|enção|ém)/i.test(contexto) ||
        /n[ãa]o\s+votou/i.test(contexto)) {
        return {
            voto: 'Abstenção',
            confianca: 80,
            observacao: 'Abstenção identificada'
        };
    }

    // Verifica ausência/impedimento
    if (/aus[êe]nte/i.test(contexto) ||
        /impedido/i.test(contexto) ||
        /suspeito/i.test(contexto)) {
        return {
            voto: 'Ausente/Impedido',
            confianca: 85,
            observacao: 'Ausência ou impedimento identificado'
        };
    }

    // Sem evidência explícita: registrar como não identificado em vez de presumir
    return {
        voto: 'Não Identificado',
        confianca: 30,
        observacao: 'Diretor mencionado sem indicação explícita de voto'
    };
}

/**
 * Extrai informações completas de votação
 * @param {string} texto - Texto da deliberação
 * @returns {Object} Informações completas de votação
 */
function extrairVotacao(texto) {
    const startTime = Date.now();

    logger.info('ExtratorVotos', 'Iniciando extração de votos', {
        tamanhoTexto: texto?.length || 0
    });

    const diretores = extrairDiretores(texto);
    const tipoVotacao = identificarTipoVotacao(texto);
    const votos = extrairVotosIndividuais(texto, diretores);

    // Calcula resumo
    const resumo = {
        favoraveis: votos.filter(v => v.voto === 'Favorável').length,
        contrarios: votos.filter(v => v.voto === 'Contrário').length,
        abstencoes: votos.filter(v => v.voto === 'Abstenção').length,
        ausentes: votos.filter(v => v.voto === 'Ausente/Impedido').length,
        naoIdentificados: votos.filter(v => v.voto === 'Não Identificado').length
    };

    const resultado = {
        diretores: diretores,
        tipoVotacao: tipoVotacao.tipo,
        tipoVotacaoConfianca: tipoVotacao.confianca,
        tipoVotacaoDetalhes: tipoVotacao.detalhes,
        votos: votos,
        resumo: resumo,
        totalVotantes: diretores.length,
        processadoEm: new Date().toISOString(),
        tempoProcessamento: Date.now() - startTime
    };

    logger.info('ExtratorVotos', 'Extração concluída', {
        diretoresEncontrados: diretores.length,
        tipoVotacao: tipoVotacao.tipo,
        resumo: resumo,
        tempoMs: resultado.tempoProcessamento
    });

    return resultado;
}

module.exports = {
    extrairDiretores,
    identificarTipoVotacao,
    extrairVotosIndividuais,
    extrairVotacao,

    // Exporta constantes para testes
    CARGOS_DIRETORIA,
    DIRETORES_CONHECIDOS,
    PATTERNS_VOTACAO
};
