/**
 * Serviço de Persistência - IRIS
 *
 * Gerencia a persistência de deliberações e votos.
 * Supabase REST API com fallback para armazenamento em memória.
 *
 * Segurança: Todos os valores de filtro são sanitizados via encodeURIComponent
 * antes de serem interpolados em query strings do PostgREST.
 */

const logger = require('../utils/logger');

// ============================================================================
// QUERY CACHE (TTL-based)
// ============================================================================
const queryCache = new Map();
const QUERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedQuery(key) {
    const entry = queryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.time > QUERY_CACHE_TTL) {
        queryCache.delete(key);
        return null;
    }
    return entry.data;
}

function setCachedQuery(key, data) {
    if (queryCache.size > 200) {
        const oldest = queryCache.keys().next().value;
        queryCache.delete(oldest);
    }
    queryCache.set(key, { data, time: Date.now() });
}

function invalidateQueryCache() {
    queryCache.clear();
}

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// In-memory fallback storage
const memoryStore = {
    deliberacoes: [],
    directors: [],
    votes: [],
    logs: [],
    _idCounter: 1
};

function _generateId() {
    return `mem-${Date.now()}-${memoryStore._idCounter++}`;
}

/**
 * Verifica se o Supabase está configurado e disponível
 */
function isSupabaseAvailable() {
    return !!(SUPABASE_URL &&
              !SUPABASE_URL.includes('SEU_PROJECT_ID') &&
              SUPABASE_KEY &&
              !SUPABASE_KEY.includes('COLE_SUA'));
}

/**
 * Sanitiza valor para uso seguro em query PostgREST
 */
function sanitizeQueryValue(value) {
    if (value === null || value === undefined) return '';
    return encodeURIComponent(String(value));
}

/**
 * Sanitiza inteiro para uso em limit/offset
 */
function sanitizeInt(value, defaultVal = 100, max = 10000) {
    const parsed = parseInt(value);
    if (isNaN(parsed) || parsed < 0) return defaultVal;
    return Math.min(parsed, max);
}

/**
 * Faz requisição ao Supabase REST API
 */
