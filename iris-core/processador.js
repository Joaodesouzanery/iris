/**
 * Processador Principal de Deliberações - IRIS Core
 *
 * Orquestra o processamento completo de deliberações:
 * 1. Classificação (tipo, decisão, microtema)
 * 2. Extração de votos
 * 3. Detecção de duplicidade
 * 4. Persistência no banco
 * 5. Atualização de status
 */

require('dotenv').config();

const classificador = require('./services/classificador');
const extratorVotos = require('./services/extrator-votos');
const detectorDuplicidade = require('./services/detector-duplicidade');
const persistencia = require('./services/persistencia');
const logger = require('./utils/logger');

// ============================================================================
// PROCESSADOR DE DELIBERAÇÃO INDIVIDUAL
// ============================================================================

/**
 * Processa uma única deliberação
 * @param {Object} entrada - Dados de entrada da deliberação
 * @param {string} entrada.texto - Texto extraído da deliberação
 * @param {Object} entrada.metadata - Metadados (reunião, data, etc.)
 * @param {Object} opcoes - Opções de processamento
 * @returns {Promise<Object>} Resultado do processamento
 */
async function processarDeliberacao(entrada, opcoes = {}) {
    const startTime = Date.now();
    const resultado = {
        sucesso: false,
        deliberacaoId: null,
        classificacao: null,
        votacao: null,
        duplicidade: null,
        erro: null
    };

    try {
        logger.info('Processador', 'Iniciando processamento de deliberação', {
            tamanhoTexto: entrada.texto?.length || 0,
            reuniao: entrada.metadata?.numeroReuniao
        });

        // Validação de entrada
        if (!entrada.texto || entrada.texto.trim().length < 50) {
            throw new Error('Texto da deliberação muito curto ou vazio');
        }

        // 1. CLASSIFICAÇÃO
        logger.info('Processador', 'Etapa 1: Classificação');
        const classificacao = classificador.classificarDeliberacao(entrada.texto);
        resultado.classificacao = classificacao;

        logger.info('Processador', 'Classificação concluída', {
            tipo: classificacao.tipo,
            decisao: classificacao.decisao,
            microtema: classificacao.microtema,
            confianca: classificacao.confiancaGeral
        });

        // 2. EXTRAÇÃO DE VOTOS
        logger.info('Processador', 'Etapa 2: Extração de votos');
        const votacao = extratorVotos.extrairVotacao(entrada.texto);
        resultado.votacao = votacao;

        logger.info('Processador', 'Votos extraídos', {
            diretores: votacao.totalVotantes,
            tipoVotacao: votacao.tipoVotacao
        });

        // 3. PREPARAÇÃO PARA DUPLICIDADE
        logger.info('Processador', 'Etapa 3: Verificação de duplicidade');
        const dadosVerificacao = detectorDuplicidade.prepararParaVerificacao(entrada.texto);

        // Busca deliberações existentes para comparar
        const existentes = await persistencia.buscarDeliberacoes({
            agencia: entrada.metadata?.agencia || 'ARTESP',
            limite: 500
        });

        const duplicidade = detectorDuplicidade.verificarDuplicidade(dadosVerificacao, existentes);
        resultado.duplicidade = duplicidade;

        if (duplicidade.ehDuplicata) {
            logger.warn('Processador', 'Deliberação duplicada detectada', {
                criterio: duplicidade.criterioMatch,
                confianca: duplicidade.confianca,
                deliberacaoExistente: duplicidade.duplicataEncontrada?.id
            });

            if (!opcoes.permitirDuplicatas) {
                resultado.sucesso = false;
                resultado.erro = 'Deliberação duplicada';
                return resultado;
            }
        }

        // 4. PERSISTÊNCIA
        if (!opcoes.dryRun) {
            logger.info('Processador', 'Etapa 4: Persistência no banco');

            const deliberacaoParaSalvar = {
                // Dados básicos
                agencia: entrada.metadata?.agencia || 'ARTESP',
                numeroReuniao: entrada.metadata?.numeroReuniao,
                dataReuniao: entrada.metadata?.dataReuniao,
                linkPdf: entrada.metadata?.linkPdf,

                // Classificação
                tipo: classificacao.tipo,
                tipoConfianca: classificacao.tipoConfianca,
                tipoJustificativa: classificacao.tipoJustificativa,
                decisao: classificacao.decisao,
                decisaoConfianca: classificacao.decisaoConfianca,
                decisaoJustificativa: classificacao.decisaoJustificativa,
                microtema: classificacao.microtema,
                microtemaConfianca: classificacao.microtemaConfianca,
                microtemaJustificativa: classificacao.microtemaJustificativa,
                confiancaGeral: classificacao.confiancaGeral,

                // Votos
                tipoVotacao: votacao.tipoVotacao,
                totalVotantes: votacao.totalVotantes,
                votosFavoraveis: votacao.resumo.favoraveis,
                votosContrarios: votacao.resumo.contrarios,
                abstencoes: votacao.resumo.abstencoes,

                // Duplicidade
                processos: dadosVerificacao.processos,
                hashTexto: dadosVerificacao.hashTexto,

                // Texto
                texto: entrada.texto,
                resumoPleito: entrada.texto.substring(0, 500)
            };

            const deliberacaoSalva = await persistencia.salvarDeliberacao(deliberacaoParaSalvar);

            if (deliberacaoSalva) {
                resultado.deliberacaoId = deliberacaoSalva.id;

                // Salva votos
                if (votacao.votos && votacao.votos.length > 0) {
                    await persistencia.salvarVotos(deliberacaoSalva.id, votacao.votos);
                }

                logger.success('Processador', 'Deliberação salva com sucesso', {
                    id: deliberacaoSalva.id
                });
            }
        } else {
            logger.info('Processador', 'Modo dry-run: deliberação não salva');
        }

        resultado.sucesso = true;
        resultado.tempoProcessamento = Date.now() - startTime;

        logger.info('Processador', 'Processamento concluído', {
            sucesso: true,
            tempoMs: resultado.tempoProcessamento
        });

    } catch (error) {
        resultado.sucesso = false;
        resultado.erro = error.message;
        resultado.tempoProcessamento = Date.now() - startTime;

        logger.error('Processador', 'Erro no processamento', {
            erro: error.message,
            stack: error.stack?.substring(0, 200)
        });
    }

    return resultado;
}

