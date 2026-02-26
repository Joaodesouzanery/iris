/**
 * Motor de Métricas - IRIS
 *
 * Calcula os 5 grupos de métricas a partir das deliberações processadas.
 * Pode operar sobre dados em memória ou dados do Supabase.
 *
 * GRUPOS:
 * 1. Valor Regulatório (volume, classificação, tempo)
 * 2. Por Diretor (votos, tendência, divergências, mandato)
 * 3. Por Tema (recorrência, decisão, evolução)
 * 4. Institucional (reuniões, pauta, atos normativos)
 * 5. Competitivo (comparação diretores, matriz tema x diretor, padrões)
 */

const logger = require('../utils/logger');

// ── Cache de Métricas ──
const metricasCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

function getCachedMetricas(key) {
    const entry = metricasCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.time > CACHE_TTL) {
        metricasCache.delete(key);
        return null;
    }
    return entry.data;
}

function setCachedMetricas(key, data) {
    metricasCache.set(key, { data, time: Date.now() });
}

function invalidarCache() {
    metricasCache.clear();
}

// ── Configuração de Mandatos dos Diretores ──
const MANDATOS_DIRETORES = {
    'André Isper Rodrigues Barnabé': { inicio: '2024-09-10', termino: '2029-09-09', cargo: 'Diretor-Presidente' },
    'Andre Isper Rodrigues Barnabe': { inicio: '2024-09-10', termino: '2029-09-09', cargo: 'Diretor-Presidente' },
    'Diego Albert Zanatto': { inicio: '2024-08-14', termino: '2029-08-13', cargo: 'Diretor' },
    'Fernanda Esbízaro Rodrigues Rudnik': { inicio: '2025-08-28', termino: '2030-08-27', cargo: 'Diretora' },
    'Fernanda Esbizaro Rodrigues Rudnik': { inicio: '2025-08-28', termino: '2030-08-27', cargo: 'Diretora' },
    'Raquel França Carneiro': { inicio: '2025-05-14', termino: '2030-05-13', cargo: 'Diretora' },
    'Raquel Franca Carneiro': { inicio: '2025-05-14', termino: '2030-05-13', cargo: 'Diretora' },
    // Diretoria anterior
    'Milton Persoli': { inicio: '2019-01-01', termino: '2024-06-30', cargo: 'Diretor-Presidente' },
    'Sergio Massaru Harada': { inicio: '2019-01-01', termino: '2024-06-30', cargo: 'Diretor' }
};

/**
 * Extrai data válida de uma deliberação
 */
function extrairData(delib) {
    if (delib.data_reuniao) {
        const d = new Date(delib.data_reuniao);
        if (!isNaN(d.getTime())) return d;
    }
    if (delib.dataArquivo) {
        const match = delib.dataArquivo.match(/(\d{4})-(\d{2})/);
        if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, 15);
    }
    return null;
}

/**
 * Calcula mês/ano no formato YYYY-MM
 */