async function supabaseRequest(method, table, data = null, query = '') {
    if (!isSupabaseAvailable()) {
        throw new Error('Supabase não configurado');
    }

    const axios = require('axios');

    const url = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}${query}`;

    const config = {
        method,
        url,
        timeout: 15000,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
        }
    };

    if (data) {
        config.data = data;
    }

    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        const mensagem = error.response?.data?.message || error.message;
        logger.error('Persistencia', `Erro Supabase: ${mensagem}`, {
            method,
            table,
            status: error.response?.status
        });
        throw new Error(`Erro Supabase: ${mensagem}`);
    }
}

// ============================================================================
// OPERAÇÕES COM DELIBERAÇÕES
// ============================================================================

/**
 * Busca deliberações existentes para verificação de duplicidade
 */
async function buscarDeliberacoes(filtros = {}) {
    logger.info('Persistencia', 'Buscando deliberações', filtros);

    // Check query cache
    const cacheKey = `delibs:${JSON.stringify(filtros)}`;
    const cached = getCachedQuery(cacheKey);
    if (cached) return cached;

    if (!isSupabaseAvailable()) {
        // Fallback: busca em memória
        let resultado = [...memoryStore.deliberacoes];

        if (filtros.agencia) {
            resultado = resultado.filter(d => d.agencia === filtros.agencia);
        }
        if (filtros.numeroReuniao) {
            resultado = resultado.filter(d => d.numero_reuniao === filtros.numeroReuniao);
        }

        const limite = sanitizeInt(filtros.limite, 1000);
        resultado = resultado.slice(0, limite);

        const mapped = resultado.map(d => ({
            id: d.id,
            processos: d.raw_data?.processos || [],
            numeroDeliberacao: d.processo,
            hashTexto: d.raw_data?.hash,
            texto: d.raw_data?.texto_completo
        }));
        setCachedQuery(cacheKey, mapped);
        return mapped;
    }

    let query = '?select=id,processo,numero_reuniao,data_reuniao,link_pdf,raw_data';

    if (filtros.agencia) {
        query += `&agencia=eq.${sanitizeQueryValue(filtros.agencia)}`;
    }

    if (filtros.numeroReuniao) {
        query += `&numero_reuniao=eq.${sanitizeQueryValue(filtros.numeroReuniao)}`;
    }

    if (filtros.dataReuniao) {
        query += `&data_reuniao=eq.${sanitizeQueryValue(filtros.dataReuniao)}`;
    }

    const limite = sanitizeInt(filtros.limite, 1000);
    query += `&limit=${limite}`;
    query += '&order=created_at.desc';

    const resultado = await supabaseRequest('GET', 'deliberacoes_extraidas', null, query);

    const mapped = (resultado || []).map(d => ({
        id: d.id,
        processos: extrairProcessosDoRawData(d.raw_data),
        numeroDeliberacao: d.processo,
        hashTexto: d.raw_data?.hash,
        texto: d.raw_data?.texto_completo
    }));
    setCachedQuery(cacheKey, mapped);
    return mapped;
}

function extrairProcessosDoRawData(rawData) {
    if (!rawData) return [];
    const processos = [];
    if (rawData.processos) processos.push(...rawData.processos);
    if (rawData.numero_processo) processos.push(rawData.numero_processo);
    return processos;
}

/**
 * Busca deliberações completas com filtros avançados (para endpoints de leitura)
 */
async function buscarDeliberacoesCompletas(filtros = {}) {
    if (!isSupabaseAvailable()) {
        let resultado = [...memoryStore.deliberacoes];

        if (filtros.agencia) resultado = resultado.filter(d => d.agencia === filtros.agencia);
        if (filtros.decisao) resultado = resultado.filter(d => d.decisao === filtros.decisao);
        if (filtros.microtema) resultado = resultado.filter(d => d.microtema && d.microtema.toLowerCase().includes(filtros.microtema.toLowerCase()));
        if (filtros.interessado) resultado = resultado.filter(d => d.interessado && d.interessado.toLowerCase().includes(filtros.interessado.toLowerCase()));

        const offset = sanitizeInt(filtros.offset, 0);
        const limite = sanitizeInt(filtros.limite, 100, 500);
        return resultado.slice(offset, offset + limite);
    }

    let query = '?select=id,processo,numero_reuniao,data_reuniao,interessado,tipo_deliberacao,microtema,decisao,resumo_pleito,votos_favor,votos_contra,agencia,link_pdf,created_at';

    if (filtros.agencia) {
        query += `&agencia=eq.${sanitizeQueryValue(filtros.agencia)}`;
    }
    if (filtros.decisao) {
        query += `&decisao=eq.${sanitizeQueryValue(filtros.decisao)}`;
    }
    if (filtros.microtema) {
        query += `&microtema=ilike.*${sanitizeQueryValue(filtros.microtema)}*`;
    }
    if (filtros.interessado) {
        query += `&interessado=ilike.*${sanitizeQueryValue(filtros.interessado)}*`;
    }
    if (filtros.dataInicio) {
        query += `&data_reuniao=gte.${sanitizeQueryValue(filtros.dataInicio)}`;
    }
    if (filtros.dataFim) {
        query += `&data_reuniao=lte.${sanitizeQueryValue(filtros.dataFim)}`;
    }

    const limite = sanitizeInt(filtros.limite, 100, 500);
    const offset = sanitizeInt(filtros.offset, 0);
    query += `&limit=${limite}&offset=${offset}`;
    query += '&order=created_at.desc';

    return await supabaseRequest('GET', 'deliberacoes_extraidas', null, query);
}

/**
 * Salva uma deliberação processada
 */
async function salvarDeliberacao(deliberacao) {
    // Invalidate read cache on write
    invalidateQueryCache();

    logger.info('Persistencia', 'Salvando deliberação', {
        tipo: deliberacao.tipo,
        decisao: deliberacao.decisao,
        microtema: deliberacao.microtema
    });

    const dados = {
        agencia: deliberacao.agencia || 'ARTESP',
        numero_reuniao: deliberacao.numeroReuniao,
        data_reuniao: deliberacao.dataReuniao,
        processo: deliberacao.processo || deliberacao.processos?.[0],
        interessado: deliberacao.interessado || 'A identificar',
        tipo_deliberacao: deliberacao.tipo,
        pauta_interna: deliberacao.tipo === 'Ato Administrativo Interno',
        microtema: deliberacao.microtema,
        resumo_pleito: deliberacao.resumoPleito || deliberacao.texto?.substring(0, 500),
        fundamento_decisao: deliberacao.fundamentoDecisao || null,
        decisao: deliberacao.decisao,
        votos_favor: deliberacao.votosFavoraveis ? (Array.isArray(deliberacao.votosFavoraveis) ? deliberacao.votosFavoraveis.join(', ') : String(deliberacao.votosFavoraveis)) : null,
        votos_contra: deliberacao.votosContrarios ? (Array.isArray(deliberacao.votosContrarios) ? deliberacao.votosContrarios.join(', ') : String(deliberacao.votosContrarios)) : null,
        link_pdf: deliberacao.linkPdf,
        raw_data: {
            tipo: deliberacao.tipo,
            tipo_confianca: deliberacao.tipoConfianca,
            tipo_justificativa: deliberacao.tipoJustificativa,
            decisao_confianca: deliberacao.decisaoConfianca,
            decisao_justificativa: deliberacao.decisaoJustificativa,
            microtema_confianca: deliberacao.microtemaConfianca,
            microtema_justificativa: deliberacao.microtemaJustificativa,
            confianca_geral: deliberacao.confiancaGeral,
            tipo_votacao: deliberacao.tipoVotacao,
            total_votantes: deliberacao.totalVotantes,
            votos_favoraveis: deliberacao.votosFavoraveis,
            votos_contrarios: deliberacao.votosContrarios,
            abstencoes: deliberacao.abstencoes,
            hash: deliberacao.hashTexto,
            processos: deliberacao.processos,
            fonte: 'iris-core',
            processado_em: new Date().toISOString(),
            versao_processador: '2.0.0'
        }
    };

    if (!isSupabaseAvailable()) {
        // Fallback: salva em memória
        const record = { id: _generateId(), ...dados, created_at: new Date().toISOString() };
        memoryStore.deliberacoes.push(record);
        logger.info('Persistencia', 'Deliberação salva em memória', { id: record.id });
        return record;
    }

    const resultado = await supabaseRequest('POST', 'deliberacoes_extraidas', dados);

    if (resultado && resultado.length > 0) {
        logger.info('Persistencia', 'Deliberação salva no Supabase', { id: resultado[0].id });
        return resultado[0];
    }

    return null;
}

/**
 * Atualiza uma deliberação existente
 */
async function atualizarDeliberacao(id, dados) {
    logger.info('Persistencia', 'Atualizando deliberação', { id });

    if (!isSupabaseAvailable()) {
        const idx = memoryStore.deliberacoes.findIndex(d => d.id === id);
        if (idx >= 0) {
            memoryStore.deliberacoes[idx] = { ...memoryStore.deliberacoes[idx], ...dados };
        }
        return { id, ...dados };
    }

    const query = `?id=eq.${sanitizeQueryValue(id)}`;
    await supabaseRequest('PATCH', 'deliberacoes_extraidas', dados, query);
    return { id, ...dados };
}

// ============================================================================
// OPERAÇÕES COM VOTOS
// ============================================================================

async function salvarVotos(deliberacaoId, votos) {
    if (!votos || votos.length === 0) return { saved: [], errors: [], totalAttempted: 0 };

    logger.info('Persistencia', 'Salvando votos', {
        deliberacaoId,
        totalVotos: votos.length
    });

    // Batch load directors to avoid N+1
    const uniqueNames = [...new Set(votos.map(v => v.diretor).filter(Boolean))];
    const diretorMap = new Map();
    for (const nome of uniqueNames) {
        const diretor = await buscarOuCriarDiretor(nome, votos.find(v => v.diretor === nome)?.cargo);
        if (diretor) diretorMap.set(nome, diretor);
    }

    const votosSalvos = [];
    const erros = [];

    for (const voto of votos) {
        try {
            const diretor = diretorMap.get(voto.diretor) || null;

            const dadosVoto = {
                deliberacao_id: deliberacaoId,
                director_id: diretor?.id,
                vote_type: mapearTipoVoto(voto.voto),
                confidence_score: Math.min(1, Math.max(0, (voto.confianca || 50) / 100)),
                notes: voto.observacao
            };

            if (!isSupabaseAvailable()) {
                const record = { id: _generateId(), ...dadosVoto, created_at: new Date().toISOString() };
                memoryStore.votes.push(record);
                votosSalvos.push(record);
            } else {
                const resultado = await supabaseRequest('POST', 'votes', dadosVoto);
                if (resultado && resultado.length > 0) {
                    votosSalvos.push(resultado[0]);
                }
            }
        } catch (error) {
            erros.push({ diretor: voto.diretor, error: error.message });
            logger.warn('Persistencia', `Erro ao salvar voto de ${voto.diretor}`, {
                erro: error.message
            });
        }
    }

    logger.info('Persistencia', 'Votos salvos', {
        deliberacaoId,
        salvos: votosSalvos.length,
        erros: erros.length,
        total: votos.length
    });

    return { saved: votosSalvos, errors: erros, totalAttempted: votos.length };
}

async function buscarOuCriarDiretor(nome, cargo) {
    if (!nome) return null;

    if (!isSupabaseAvailable()) {
        let existing = memoryStore.directors.find(
            d => d.name.toLowerCase() === nome.toLowerCase()
        );
        if (existing) return existing;

        const record = {
            id: _generateId(),
            name: nome,
            role: cargo || 'Diretor',
            agency: 'ARTESP',
            is_active: true,
            created_at: new Date().toISOString()
        };
        memoryStore.directors.push(record);
        return record;
    }

    try {
        const query = `?name=ilike.${sanitizeQueryValue(nome)}&limit=1`;
        const existentes = await supabaseRequest('GET', 'directors', null, query);

        if (existentes && existentes.length > 0) {
            return existentes[0];
        }

        const novoDiretor = {
            name: nome,
            role: cargo || 'Diretor',
            agency: 'ARTESP',
            is_active: true
        };

        const resultado = await supabaseRequest('POST', 'directors', novoDiretor);

        if (resultado && resultado.length > 0) {
            logger.info('Persistencia', 'Novo diretor criado', { nome });
            return resultado[0];
        }
    } catch (error) {
        logger.warn('Persistencia', `Erro ao buscar/criar diretor ${nome}`, {
            erro: error.message
        });
    }

    return null;
}

function mapearTipoVoto(voto) {
    const mapeamento = {
        'Favorável': 'FAVORABLE',
        'Contrário': 'AGAINST',
        'Abstenção': 'ABSTENTION',
        'Ausente/Impedido': 'ABSENT'
    };
    return mapeamento[voto] || 'FAVORABLE';
}

// ============================================================================
// OPERAÇÕES COM STATUS DE REUNIÃO
// ============================================================================

async function atualizarStatusReuniao(filtros, status, dados = {}) {
    logger.info('Persistencia', 'Atualizando status da reunião', { filtros, status });

    if (!isSupabaseAvailable()) {
        // Em memória: atualiza raw_data das deliberações que correspondem
        memoryStore.deliberacoes.forEach(d => {
            const matchReuniao = !filtros.numeroReuniao || d.numero_reuniao === filtros.numeroReuniao;
            const matchData = !filtros.dataReuniao || d.data_reuniao === filtros.dataReuniao;
            if (matchReuniao && matchData) {
                d.raw_data = { ...d.raw_data, status_reuniao: status };
            }
        });
        return;
    }

    try {
        let query = '?select=id,raw_data';

        if (filtros.numeroReuniao) {
            query += `&numero_reuniao=eq.${sanitizeQueryValue(filtros.numeroReuniao)}`;
        }

        if (filtros.dataReuniao) {
            query += `&data_reuniao=eq.${sanitizeQueryValue(filtros.dataReuniao)}`;
        }

        query += '&limit=100';

        const deliberacoes = await supabaseRequest('GET', 'deliberacoes_extraidas', null, query);

        for (const delib of deliberacoes || []) {
            const rawDataAtualizado = {
                ...delib.raw_data,
                status_reuniao: status,
                ultima_atualizacao_status: new Date().toISOString()
            };

            await supabaseRequest(
                'PATCH',
                'deliberacoes_extraidas',
                { raw_data: rawDataAtualizado },
                `?id=eq.${sanitizeQueryValue(delib.id)}`
            );
        }

        logger.info('Persistencia', 'Status da reunião atualizado', {
            deliberacoesAtualizadas: deliberacoes?.length || 0
        });

    } catch (error) {
        logger.error('Persistencia', 'Erro ao atualizar status da reunião', {
            erro: error.message
        });
    }
}

async function registrarLogProcessamento(logData) {
    try {
        const dados = {
            tipo: logData.tipo || 'PROCESSAMENTO',
            nivel: logData.nivel || 'INFO',
            mensagem: logData.mensagem,
            detalhes: logData.detalhes || {},
            created_at: new Date().toISOString()
        };

        if (!isSupabaseAvailable()) {
            memoryStore.logs.push({ id: _generateId(), ...dados });
            return;
        }

        await supabaseRequest('POST', 'processing_logs', dados);

    } catch (error) {
        logger.debug('Persistencia', 'Tabela de logs não disponível', {
            erro: error.message
        });
    }
}

// ============================================================================
// OPERAÇÕES DE CONSULTA
// ============================================================================

async function buscarEstatisticas() {
    // Check cache (stats don't change often)
    const cached = getCachedQuery('stats:global');
    if (cached) return cached;

    if (!isSupabaseAvailable()) {
        // Single-pass reduce instead of multiple .filter()
        const stats = memoryStore.deliberacoes.reduce((acc, d) => {
            acc.total++;
            if (d.decisao === 'Deferido') acc.deferidos++;
            if (d.decisao === 'Indeferido') acc.indeferidos++;
            return acc;
        }, { total: 0, deferidos: 0, indeferidos: 0 });
        const result = { ...stats, ultimaAtualizacao: new Date().toISOString() };
        setCachedQuery('stats:global', result);
        return result;
    }

    try {
        const resultado = await supabaseRequest(
            'GET',
            'deliberacoes_extraidas',
            null,
            '?select=id,decisao&agencia=eq.ARTESP'
        );

        // Single-pass reduce
        const stats = (resultado || []).reduce((acc, d) => {
            acc.total++;
            if (d.decisao === 'Deferido') acc.deferidos++;
            if (d.decisao === 'Indeferido') acc.indeferidos++;
            return acc;
        }, { total: 0, deferidos: 0, indeferidos: 0 });
        const result = { ...stats, ultimaAtualizacao: new Date().toISOString() };
        setCachedQuery('stats:global', result);
        return result;

    } catch (error) {
        logger.error('Persistencia', 'Erro ao buscar estatísticas', {
            erro: error.message
        });
        return { total: 0, erro: error.message };
    }
}

/**
 * Busca diretores com resumo de votos
 */
async function buscarDiretores(filtros = {}) {
    if (!isSupabaseAvailable()) {
        return memoryStore.directors;
    }

    let query = '?select=id,name,role,agency,is_active,mandate_start,mandate_end';

    if (filtros.agency) {
        query += `&agency=eq.${sanitizeQueryValue(filtros.agency)}`;
    }
    if (filtros.ativo !== undefined) {
        query += `&is_active=eq.${filtros.ativo ? 'true' : 'false'}`;
    }

    query += '&order=name.asc';
    const limite = sanitizeInt(filtros.limite, 100);
    query += `&limit=${limite}`;

    return await supabaseRequest('GET', 'directors', null, query);
}

/**
 * Busca votos com detalhes
 */
async function buscarVotos(filtros = {}) {
    if (!isSupabaseAvailable()) {
        let resultado = [...memoryStore.votes];
        if (filtros.deliberacaoId) {
            resultado = resultado.filter(v => v.deliberacao_id === filtros.deliberacaoId);
        }
        return resultado;
    }

    let query = '?select=id,deliberacao_id,director_id,vote_type,confidence_score,notes,created_at';

    if (filtros.deliberacaoId) {
        query += `&deliberacao_id=eq.${sanitizeQueryValue(filtros.deliberacaoId)}`;
    }
    if (filtros.directorId) {
        query += `&director_id=eq.${sanitizeQueryValue(filtros.directorId)}`;
    }

    const limite = sanitizeInt(filtros.limite, 100);
    query += `&limit=${limite}`;
    query += '&order=created_at.desc';

    return await supabaseRequest('GET', 'votes', null, query);
}

/**
 * Retorna o status da conexão com Supabase
 */
function getStatus() {
    return {
        supabaseConfigured: isSupabaseAvailable(),
        mode: isSupabaseAvailable() ? 'supabase' : 'memory',
        memoryStats: {
            deliberacoes: memoryStore.deliberacoes.length,
            directors: memoryStore.directors.length,
            votes: memoryStore.votes.length,
            logs: memoryStore.logs.length
        }
    };
}

module.exports = {
    // Status
    isSupabaseAvailable,
    getStatus,

    // Verificação (backwards compat)
    verificarConfiguracao: () => {
        if (!isSupabaseAvailable()) {
            logger.warn('Persistencia', 'Supabase não configurado, usando memória');
        }
    },

    // Cache control
    invalidateQueryCache,

    // Deliberações
    buscarDeliberacoes,
    buscarDeliberacoesCompletas,
    salvarDeliberacao,
    atualizarDeliberacao,

    // Votos
    salvarVotos,
    buscarOuCriarDiretor,
    buscarVotos,

    // Diretores
    buscarDiretores,

    // Status de reunião
    atualizarStatusReuniao,
    registrarLogProcessamento,

    // Consultas
    buscarEstatisticas
};