// ============================================================================
// PROCESSADOR DE MÚLTIPLAS DELIBERAÇÕES
// ============================================================================

/**
 * Processa múltiplas deliberações em lote
 * @param {Array<Object>} deliberacoes - Lista de deliberações para processar
 * @param {Object} opcoes - Opções de processamento
 * @returns {Promise<Object>} Resumo do processamento
 */
async function processarLote(deliberacoes, opcoes = {}) {
    const startTime = Date.now();

    logger.section('PROCESSAMENTO EM LOTE - IRIS');
    logger.operationStart('Processamento de deliberações', {
        total: deliberacoes.length
    });

    const stats = {
        totalProcessadas: 0,
        salvas: 0,
        duplicatas: 0,
        erros: 0,
        porTipo: {
            pleitoExterno: 0,
            atoAdministrativo: 0,
            naoClassificado: 0
        },
        porDecisao: {
            deferido: 0,
            indeferido: 0,
            naoIdentificado: 0
        },
        resultados: []
    };

    // Atualiza status da reunião para "processando"
    if (deliberacoes.length > 0 && deliberacoes[0].metadata) {
        await persistencia.atualizarStatusReuniao(
            {
                numeroReuniao: deliberacoes[0].metadata.numeroReuniao,
                dataReuniao: deliberacoes[0].metadata.dataReuniao
            },
            'processando'
        );
    }

    // Processa cada deliberação
    for (let i = 0; i < deliberacoes.length; i++) {
        const deliberacao = deliberacoes[i];

        logger.progress(i + 1, deliberacoes.length, `Processando deliberação ${i + 1}`);

        try {
            const resultado = await processarDeliberacao(deliberacao, opcoes);
            stats.resultados.push(resultado);
            stats.totalProcessadas++;

            if (resultado.sucesso) {
                if (resultado.deliberacaoId) {
                    stats.salvas++;
                }

                // Contabiliza por tipo
                const tipo = resultado.classificacao?.tipo;
                if (tipo === 'Pleito Externo') {
                    stats.porTipo.pleitoExterno++;
                } else if (tipo === 'Ato Administrativo Interno') {
                    stats.porTipo.atoAdministrativo++;
                } else {
                    stats.porTipo.naoClassificado++;
                }

                // Contabiliza por decisão
                const decisao = resultado.classificacao?.decisao;
                if (decisao === 'Deferido') {
                    stats.porDecisao.deferido++;
                } else if (decisao === 'Indeferido') {
                    stats.porDecisao.indeferido++;
                } else {
                    stats.porDecisao.naoIdentificado++;
                }

            } else if (resultado.erro === 'Deliberação duplicada') {
                stats.duplicatas++;
            } else {
                stats.erros++;
            }

        } catch (error) {
            stats.erros++;
            logger.error('Processador', `Erro ao processar deliberação ${i + 1}`, {
                erro: error.message
            });
        }

        // Delay entre processamentos para não sobrecarregar
        if (i < deliberacoes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    stats.tempoTotal = Date.now() - startTime;

    // Atualiza status da reunião para "processado"
    if (deliberacoes.length > 0 && deliberacoes[0].metadata) {
        await persistencia.atualizarStatusReuniao(
            {
                numeroReuniao: deliberacoes[0].metadata.numeroReuniao,
                dataReuniao: deliberacoes[0].metadata.dataReuniao
            },
            stats.erros > 0 ? 'erro' : 'processado',
            {
                totalProcessadas: stats.totalProcessadas,
                erros: stats.erros
            }
        );
    }

    logger.operationEnd('Processamento de deliberações', stats.erros === 0, {
        processadas: stats.totalProcessadas,
        salvas: stats.salvas,
        erros: stats.erros
    });

    logger.resumoProcessamento(stats);

    return stats;
}

// ============================================================================
// PROCESSADOR DE TEXTO ÚNICO (ENTRADA SIMPLES)
// ============================================================================

/**
 * Processa um texto de deliberação diretamente
 * Útil para testes e processamento manual
 * @param {string} texto - Texto da deliberação
 * @param {Object} metadata - Metadados opcionais
 * @param {Object} opcoes - Opções de processamento
 * @returns {Promise<Object>} Resultado do processamento
 */
async function processarTexto(texto, metadata = {}, opcoes = {}) {
    return processarDeliberacao({
        texto,
        metadata: {
            agencia: 'ARTESP',
            ...metadata
        }
    }, opcoes);
}

/**
 * Analisa um texto sem salvar no banco (apenas classificação)
 * @param {string} texto - Texto da deliberação
 * @returns {Object} Análise completa
 */
function analisarTexto(texto) {
    logger.section('ANÁLISE DE TEXTO - IRIS');

    const classificacao = classificador.classificarDeliberacao(texto);
    const votacao = extratorVotos.extrairVotacao(texto);
    const dadosVerificacao = detectorDuplicidade.prepararParaVerificacao(texto);

    const analise = {
        // Classificação
        tipo: classificacao.tipo,
        tipoConfianca: classificacao.tipoConfianca,
        tipoJustificativa: classificacao.tipoJustificativa,

        decisao: classificacao.decisao,
        decisaoConfianca: classificacao.decisaoConfianca,
        decisaoJustificativa: classificacao.decisaoJustificativa,

        microtema: classificacao.microtema,
        microtemaConfianca: classificacao.microtemaConfianca,
        microtemaJustificativa: classificacao.microtemaJustificativa,

        confiancaGeral: classificacao.confiancaGeral,

        // Votação
        tipoVotacao: votacao.tipoVotacao,
        diretores: votacao.diretores,
        votos: votacao.votos,
        resumoVotos: votacao.resumo,

        // Identificadores
        processos: dadosVerificacao.processos,
        numeroDeliberacao: dadosVerificacao.numeroDeliberacao,
        hashTexto: dadosVerificacao.hashTexto,

        // Metadados
        tamanhoTexto: texto.length,
        analisadoEm: new Date().toISOString()
    };

    // Log do resultado
    logger.info('Análise', 'Resultado da análise', {
        tipo: analise.tipo,
        decisao: analise.decisao,
        microtema: analise.microtema,
        processos: analise.processos.length,
        diretores: analise.diretores.length
    });

    return analise;
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

module.exports = {
    // Processamento principal
    processarDeliberacao,
    processarLote,
    processarTexto,

    // Análise sem persistência
    analisarTexto,

    // Re-exporta serviços individuais para uso direto
    classificador,
    extratorVotos,
    detectorDuplicidade,
    persistencia,
    logger
};