function getMesAno(data) {
    if (!data) return null;
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calcula trimestre no formato YYYY-TN
 */
function getTrimestre(data) {
    if (!data) return null;
    const t = Math.ceil((data.getMonth() + 1) / 3);
    return `${data.getFullYear()}-T${t}`;
}

// ============================================================================
// GRUPO 1: MÉTRICAS DE VALOR REGULATÓRIO
// ============================================================================

function calcularMetricasValorRegulatorio(deliberacoes, temposMedios = {}) {
    const cached = getCachedMetricas('grupo1');
    if (cached) return cached;

    const total = deliberacoes.length;
    const classificados = deliberacoes.filter(d =>
        d.microtema && d.microtema !== '' && d.microtema !== 'Outros'
    ).length;

    // Contagens por decisão
    const deferidos = deliberacoes.filter(d => d.resultado === 'Deferido').length;
    const indeferidos = deliberacoes.filter(d => d.resultado === 'Indeferido').length;
    const parciais = deliberacoes.filter(d => d.resultado === 'Parcialmente Deferido').length;

    // Contagem por tipo
    const pleitosExternos = deliberacoes.filter(d =>
        d.classificacao !== 'Pauta Interna da Agência' && d.interessado !== 'ARTESP' && d.interessado !== 'Sem interessado'
    ).length;
    const pautasInternas = total - pleitosExternos;

    // Microtemas únicos
    const microtemasSet = new Set(deliberacoes.map(d => d.microtema).filter(m => m && m !== ''));
    const totalMicrotemas = microtemasSet.size;

    // Votos por diretor
    const votosPorDiretor = {};
    deliberacoes.forEach(d => {
        [...(d.votos_a_favor || []), ...(d.votos_contra || [])].forEach(dir => {
            votosPorDiretor[dir] = (votosPorDiretor[dir] || 0) + 1;
        });
    });

    // Decisões por agência
    const decisoesPorAgencia = {};
    deliberacoes.forEach(d => {
        const ag = d.agencia || 'ARTESP';
        decisoesPorAgencia[ag] = (decisoesPorAgencia[ag] || 0) + 1;
    });

    const resultado = {
        totalDeliberacoes: total,
        percentualClassificado: total > 0 ? Math.round((classificados / total) * 1000) / 10 : 0,
        tempoMedioProcessamento: temposMedios.media || 0,
        totalMicrotemas,
        deferidos,
        indeferidos,
        parcialmenteDeferidos: parciais,
        taxaDeferimento: total > 0 ? Math.round((deferidos / total) * 1000) / 10 : 0,
        taxaIndeferimento: total > 0 ? Math.round((indeferidos / total) * 1000) / 10 : 0,
        pleitosExternos,
        pautasInternas,
        votosPorDiretor,
        decisoesPorAgencia,
        atualizadoEm: new Date().toISOString()
    };

    setCachedMetricas('grupo1', resultado);
    return resultado;
}

// ============================================================================
// GRUPO 2: MÉTRICAS POR DIRETOR
// ============================================================================

function calcularMetricasPorDiretor(deliberacoes) {
    const cached = getCachedMetricas('grupo2');
    if (cached) return cached;

    const diretoresMap = {};

    deliberacoes.forEach(delib => {
        const data = extrairData(delib);
        const mesAno = getMesAno(data);
        const trimestre = getTrimestre(data);
        const isPautaInterna = delib.classificacao === 'Pauta Interna da Agência' ||
                               delib.interessado === 'ARTESP' ||
                               delib.interessado === 'Sem interessado';

        const processarVoto = (diretor, tipoVoto) => {
            if (!diretoresMap[diretor]) {
                const mandato = MANDATOS_DIRETORES[diretor] || { inicio: '2024-01-01', termino: '2029-01-01', cargo: 'Diretor(a)' };
                diretoresMap[diretor] = {
                    nome: diretor,
                    cargo: mandato.cargo,
                    mandato: { inicio: mandato.inicio, termino: mandato.termino },
                    totalVotos: 0,
                    votosPleitoExterno: 0,
                    votosPautaInterna: 0,
                    votosDeferido: 0,
                    votosIndeferido: 0,
                    votosDivergentes: 0,
                    detalheDivergencias: [],
                    decisoesDuranteMandato: 0,
                    decisoesForaMandato: 0,
                    votosPorMes: {},
                    votosPorTrimestre: {},
                    temas: {}
                };
            }

            const dir = diretoresMap[diretor];
            dir.totalVotos++;

            if (isPautaInterna) {
                dir.votosPautaInterna++;
            } else {
                dir.votosPleitoExterno++;
            }

            if (delib.resultado === 'Deferido') dir.votosDeferido++;
            if (delib.resultado === 'Indeferido') dir.votosIndeferido++;

            // Divergência: votou contra
            if (tipoVoto === 'contra') {
                dir.votosDivergentes++;
                dir.detalheDivergencias.push({
                    deliberacao: delib.numero_deliberacao || delib.reuniao_ordinaria || '',
                    data: delib.data_reuniao || '',
                    tema: delib.microtema || '',
                    votoMaioria: delib.resultado || '',
                    seuVoto: 'Contra'
                });
            }

            // Agrupa por mês
            if (mesAno) {
                if (!dir.votosPorMes[mesAno]) {
                    dir.votosPorMes[mesAno] = { deferidos: 0, indeferidos: 0, total: 0, favor: 0, contra: 0 };
                }
                dir.votosPorMes[mesAno].total++;
                if (tipoVoto === 'favor') dir.votosPorMes[mesAno].favor++;
                if (tipoVoto === 'contra') dir.votosPorMes[mesAno].contra++;
                if (delib.resultado === 'Deferido') dir.votosPorMes[mesAno].deferidos++;
                if (delib.resultado === 'Indeferido') dir.votosPorMes[mesAno].indeferidos++;
            }

            // Agrupa por trimestre
            if (trimestre) {
                if (!dir.votosPorTrimestre[trimestre]) {
                    dir.votosPorTrimestre[trimestre] = { deferidos: 0, indeferidos: 0, total: 0 };
                }
                dir.votosPorTrimestre[trimestre].total++;
                if (delib.resultado === 'Deferido') dir.votosPorTrimestre[trimestre].deferidos++;
                if (delib.resultado === 'Indeferido') dir.votosPorTrimestre[trimestre].indeferidos++;
            }

            // Temas
            const tema = delib.microtema || 'Outros';
            dir.temas[tema] = (dir.temas[tema] || 0) + 1;

            // Mandato
            if (data) {
                const inicioMandato = new Date(dir.mandato.inicio);
                const terminoMandato = new Date(dir.mandato.termino);
                if (data >= inicioMandato && data <= terminoMandato) {
                    dir.decisoesDuranteMandato++;
                } else {
                    dir.decisoesForaMandato++;
                }
            }
        };

        (delib.votos_a_favor || []).forEach(d => processarVoto(d, 'favor'));
        (delib.votos_contra || []).forEach(d => processarVoto(d, 'contra'));
    });

    // Calcula métricas derivadas
    const diretores = Object.values(diretoresMap).map(dir => {
        // Tendência decisória
        const trimestresOrdenados = Object.keys(dir.votosPorTrimestre).sort();
        const porTrimestre = trimestresOrdenados.map(t => ({
            periodo: t,
            taxaDeferimento: dir.votosPorTrimestre[t].total > 0
                ? Math.round((dir.votosPorTrimestre[t].deferidos / dir.votosPorTrimestre[t].total) * 1000) / 10
                : 0,
            ...dir.votosPorTrimestre[t]
        }));

        // Identifica tendência geral
        let tendenciaGeral = 'estável';
        if (porTrimestre.length >= 2) {
            const meio = Math.ceil(porTrimestre.length / 2);
            const mediaPrimeiros = porTrimestre.slice(0, meio).reduce((s, t) => s + t.taxaDeferimento, 0) / meio;
            const mediaUltimos = porTrimestre.slice(meio).reduce((s, t) => s + t.taxaDeferimento, 0) / (porTrimestre.length - meio);
            if (mediaUltimos > mediaPrimeiros + 5) tendenciaGeral = 'crescente';
            else if (mediaUltimos < mediaPrimeiros - 5) tendenciaGeral = 'decrescente';
        }

        // Evolução mensal
        const mesesOrdenados = Object.keys(dir.votosPorMes).sort();
        const evolucaoMensal = mesesOrdenados.map(mes => ({
            mes,
            deferidos: dir.votosPorMes[mes].deferidos,
            indeferidos: dir.votosPorMes[mes].indeferidos,
            taxa: dir.votosPorMes[mes].total > 0
                ? Math.round((dir.votosPorMes[mes].deferidos / dir.votosPorMes[mes].total) * 1000) / 10
                : 0
        }));

        // Tendência no mandato
        const primeiros6 = evolucaoMensal.slice(0, 6);
        const ultimos6 = evolucaoMensal.slice(-6);
        const taxaPrimeiros = primeiros6.length > 0
            ? primeiros6.reduce((s, m) => s + m.taxa, 0) / primeiros6.length
            : 0;
        const taxaUltimos = ultimos6.length > 0
            ? ultimos6.reduce((s, m) => s + m.taxa, 0) / ultimos6.length
            : 0;

        // Temas mais votados
        const temasQueMaisVota = Object.entries(dir.temas)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([tema, quantidade]) => ({ tema, quantidade }));

        return {
            nome: dir.nome,
            cargo: dir.cargo,
            mandato: dir.mandato,
            totalVotos: dir.totalVotos,
            votosPleitoExterno: dir.votosPleitoExterno,
            percentualPleitoExterno: dir.totalVotos > 0 ? Math.round((dir.votosPleitoExterno / dir.totalVotos) * 1000) / 10 : 0,
            votosPautaInterna: dir.votosPautaInterna,
            percentualPautaInterna: dir.totalVotos > 0 ? Math.round((dir.votosPautaInterna / dir.totalVotos) * 1000) / 10 : 0,
            temasQueMaisVota,
            votosDeferido: dir.votosDeferido,
            votosIndeferido: dir.votosIndeferido,
            taxaDeferimento: dir.totalVotos > 0 ? Math.round((dir.votosDeferido / dir.totalVotos) * 1000) / 10 : 0,
            taxaIndeferimento: dir.totalVotos > 0 ? Math.round((dir.votosIndeferido / dir.totalVotos) * 1000) / 10 : 0,
            tendenciaDecisoria: {
                geral: tendenciaGeral,
                porTrimestre,
                evolucaoMensal
            },
            votosDivergentes: dir.votosDivergentes,
            percentualDivergencia: dir.totalVotos > 0 ? Math.round((dir.votosDivergentes / dir.totalVotos) * 1000) / 10 : 0,
            detalheDivergencias: dir.detalheDivergencias.slice(0, 20),
            decisoesDuranteMandato: dir.decisoesDuranteMandato,
            decisoesForaMandato: dir.decisoesForaMandato,
            tendenciaNoMandato: {
                primeiros6Meses: { taxa: Math.round(taxaPrimeiros * 10) / 10, votos: primeiros6.reduce((s, m) => s + (m.deferidos + m.indeferidos), 0) },
                ultimos6Meses: { taxa: Math.round(taxaUltimos * 10) / 10, votos: ultimos6.reduce((s, m) => s + (m.deferidos + m.indeferidos), 0) },
                variacao: `${taxaUltimos >= taxaPrimeiros ? '+' : ''}${Math.round((taxaUltimos - taxaPrimeiros) * 10) / 10}%`
            }
        };
    }).filter(d => d.totalVotos > 0);

    const resultado = {
        diretores,
        totalDiretoresAnalisados: diretores.length,
        atualizadoEm: new Date().toISOString()
    };

    setCachedMetricas('grupo2', resultado);
    return resultado;
}

