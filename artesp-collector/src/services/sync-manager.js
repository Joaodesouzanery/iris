/**
 * Gerenciador de Sincronização Inteligente
 * Controla histórico de PDFs já coletados para sincronização incremental
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger');

// Caminho do arquivo de histórico
const SYNC_HISTORY_FILE = path.join(__dirname, '../../sync-history.json');

/**
 * Gera hash único para identificar um PDF
 * @param {string} url - URL do PDF
 * @param {string} nome - Nome do arquivo
 * @returns {string} Hash MD5
 */
function generateHash(url, nome) {
    return crypto.createHash('md5').update(`${url}|${nome}`).digest('hex');
}

/**
 * Carrega histórico de sincronização
 * @returns {Promise<Object>} Histórico de sincronização
 */
async function loadHistory() {
    try {
        const data = await fs.readFile(SYNC_HISTORY_FILE, 'utf8');
        const history = JSON.parse(data);

        // Valida estrutura
        if (!history.pdfs || !Array.isArray(history.pdfs)) {
            throw new Error('Estrutura de histórico inválida');
        }

        console.log(`[SyncManager] Histórico carregado: ${history.pdfs.length} PDFs registrados`);
        return history;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('[SyncManager] Arquivo de histórico não encontrado - primeira execução');
            return null;
        }
        console.error('[SyncManager] Erro ao carregar histórico:', error.message);
        return null;
    }
}

/**
 * Salva histórico de sincronização
 * @param {Object} history - Histórico para salvar
 */
