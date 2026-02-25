/**
 * Intelligence Correlator - IRIS
 *
 * O diferencial da IRIS: cruzamento automatico de noticias com deliberacoes.
 *
 * Funcionalidades:
 * 1. Detecta empresas mencionadas em noticias (usando dicionario de 25+ empresas)
 * 2. Cruza noticias com historico de deliberacoes
 * 3. Gera radar regulatorio (temas quentes da semana)
 * 4. Sistema de alertas por empresa/tema
 *
 * Custo: R$ 0,00 (tudo local, regex + keyword matching)
 */

const { normalizarEmpresa, extrairEmpresas } = require('./extrator-deliberacoes');

// ============================================================================
// DICIONÁRIO DE TEMAS REGULATÓRIOS
// ============================================================================

const TEMAS_REGULATORIOS = {
    'reequilibrio': ['reequilíbrio', 'reequilibrio', 'equilíbrio econômico', 'equilibrio economico', 'revisão tarifária', 'revisao tarifaria'],
    'tarifa': ['tarifa', 'pedágio', 'pedagio', 'reajuste', 'tarifa básica'],
    'concessao': ['concessão', 'concessao', 'licitação', 'licitacao', 'edital', 'contrato de concessão'],
    'fiscalizacao': ['fiscalização', 'fiscalizacao', 'autuação', 'autuacao', 'multa', 'penalidade', 'infração'],
    'obra': ['obra', 'duplicação', 'duplicacao', 'pavimentação', 'pavimentacao', 'manutenção', 'manutencao'],
    'seguranca': ['segurança', 'seguranca', 'acidente', 'sinistro', 'atendimento', 'resgate'],
    'meio_ambiente': ['ambiental', 'meio ambiente', 'licenciamento', 'compensação ambiental'],
    'regulacao': ['regulação', 'regulacao', 'norma', 'resolução', 'resolucao', 'deliberação', 'deliberacao'],
    'privatizacao': ['privatização', 'privatizacao', 'desestatização', 'desestatizacao', 'ppi', 'parceria público-privada'],
    'energia': ['energia', 'elétrica', 'eletrica', 'distribuidora', 'geração', 'transmissão'],
    'telecom': ['telecomunicação', 'telecomunicacao', 'banda larga', '5g', 'espectro', 'radiofrequência'],
    'petroleo': ['petróleo', 'petroleo', 'gás natural', 'gas natural', 'combustível', 'combustivel', 'gasolina', 'diesel'],
    'mineracao': ['mineração', 'mineracao', 'minério', 'minerio', 'barragem', 'rejeitos'],
    'transporte': ['transporte', 'ferrovia', 'rodovia', 'metrô', 'metro', 'ônibus', 'onibus']
};

// ============================================================================
// EXTRAÇÃO DE EMPRESAS EM NOTÍCIAS
// ============================================================================

/**
 * Detecta empresas mencionadas no titulo e resumo de uma noticia.
 * Reutiliza o dicionario de 25+ empresas do extrator-deliberacoes.
 */
function detectarEmpresasEmNoticia(noticia) {
    const texto = (noticia.titulo || '') + ' ' + (noticia.resumo || '');
    return extrairEmpresas(texto);
}

// ============================================================================
// DETECÇÃO DE TEMAS EM NOTÍCIAS
// ============================================================================

/**
 * Identifica temas regulatorios mencionados na noticia
 */
function detectarTemasEmNoticia(noticia) {
    const texto = ((noticia.titulo || '') + ' ' + (noticia.resumo || '')).toLowerCase();
    const temas = [];

    for (const [tema, keywords] of Object.entries(TEMAS_REGULATORIOS)) {
        for (const kw of keywords) {
            if (texto.includes(kw.toLowerCase())) {
                temas.push(tema);
                break;
            }
        }
    }

    return temas;
}

// ============================================================================
// CRUZAMENTO NOTÍCIAS x DELIBERAÇÕES
// ============================================================================

/**
 * Cruza uma noticia com o historico de deliberacoes.
 * Retorna deliberacoes relacionadas com score de relevancia.
 *
 * @param {Object} noticia - Item de noticia do RSS
 * @param {Array} deliberacoes - Array de deliberacoes extraidas dos PDFs
 * @returns {Object} Noticia enriquecida com inteligencia
 */