// ============================================================================
// GRUPO 3: MÉTRICAS POR TEMA
// ============================================================================

function calcularMetricasPorTema(deliberacoes) {
    const cached = getCachedMetricas('grupo3');
    if (cached) return cached;

    const temasMap = {};

    deliberacoes.forEach(delib => {
        const tema = delib.microtema || 'Não classificado';
        const data = extrairData(delib);
        const mesAno = getMesAno(data);
        const ano = data ? data.getFullYear() : null;

        if (!temasMap[tema]) {
            temasMap[tema] = {
                tema,
                totalDeliberacoes: 0,
                deferidos: 0,
                indeferidos: 0,
                porMes: {},
                porAno: {},
                diretoresVotos: {}
            };
        }

        const t = temasMap[tema];
        t.totalDeliberacoes++;
        if (delib.resultado === 'Deferido') t.deferidos++;
        if (delib.resultado === 'Indeferido') t.indeferidos++;

        // Por mês
        if (mesAno) {
            if (!t.porMes[mesAno]) t.porMes[mesAno] = { quantidade: 0, deferidos: 0, indeferidos: 0 };
            t.porMes[mesAno].quantidade++;
            if (delib.resultado === 'Deferido') t.porMes[mesAno].deferidos++;
            if (delib.resultado === 'Indeferido') t.porMes[mesAno].indeferidos++;
        }

        // Por ano
        if (ano) {
            if (!t.porAno[ano]) t.porAno[ano] = { quantidade: 0, deferidos: 0, indeferidos: 0 };
            t.porAno[ano].quantidade++;
            if (delib.resultado === 'Deferido') t.porAno[ano].deferidos++;
            if (delib.resultado === 'Indeferido') t.porAno[ano].indeferidos++;
        }

        // Diretores que votam neste tema
        [...(delib.votos_a_favor || []), ...(delib.votos_contra || [])].forEach(dir => {
            t.diretoresVotos[dir] = (t.diretoresVotos[dir] || 0) + 1;
        });
    });

    // Ordena por total e adiciona ranking
    const temas = Object.values(temasMap)
        .sort((a, b) => b.totalDeliberacoes - a.totalDeliberacoes)
        .map((t, idx) => ({
            tema: t.tema,
            totalDeliberacoes: t.totalDeliberacoes,
            posicaoRanking: idx + 1,
            deferidos: t.deferidos,
            indeferidos: t.indeferidos,
            taxaDeferimento: t.totalDeliberacoes > 0 ? Math.round((t.deferidos / t.totalDeliberacoes) * 1000) / 10 : 0,
            taxaIndeferimento: t.totalDeliberacoes > 0 ? Math.round((t.indeferidos / t.totalDeliberacoes) * 1000) / 10 : 0,
            evolucaoAnual: Object.entries(t.porAno)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([ano, dados]) => ({
                    ano: parseInt(ano),
                    quantidade: dados.quantidade,
                    taxaDeferimento: dados.quantidade > 0 ? Math.round((dados.deferidos / dados.quantidade) * 1000) / 10 : 0
                })),
            evolucaoMensal: Object.entries(t.porMes)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([mes, dados]) => ({
                    mes,
                    quantidade: dados.quantidade,
                    taxaDeferimento: dados.quantidade > 0 ? Math.round((dados.deferidos / dados.quantidade) * 1000) / 10 : 0
                })),
            diretoresQueMaisVotam: Object.entries(t.diretoresVotos)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([nome, votos]) => ({ nome, votos }))
        }));

    const resultado = {
        temas,
        totalTemas: temas.length,
        temaMaisRecorrente: temas[0] || null,
        temaMaisDeferido: [...temas].sort((a, b) => b.taxaDeferimento - a.taxaDeferimento)[0] || null,
        temaMaisIndeferido: [...temas].sort((a, b) => b.taxaIndeferimento - a.taxaIndeferimento)[0] || null,
        atualizadoEm: new Date().toISOString()
    };

    setCachedMetricas('grupo3', resultado);
    return resultado;
}

