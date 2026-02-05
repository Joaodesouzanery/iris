/**
 * Serviço de Persistência - IRIS
 *
 * Gerencia a persistência de deliberações e votos no Supabase
 * Inclui atualização de status de reuniões
 */

const logger = require('../utils/logger');

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

/**
 * Verifica se a configuração do Supabase está disponível
 */
function verificarConfiguracao() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error(
            'Configuração do Supabase não encontrada. ' +
            'Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env'
        );
    }
}

/**
 * Faz requisição ao Supabase REST API
 */
async function supabaseRequest(method, table, data = null, query = '') {
    verificarConfiguracao();

    const axios = require('axios');

    const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;

    const config = {
        method,
        url,
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
        logger.error('Persistencia', `Erro na requisição Supabase: ${mensagem}`, {
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
 * @param {Object} filtros - Filtros de busca
 * @returns {Promise<Array>} Lista de deliberações
 */
async function buscarDeliberacoes(filtros = {}) {
    logger.info('Persistencia', 'Buscando deliberações', filtros);

    let query = '?select=id,processo,numero_reuniao,data_reuniao,link_pdf,raw_data';

    // Aplica filtros
    if (filtros.agencia) {
        query += `&agencia=eq.${filtros.agencia}`;
    }

    if (filtros.numeroReuniao) {
        query += `&numero_reuniao=eq.${filtros.numeroReuniao}`;
    }

    if (filtros.dataReuniao) {
        query += `&data_reuniao=eq.${filtros.dataReuniao}`;
    }

    // Limita resultados
    if (filtros.limite) {
        query += `&limit=${filtros.limite}`;
    } else {
        query += '&limit=1000';
    }

    // Ordena por data mais recente
    query += '&order=created_at.desc';

    const resultado = await supabaseRequest('GET', 'deliberacoes_extraidas', null, query);

    // Transforma para formato de verificação de duplicidade
    return (resultado || []).map(d => ({
        id: d.id,
        processos: extrairProcessosDoRawData(d.raw_data),
        numeroDeliberacao: d.processo,
        hashTexto: d.raw_data?.hash,
        texto: d.raw_data?.texto_completo
    }));
}

/**
 * Extrai números de processo do raw_data
 */
function extrairProcessosDoRawData(rawData) {
    if (!rawData) return [];

    const processos = [];

    if (rawData.processos) {
        processos.push(...rawData.processos);
    }

    if (rawData.numero_processo) {
        processos.push(rawData.numero_processo);
    }

    return processos;
}

/**
 * Salva uma deliberação processada no banco
 * @param {Object} deliberacao - Dados da deliberação
 * @returns {Promise<Object>} Deliberação salva com ID
 */
async function salvarDeliberacao(deliberacao) {
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
        pauta_interna: deliberacao.tipo === 'Ato Administrativo Interno',
        microtema: deliberacao.microtema,
        resumo_pleito: deliberacao.resumoPleito || deliberacao.texto?.substring(0, 500),
        decisao: deliberacao.decisao,
        link_pdf: deliberacao.linkPdf,
        raw_data: {
            // Dados de classificação
            tipo: deliberacao.tipo,
            tipo_confianca: deliberacao.tipoConfianca,
            tipo_justificativa: deliberacao.tipoJustificativa,
            decisao_confianca: deliberacao.decisaoConfianca,
            decisao_justificativa: deliberacao.decisaoJustificativa,
            microtema_confianca: deliberacao.microtemaConfianca,
            microtema_justificativa: deliberacao.microtemaJustificativa,
            confianca_geral: deliberacao.confiancaGeral,

            // Dados de votação
            tipo_votacao: deliberacao.tipoVotacao,
            total_votantes: deliberacao.totalVotantes,
            votos_favoraveis: deliberacao.votosFavoraveis,
            votos_contrarios: deliberacao.votosContrarios,
            abstencoes: deliberacao.abstencoes,

            // Dados originais
            texto_completo: deliberacao.texto,
            hash: deliberacao.hashTexto,
            processos: deliberacao.processos,

            // Metadados
            fonte: 'iris-core',
            processado_em: new Date().toISOString(),
            versao_processador: '1.0.0'
        }
    };

    const resultado = await supabaseRequest('POST', 'deliberacoes_extraidas', dados);

    if (resultado && resultado.length > 0) {
        logger.info('Persistencia', 'Deliberação salva com sucesso', {
            id: resultado[0].id
        });
        return resultado[0];
    }

    return null;
}

/**
 * Atualiza uma deliberação existente
 * @param {string} id - ID da deliberação
 * @param {Object} dados - Dados para atualizar
 * @returns {Promise<Object>} Deliberação atualizada
 */
async function atualizarDeliberacao(id, dados) {
    logger.info('Persistencia', 'Atualizando deliberação', { id });

    const query = `?id=eq.${id}`;

    await supabaseRequest('PATCH', 'deliberacoes_extraidas', dados, query);

    logger.info('Persistencia', 'Deliberação atualizada', { id });

    return { id, ...dados };
}

// ============================================================================
// OPERAÇÕES COM VOTOS
// ============================================================================

/**
 * Salva votos de uma deliberação
 * @param {string} deliberacaoId - ID da deliberação
 * @param {Array<Object>} votos - Lista de votos
 * @returns {Promise<Array>} Votos salvos
 */
async function salvarVotos(deliberacaoId, votos) {
    if (!votos || votos.length === 0) {
        return [];
    }

    logger.info('Persistencia', 'Salvando votos', {
        deliberacaoId,
        totalVotos: votos.length
    });

    // Primeiro, busca ou cria os diretores
    const votosSalvos = [];

    for (const voto of votos) {
        try {
            // Busca ou cria o diretor
            const diretor = await buscarOuCriarDiretor(voto.diretor, voto.cargo);

            // Salva o voto
            const dadosVoto = {
                deliberacao_id: deliberacaoId,
                director_id: diretor?.id,
                vote_type: mapearTipoVoto(voto.voto),
                confidence_score: voto.confianca / 100, // Converte para 0-1
                notes: voto.observacao
            };

            const resultado = await supabaseRequest('POST', 'votes', dadosVoto);

            if (resultado && resultado.length > 0) {
                votosSalvos.push(resultado[0]);
            }
        } catch (error) {
            logger.warn('Persistencia', `Erro ao salvar voto de ${voto.diretor}`, {
                erro: error.message
            });
        }
    }

    logger.info('Persistencia', 'Votos salvos', {
        deliberacaoId,
        salvos: votosSalvos.length,
        total: votos.length
    });

    return votosSalvos;
}

/**
 * Busca ou cria um diretor no banco
 */
async function buscarOuCriarDiretor(nome, cargo) {
    if (!nome) return null;

    try {
        // Busca diretor existente
        const query = `?name=ilike.${encodeURIComponent(nome)}&limit=1`;
        const existentes = await supabaseRequest('GET', 'directors', null, query);

        if (existentes && existentes.length > 0) {
            return existentes[0];
        }

        // Cria novo diretor
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

/**
 * Mapeia tipo de voto para enum do banco
 */
function mapearTipoVoto(voto) {
    const mapeamento = {
        'Favorável': 'FAVORABLE',
        'Contrário': 'AGAINST',
        'Abstenção': 'ABSTENTION',
        'Ausente/Impedido': 'ABSENT'
    };

    return mapeamento[voto] || 'UNKNOWN';
}

// ============================================================================
// OPERAÇÕES COM STATUS DE REUNIÃO
// ============================================================================

/**
 * Atualiza o status de processamento de uma reunião
 * @param {Object} filtros - Filtros para identificar a reunião
 * @param {string} status - Novo status
 * @param {Object} dados - Dados adicionais
 * @returns {Promise<void>}
 */
async function atualizarStatusReuniao(filtros, status, dados = {}) {
    logger.info('Persistencia', 'Atualizando status da reunião', {
        filtros,
        status
    });

    // Status possíveis: pendente, processando, processado, erro
    const statusMap = {
        'pendente': 'PENDING',
        'processando': 'PROCESSING',
        'processado': 'COMPLETED',
        'erro': 'ERROR'
    };

    const dadosAtualizacao = {
        processing_status: statusMap[status] || status,
        last_processed_at: new Date().toISOString(),
        ...dados
    };

    // Tenta atualizar via reunioes_monitoradas se existir
    // Se não existir, atualiza o raw_data das deliberações

    try {
        // Busca deliberações da reunião
        let query = '?select=id,raw_data';

        if (filtros.numeroReuniao) {
            query += `&numero_reuniao=eq.${filtros.numeroReuniao}`;
        }

        if (filtros.dataReuniao) {
            query += `&data_reuniao=eq.${filtros.dataReuniao}`;
        }

        query += '&limit=100';

        const deliberacoes = await supabaseRequest('GET', 'deliberacoes_extraidas', null, query);

        // Atualiza cada deliberação com o status
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
                `?id=eq.${delib.id}`
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

/**
 * Registra log de processamento no banco
 * @param {Object} logData - Dados do log
 * @returns {Promise<void>}
 */
async function registrarLogProcessamento(logData) {
    try {
        const dados = {
            tipo: logData.tipo || 'PROCESSAMENTO',
            nivel: logData.nivel || 'INFO',
            mensagem: logData.mensagem,
            detalhes: logData.detalhes || {},
            created_at: new Date().toISOString()
        };

        // Tenta salvar na tabela de logs se existir
        await supabaseRequest('POST', 'processing_logs', dados);

    } catch (error) {
        // Se a tabela não existir, apenas loga localmente
        logger.debug('Persistencia', 'Tabela de logs não disponível', {
            erro: error.message
        });
    }
}

// ============================================================================
// OPERAÇÕES DE CONSULTA
// ============================================================================

/**
 * Busca estatísticas de processamento
 * @returns {Promise<Object>} Estatísticas
 */
async function buscarEstatisticas() {
    try {
        // Total de deliberações
        const totalQuery = '?select=count&agencia=eq.ARTESP';
        const totalResult = await supabaseRequest('GET', 'deliberacoes_extraidas', null, totalQuery);

        // Deliberações por decisão
        const decisoesQuery = '?select=decisao,count&agencia=eq.ARTESP';
        // Nota: Supabase não suporta GROUP BY via REST diretamente
        // Seria necessário uma função RPC ou view

        return {
            total: totalResult?.[0]?.count || 0,
            ultimaAtualizacao: new Date().toISOString()
        };

    } catch (error) {
        logger.error('Persistencia', 'Erro ao buscar estatísticas', {
            erro: error.message
        });
        return { total: 0, erro: error.message };
    }
}

module.exports = {
    // Verificação
    verificarConfiguracao,

    // Deliberações
    buscarDeliberacoes,
    salvarDeliberacao,
    atualizarDeliberacao,

    // Votos
    salvarVotos,
    buscarOuCriarDiretor,

    // Status
    atualizarStatusReuniao,
    registrarLogProcessamento,

    // Consultas
    buscarEstatisticas
};