function correlacionarNoticia(noticia, deliberacoes) {
    const empresasNoticia = detectarEmpresasEmNoticia(noticia);
    const temasNoticia = detectarTemasEmNoticia(noticia);
    const deliberacoesRelacionadas = [];

    if (empresasNoticia.length === 0 && temasNoticia.length === 0) {
        return {
            empresasMencionadas: [],
            temasDetectados: temasNoticia,
            deliberacoesRelacionadas: [],
            temInteligencia: false,
            relevanciaPontuacao: 0
        };
    }

    for (const d of deliberacoes) {
        let score = 0;
        const motivos = [];

        // Match por empresa (peso alto)
        const empresaDelib = normalizarEmpresa(d.interessado);
        if (empresaDelib && empresasNoticia.includes(empresaDelib)) {
            score += 50;
            motivos.push('Mesma empresa: ' + empresaDelib);
        }

        // Match por tema (peso medio)
        if (d.microtema) {
            const microtemaNorm = d.microtema.toLowerCase().replace(/\s+/g, '_');
            if (temasNoticia.includes(microtemaNorm)) {
                score += 30;
                motivos.push('Tema relacionado: ' + d.microtema);
            }
        }

        // Match por agencia (peso baixo)
        if (noticia.agencia && d.agencia && noticia.agencia === d.agencia) {
            score += 10;
        }

        // Proximidade temporal (bonus se deliberacao e recente)
        if (d.data_reuniao) {
            const dataDelib = new Date(d.data_reuniao);
            const dataNoticia = new Date(noticia.data);
            const diasDiff = Math.abs((dataNoticia - dataDelib) / (1000 * 60 * 60 * 24));
            if (diasDiff <= 30) {
                score += 10;
                motivos.push('Dentro de 30 dias');
            }
        }

        if (score >= 30) {
            deliberacoesRelacionadas.push({
                processo: d.processo,
                interessado: d.interessado,
                decisao: d.resultado || d.decisao,
                microtema: d.microtema,
                data_reuniao: d.data_reuniao || d.dataArquivo,
                reuniao: d.reuniao_ordinaria || d.reuniao,
                votos_favor: d.votos_a_favor || d.votos_favor || [],
                votos_contra: d.votos_contra || [],
                relevancia: score,
                motivos
            });
        }
    }

    // Ordena por relevancia
    deliberacoesRelacionadas.sort((a, b) => b.relevancia - a.relevancia);

    return {
        empresasMencionadas: empresasNoticia,
        temasDetectados: temasNoticia,
        deliberacoesRelacionadas: deliberacoesRelacionadas.slice(0, 10),
        temInteligencia: deliberacoesRelacionadas.length > 0,
        relevanciaPontuacao: deliberacoesRelacionadas.length > 0
            ? deliberacoesRelacionadas[0].relevancia
            : 0
    };
}

/**
 * Enriquece um array inteiro de noticias com dados de inteligencia
 */
function enriquecerNoticias(noticias, deliberacoes) {
    return noticias.map(n => {
        const intel = correlacionarNoticia(n, deliberacoes);
        return { ...n, inteligencia: intel };
    });
}

// ============================================================================
// RADAR REGULATÓRIO
// ============================================================================

/**
 * Gera o radar regulatorio: quais temas estao "quentes" esta semana.
 * Agrega dados de noticias + deliberacoes por tema.
 *
 * @param {Array} noticias - Noticias recentes
 * @param {Array} deliberacoes - Deliberacoes extraidas
 * @param {number} [diasPeriodo=7] - Janela de tempo em dias
 * @returns {Array} Temas ordenados por intensidade
 */