// ============================================================================
// GRUPO 4: MÉTRICAS INSTITUCIONAIS
// ============================================================================

function calcularMetricasInstitucionais(deliberacoes) {
    const cached = getCachedMetricas('grupo4');
    if (cached) return cached;

    // Reuniões únicas
    const reunioesSet = new Set();
    const reunioesPorAno = {};
    deliberacoes.forEach(d => {
        const reuniao = d.reuniao_ordinaria || d.numero_deliberacao;
        if (reuniao) reunioesSet.add(reuniao);

        const data = extrairData(d);
        if (data) {
            const ano = data.getFullYear();
            if (!reunioesPorAno[ano]) reunioesPorAno[ano] = new Set();
            if (reuniao) reunioesPorAno[ano].add(reuniao);
        }
    });

    // Pauta interna vs externa
    const pautaInterna = deliberacoes.filter(d =>
        d.classificacao === 'Pauta Interna da Agência' ||
        d.interessado === 'ARTESP' ||
        d.interessado === 'Sem interessado'
    ).length;
    const pautaExterna = deliberacoes.length - pautaInterna;

    // Tempo médio entre reuniões
    const datasReunioes = [...new Set(deliberacoes.map(d => d.data_reuniao).filter(Boolean))]
        .map(d => new Date(d))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a - b);

    let tempoMedioEntreReunioes = 0;
    if (datasReunioes.length >= 2) {
        let somaDias = 0;
        for (let i = 1; i < datasReunioes.length; i++) {
            somaDias += (datasReunioes[i] - datasReunioes[i - 1]) / (1000 * 60 * 60 * 24);
        }
        tempoMedioEntreReunioes = Math.round((somaDias / (datasReunioes.length - 1)) * 10) / 10;
    }

    // Reuniões por ano (convertendo Sets para counts)
    const reunioesNoAno = {};
    for (const [ano, set] of Object.entries(reunioesPorAno)) {
        reunioesNoAno[ano] = set.size;
    }

    // Agências representadas
    const agencias = [...new Set(deliberacoes.map(d => d.agencia || 'ARTESP'))];

    const resultado = {
        agencia: agencias.length === 1 ? agencias[0] : agencias.join(', '),
        reunioesNoAno,
        totalReunioes: reunioesSet.size,
        tempoMedioEntreReunioes,
        totalDeliberacoes: deliberacoes.length,
        pautaInterna,
        pautaExterna,
        percentualPautaInterna: deliberacoes.length > 0 ? Math.round((pautaInterna / deliberacoes.length) * 1000) / 10 : 0,
        percentualPautaExterna: deliberacoes.length > 0 ? Math.round((pautaExterna / deliberacoes.length) * 1000) / 10 : 0,
        atualizadoEm: new Date().toISOString()
    };

    setCachedMetricas('grupo4', resultado);
    return resultado;
}