async function saveHistory(history) {
    try {
        await fs.writeFile(SYNC_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
        console.log(`[SyncManager] Histórico salvo: ${history.pdfs.length} PDFs`);

        await logger.logSuccess(logger.OPERATION_TYPES.SYNC, {
            mensagem: `Histórico atualizado com ${history.pdfs.length} PDFs`,
            totalPdfs: history.pdfs.length
        });
    } catch (error) {
        console.error('[SyncManager] Erro ao salvar histórico:', error.message);
        await logger.logError(logger.OPERATION_TYPES.SYNC, error, {
            mensagem: 'Falha ao salvar histórico'
        });
        throw error;
    }
}

/**
 * Verifica se é a primeira execução (sem histórico)
 * @returns {Promise<boolean>} true se é primeira execução
 */
async function isFirstRun() {
    const history = await loadHistory();
    return history === null;
}

/**
 * Obtém status da sincronização
 * @returns {Promise<Object>} Status atual
 */
async function getSyncStatus() {
    const history = await loadHistory();

    if (!history) {
        return {
            primeiraExecucao: true,
            ultimaSync: null,
            totalPdfsHistorico: 0,
            modo: 'COMPLETO'
        };
    }

    return {
        primeiraExecucao: false,
        ultimaSync: history.lastSync,
        totalPdfsHistorico: history.pdfs.length,
        modo: 'INCREMENTAL',
        estatisticas: history.estatisticas || {}
    };
}

/**
 * Compara lista de PDFs do site com histórico
 * @param {Array} pdfsDoSite - Lista de PDFs encontrados no site
 * @returns {Promise<Object>} Resultado da comparação
 */
async function compareWithHistory(pdfsDoSite) {
    const history = await loadHistory();

    // Primeira execução - todos são novos
    if (!history) {
        console.log('[SyncManager] Primeira execução - todos os PDFs são novos');

        return {
            modo: 'COMPLETO',
            novos: pdfsDoSite.map(pdf => ({
                ...pdf,
                ehNovo: true,
                hash: generateHash(pdf.url, pdf.nomeArquivo)
            })),
            jaColetados: [],
            totalNovos: pdfsDoSite.length,
            totalJaColetados: 0,
            totalNoSite: pdfsDoSite.length
        };
    }

    // Cria mapa de URLs já coletadas
    const urlsColetadas = new Set(history.pdfs.map(p => p.url));
    const hashesColetados = new Set(history.pdfs.map(p => p.hash));

    // Separa novos dos já coletados
    const novos = [];
    const jaColetados = [];

    for (const pdf of pdfsDoSite) {
        const hash = generateHash(pdf.url, pdf.nomeArquivo);

        if (urlsColetadas.has(pdf.url) || hashesColetados.has(hash)) {
            jaColetados.push({
                ...pdf,
                ehNovo: false,
                hash,
                dataColetaOriginal: history.pdfs.find(p => p.url === pdf.url || p.hash === hash)?.dataColeta
            });
        } else {
            novos.push({
                ...pdf,
                ehNovo: true,
                hash
            });
        }
    }

    console.log(`[SyncManager] Comparação: ${novos.length} novos, ${jaColetados.length} já coletados`);

    await logger.log(logger.OPERATION_TYPES.SYNC, logger.STATUS.INFO, {
        mensagem: `Comparação concluída: ${novos.length} novos, ${jaColetados.length} já coletados`,
        novos: novos.length,
        jaColetados: jaColetados.length,
        totalNoSite: pdfsDoSite.length
    });

    return {
        modo: 'INCREMENTAL',
        novos,
        jaColetados,
        totalNovos: novos.length,
        totalJaColetados: jaColetados.length,
        totalNoSite: pdfsDoSite.length
    };
}

/**
 * Atualiza histórico após coleta bem-sucedida
 * @param {Array} pdfsColetados - PDFs que foram coletados com sucesso
 * @param {boolean} forceComplete - Se foi forçada coleta completa
 */
async function updateHistory(pdfsColetados, forceComplete = false) {
    const agora = new Date().toISOString();
    let history = await loadHistory();

    // Se não existe histórico ou foi forçada coleta completa, cria novo
    if (!history || forceComplete) {
        history = {
            lastSync: agora,
            createdAt: agora,
            pdfs: [],
            estatisticas: {
                totalSincronizacoes: 0,
                totalPdfsColetados: 0
            }
        };
    }

    // Adiciona novos PDFs ao histórico
    const pdfsParaAdicionar = pdfsColetados.filter(pdf =>
        pdf.statusExtracao === 'sucesso' && pdf.ehNovo
    );

    for (const pdf of pdfsParaAdicionar) {
        // Verifica se já existe
        const jaExiste = history.pdfs.some(p => p.url === pdf.url || p.hash === pdf.hash);

        if (!jaExiste) {
            history.pdfs.push({
                url: pdf.url,
                nome: pdf.nomeArquivo,
                hash: pdf.hash || generateHash(pdf.url, pdf.nomeArquivo),
                dataColeta: agora,
                ano: pdf.ano,
                reuniao: pdf.reuniao,
                numPaginas: pdf.numPaginas,
                numCaracteres: pdf.numCaracteres
            });
        }
    }

    // Atualiza estatísticas
    history.lastSync = agora;
    history.estatisticas.totalSincronizacoes = (history.estatisticas.totalSincronizacoes || 0) + 1;
    history.estatisticas.totalPdfsColetados = (history.estatisticas.totalPdfsColetados || 0) + pdfsParaAdicionar.length;
    history.estatisticas.ultimaColetaNovos = pdfsParaAdicionar.length;

    await saveHistory(history);

    return {
        novosAdicionados: pdfsParaAdicionar.length,
        totalNoHistorico: history.pdfs.length,
        ultimaSync: history.lastSync
    };
}

/**
 * Reseta o histórico de sincronização
 * @returns {Promise<Object>} Resultado do reset
 */
async function resetHistory() {
    try {
        // Faz backup antes de resetar
        const history = await loadHistory();
        const backupFile = SYNC_HISTORY_FILE.replace('.json', `.backup-${Date.now()}.json`);

        if (history) {
            await fs.writeFile(backupFile, JSON.stringify(history, null, 2), 'utf8');
            console.log(`[SyncManager] Backup criado: ${backupFile}`);
        }

        // Cria histórico vazio
        const novoHistorico = {
            lastSync: null,
            createdAt: new Date().toISOString(),
            pdfs: [],
            estatisticas: {
                totalSincronizacoes: 0,
                totalPdfsColetados: 0,
                resetadoEm: new Date().toISOString()
            }
        };

        await saveHistory(novoHistorico);

        await logger.logSuccess(logger.OPERATION_TYPES.SYNC, {
            mensagem: 'Histórico resetado com sucesso',
            backupCriado: !!history
        });

        return {
            success: true,
            message: 'Histórico resetado com sucesso',
            backupFile: history ? backupFile : null
        };
    } catch (error) {
        await logger.logError(logger.OPERATION_TYPES.SYNC, error, {
            mensagem: 'Falha ao resetar histórico'
        });
        throw error;
    }
}

/**
 * Obtém histórico completo
 * @returns {Promise<Object>} Histórico
 */
async function getFullHistory() {
    return await loadHistory() || {
        lastSync: null,
        pdfs: [],
        estatisticas: {}
    };
}

/**
 * Obtém resumo do histórico
 * @returns {Promise<Object>} Resumo
 */
async function getHistorySummary() {
    const history = await loadHistory();

    if (!history) {
        return {
            existe: false,
            totalPdfs: 0,
            ultimaSync: null,
            estatisticas: {}
        };
    }

    // Agrupa por ano
    const porAno = {};
    history.pdfs.forEach(pdf => {
        const ano = pdf.ano || 'Indefinido';
        porAno[ano] = (porAno[ano] || 0) + 1;
    });

    return {
        existe: true,
        totalPdfs: history.pdfs.length,
        ultimaSync: history.lastSync,
        criadoEm: history.createdAt,
        estatisticas: history.estatisticas,
        porAno
    };
}

module.exports = {
    generateHash,
    loadHistory,
    saveHistory,
    isFirstRun,
    getSyncStatus,
    compareWithHistory,
    updateHistory,
    resetHistory,
    getFullHistory,
    getHistorySummary
};