function gerarRadarRegulatorio(noticias, deliberacoes, diasPeriodo = 7) {
    const agora = new Date();
    const limite = new Date(agora.getTime() - diasPeriodo * 24 * 60 * 60 * 1000);
    const temas = {};

    // Agrega noticias por tema
    for (const n of noticias) {
        const dataN = new Date(n.data);
        if (dataN < limite) continue;

        const temasDetectados = detectarTemasEmNoticia(n);
        for (const tema of temasDetectados) {
            if (!temas[tema]) {
                temas[tema] = { noticias: 0, deliberacoes: 0, agencias: new Set(), empresas: new Set(), ultimaAtividade: null };
            }
            temas[tema].noticias++;
            if (n.agencia) temas[tema].agencias.add(n.agencia);

            const empresas = detectarEmpresasEmNoticia(n);
            for (const e of empresas) temas[tema].empresas.add(e);

            if (!temas[tema].ultimaAtividade || dataN > temas[tema].ultimaAtividade) {
                temas[tema].ultimaAtividade = dataN;
            }
        }
    }

    // Agrega deliberacoes por microtema
    for (const d of deliberacoes) {
        const dataD = d.data_reuniao ? new Date(d.data_reuniao) : null;
        if (!dataD || dataD < limite) continue;

        const microtemaNorm = (d.microtema || '').toLowerCase().replace(/\s+/g, '_');
        const temaKey = Object.keys(TEMAS_REGULATORIOS).find(t => t === microtemaNorm) || microtemaNorm;

        if (temaKey) {
            if (!temas[temaKey]) {
                temas[temaKey] = { noticias: 0, deliberacoes: 0, agencias: new Set(), empresas: new Set(), ultimaAtividade: null };
            }
            temas[temaKey].deliberacoes++;
            if (d.agencia) temas[temaKey].agencias.add(d.agencia);
            if (d.interessado) temas[temaKey].empresas.add(normalizarEmpresa(d.interessado));

            if (!temas[temaKey].ultimaAtividade || dataD > temas[temaKey].ultimaAtividade) {
                temas[temaKey].ultimaAtividade = dataD;
            }
        }
    }

    // Calcula intensidade e retorna ordenado
    return Object.entries(temas)
        .map(([tema, dados]) => {
            const total = dados.noticias + dados.deliberacoes;
            // Intensidade: score ponderado (noticia = 1, deliberacao = 2)
            const intensidade = dados.noticias + (dados.deliberacoes * 2);
            return {
                tema,
                temaLabel: tema.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                noticias: dados.noticias,
                deliberacoes: dados.deliberacoes,
                total,
                intensidade,
                agencias: [...dados.agencias],
                empresas: [...dados.empresas],
                ultimaAtividade: dados.ultimaAtividade ? dados.ultimaAtividade.toISOString() : null,
                nivel: intensidade >= 10 ? 'critico' : intensidade >= 5 ? 'alto' : intensidade >= 2 ? 'medio' : 'baixo'
            };
        })
        .filter(t => t.total > 0)
        .sort((a, b) => b.intensidade - a.intensidade);
}

// ============================================================================
// SISTEMA DE ALERTAS
// ============================================================================

// Armazenamento em memoria (migra para Supabase depois)
const alertasSubscriptions = [];
const alertasDisparados = [];

/**
 * Adiciona uma inscricao de alerta
 * @param {Object} config - { tipo: 'empresa'|'tema'|'agencia', valor: 'CCR', ativo: true }
 */
function adicionarAlerta(config) {
    const alerta = {
        id: 'alrt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        tipo: config.tipo,
        valor: config.valor,
        ativo: config.ativo !== false,
        criadoEm: new Date().toISOString()
    };
    alertasSubscriptions.push(alerta);
    return alerta;
}

/**
 * Lista todos os alertas configurados
 */
function listarAlertas() {
    return alertasSubscriptions;
}

/**
 * Remove um alerta
 */
function removerAlerta(id) {
    const idx = alertasSubscriptions.findIndex(a => a.id === id);
    if (idx >= 0) {
        alertasSubscriptions.splice(idx, 1);
        return true;
    }
    return false;
}

/**
 * Verifica noticias contra alertas configurados.
 * Retorna array de alertas disparados.
 */
function verificarAlertas(noticias) {
    const novosAlertas = [];
    const alertasAtivos = alertasSubscriptions.filter(a => a.ativo);

    for (const alerta of alertasAtivos) {
        for (const n of noticias) {
            const texto = ((n.titulo || '') + ' ' + (n.resumo || '')).toLowerCase();
            const valor = (alerta.valor || '').toLowerCase();
            let match = false;

            if (alerta.tipo === 'empresa') {
                const empresas = detectarEmpresasEmNoticia(n);
                match = empresas.some(e => e.toLowerCase().includes(valor));
            } else if (alerta.tipo === 'tema') {
                const temas = detectarTemasEmNoticia(n);
                match = temas.some(t => t.includes(valor));
            } else if (alerta.tipo === 'agencia') {
                match = (n.agencia || '').toLowerCase().includes(valor);
            } else {
                match = texto.includes(valor);
            }

            if (match) {
                // Evita duplicatas (mesma noticia + mesmo alerta)
                const chave = alerta.id + '|' + n.link;
                const jaDisparado = alertasDisparados.some(a => a.chave === chave);

                if (!jaDisparado) {
                    const disparado = {
                        chave,
                        alertaId: alerta.id,
                        alertaTipo: alerta.tipo,
                        alertaValor: alerta.valor,
                        noticia: {
                            titulo: n.titulo,
                            agencia: n.agencia,
                            data: n.data,
                            link: n.link
                        },
                        disparadoEm: new Date().toISOString()
                    };
                    alertasDisparados.push(disparado);
                    novosAlertas.push(disparado);
                }
            }
        }
    }

    // Limita historico a 500 alertas
    if (alertasDisparados.length > 500) {
        alertasDisparados.splice(0, alertasDisparados.length - 500);
    }

    return novosAlertas;
}