// ============================================================================
// GRUPO 5: MÉTRICAS COMPETITIVAS
// ============================================================================

function calcularMetricasCompetitivas(deliberacoes) {
    const cached = getCachedMetricas('grupo5');
    if (cached) return cached;

    // Comparação entre diretores
    const diretoresMap = {};
    deliberacoes.forEach(d => {
        const processarDir = (diretor, tipo) => {
            if (!diretoresMap[diretor]) {
                diretoresMap[diretor] = { favor: 0, contra: 0, total: 0, deferidos: 0, indeferidos: 0 };
            }
            diretoresMap[diretor].total++;
            if (tipo === 'favor') diretoresMap[diretor].favor++;
            if (tipo === 'contra') diretoresMap[diretor].contra++;
            if (d.resultado === 'Deferido') diretoresMap[diretor].deferidos++;
            if (d.resultado === 'Indeferido') diretoresMap[diretor].indeferidos++;
        };

        (d.votos_a_favor || []).forEach(dir => processarDir(dir, 'favor'));
        (d.votos_contra || []).forEach(dir => processarDir(dir, 'contra'));
    });

    const comparacaoDiretores = Object.entries(diretoresMap).map(([nome, dados]) => ({
        nome,
        taxaDeferimento: dados.total > 0 ? Math.round((dados.deferidos / dados.total) * 1000) / 10 : 0,
        divergencias: dados.contra,
        tendencia: 'estável', // Calculado com dados temporais no grupo 2
        totalVotos: dados.total
    })).sort((a, b) => b.totalVotos - a.totalVotos);

    // Matriz TEMA x DIRETOR x DECISÃO
    const matrizTemaDiretorDecisao = {};
    deliberacoes.forEach(d => {
        const tema = d.microtema || 'Outros';
        if (!matrizTemaDiretorDecisao[tema]) matrizTemaDiretorDecisao[tema] = {};

        [...(d.votos_a_favor || []), ...(d.votos_contra || [])].forEach(dir => {
            if (!matrizTemaDiretorDecisao[tema][dir]) {
                matrizTemaDiretorDecisao[tema][dir] = { deferidos: 0, indeferidos: 0, total: 0 };
            }
            matrizTemaDiretorDecisao[tema][dir].total++;
            if (d.resultado === 'Deferido') matrizTemaDiretorDecisao[tema][dir].deferidos++;
            if (d.resultado === 'Indeferido') matrizTemaDiretorDecisao[tema][dir].indeferidos++;
        });
    });

    // Análise de padrões
    const temaTaxas = {};
    deliberacoes.forEach(d => {
        const tema = d.microtema || 'Outros';
        if (!temaTaxas[tema]) temaTaxas[tema] = { deferidos: 0, total: 0 };
        temaTaxas[tema].total++;
        if (d.resultado === 'Deferido') temaTaxas[tema].deferidos++;
    });

    const temasOrdenados = Object.entries(temaTaxas)
        .map(([tema, dados]) => ({ tema, taxa: dados.total > 0 ? dados.deferidos / dados.total : 0, total: dados.total }))
        .filter(t => t.total >= 3) // Mínimo de 3 deliberações para significância
        .sort((a, b) => b.taxa - a.taxa);

    const temasMaisDeferidos = temasOrdenados.slice(0, 5).map(t => t.tema);
    const temasMaisIndeferidos = temasOrdenados.reverse().slice(0, 5).map(t => t.tema);

    // Diretor mais rigoroso / mais flexível
    const diretoresComTaxa = comparacaoDiretores.filter(d => d.totalVotos >= 5);
    const diretorMaisRigoroso = diretoresComTaxa.sort((a, b) => a.taxaDeferimento - b.taxaDeferimento)[0]?.nome || 'N/A';
    const diretorMaisFlexivel = diretoresComTaxa.sort((a, b) => b.taxaDeferimento - a.taxaDeferimento)[0]?.nome || 'N/A';

    const resultado = {
        comparacaoDiretores,
        matrizTemaDiretorDecisao,
        padroes: {
            temasMaisDeferidos,
            temasMaisIndeferidos,
            diretorMaisRigoroso,
            diretorMaisFlexivel
        },
        totalDeliberacoes: deliberacoes.length,
        atualizadoEm: new Date().toISOString()
    };

    setCachedMetricas('grupo5', resultado);
    return resultado;
}