/**
 * Retorna historico de alertas disparados
 */
function historicoAlertas(limite = 50) {
    return alertasDisparados.slice(-limite).reverse();
}

// ============================================================================
// PERFIL DE EMPRESA
// ============================================================================

/**
 * Gera perfil completo de uma empresa com base em deliberacoes + noticias
 */
function perfilEmpresa(nomeEmpresa, deliberacoes, noticias) {
    const empresaNorm = normalizarEmpresa(nomeEmpresa);

    // Deliberacoes da empresa
    const delibsEmpresa = deliberacoes.filter(d => {
        const interesse = normalizarEmpresa(d.interessado);
        return interesse === empresaNorm;
    });

    // Noticias que mencionam a empresa
    const noticiasEmpresa = noticias.filter(n => {
        const empresas = detectarEmpresasEmNoticia(n);
        return empresas.includes(empresaNorm);
    });

    // Agregacoes
    const decisoes = { deferido: 0, indeferido: 0, outros: 0 };
    const temasMaisComuns = {};
    const diretoresVotos = {};

    for (const d of delibsEmpresa) {
        const dec = (d.resultado || d.decisao || '').toLowerCase();
        if (dec.includes('deferido') && !dec.includes('indeferido')) decisoes.deferido++;
        else if (dec.includes('indeferido')) decisoes.indeferido++;
        else decisoes.outros++;

        if (d.microtema) {
            temasMaisComuns[d.microtema] = (temasMaisComuns[d.microtema] || 0) + 1;
        }

        for (const dir of (d.votos_a_favor || d.votos_favor || [])) {
            if (!diretoresVotos[dir]) diretoresVotos[dir] = { favor: 0, contra: 0 };
            diretoresVotos[dir].favor++;
        }
        for (const dir of (d.votos_contra || [])) {
            if (!diretoresVotos[dir]) diretoresVotos[dir] = { favor: 0, contra: 0 };
            diretoresVotos[dir].contra++;
        }
    }

    return {
        empresa: empresaNorm,
        totalDeliberacoes: delibsEmpresa.length,
        totalNoticias: noticiasEmpresa.length,
        decisoes,
        taxaDeferimento: delibsEmpresa.length > 0
            ? Math.round((decisoes.deferido / delibsEmpresa.length) * 100)
            : 0,
        temasMaisComuns: Object.entries(temasMaisComuns)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tema, count]) => ({ tema, count })),
        diretoresVotos: Object.entries(diretoresVotos)
            .map(([nome, votos]) => ({ nome, ...votos }))
            .sort((a, b) => (b.favor + b.contra) - (a.favor + a.contra)),
        ultimasDeliberacoes: delibsEmpresa.slice(-5).reverse().map(d => ({
            processo: d.processo,
            decisao: d.resultado || d.decisao,
            data: d.data_reuniao || d.dataArquivo,
            microtema: d.microtema
        })),
        ultimasNoticias: noticiasEmpresa.slice(0, 5).map(n => ({
            titulo: n.titulo,
            agencia: n.agencia,
            data: n.data,
            link: n.link
        }))
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Deteccao
    detectarEmpresasEmNoticia,
    detectarTemasEmNoticia,

    // Cruzamento
    correlacionarNoticia,
    enriquecerNoticias,

    // Radar
    gerarRadarRegulatorio,

    // Alertas
    adicionarAlerta,
    listarAlertas,
    removerAlerta,
    verificarAlertas,
    historicoAlertas,

    // Perfil
    perfilEmpresa,

    // Constantes
    TEMAS_REGULATORIOS
};