// ============================================================================
// CÁLCULO COMPLETO (todos os 5 grupos de uma vez)
// ============================================================================

function calcularTodasMetricas(deliberacoes, temposMedios = {}) {
    const cached = getCachedMetricas('all');
    if (cached) return cached;

    const resultado = {
        valorRegulatorio: calcularMetricasValorRegulatorio(deliberacoes, temposMedios),
        porDiretor: calcularMetricasPorDiretor(deliberacoes),
        porTema: calcularMetricasPorTema(deliberacoes),
        institucional: calcularMetricasInstitucionais(deliberacoes),
        competitivo: calcularMetricasCompetitivas(deliberacoes),
        resumo: {
            totalDeliberacoes: deliberacoes.length,
            totalDiretores: new Set([
                ...deliberacoes.flatMap(d => d.votos_a_favor || []),
                ...deliberacoes.flatMap(d => d.votos_contra || [])
            ]).size,
            totalTemas: new Set(deliberacoes.map(d => d.microtema).filter(Boolean)).size,
            totalReunioes: new Set(deliberacoes.map(d => d.reuniao_ordinaria).filter(Boolean)).size
        },
        geradoEm: new Date().toISOString()
    };

    setCachedMetricas('all', resultado);
    return resultado;
}

module.exports = {
    // Grupos individuais
    calcularMetricasValorRegulatorio,
    calcularMetricasPorDiretor,
    calcularMetricasPorTema,
    calcularMetricasInstitucionais,
    calcularMetricasCompetitivas,

    // Cálculo completo
    calcularTodasMetricas,

    // Cache
    invalidarCache,

    // Config
    MANDATOS_DIRETORES
};
