/**
 * Sistema de Logs Estruturado
 * Registra todas as operações do sistema com timestamps e detalhes
 */

const fs = require('fs').promises;
const path = require('path');

// Caminho do arquivo de logs
const LOGS_FILE = path.join(__dirname, '../../logs.json');

// Tipos de operação
const OPERATION_TYPES = {
    SCRAPE: 'SCRAPE',
    DOWNLOAD: 'DOWNLOAD',
    EXTRACT: 'EXTRACT',
    SEND: 'SEND',
    SYNC: 'SYNC',
    SYSTEM: 'SYSTEM'
};

// Status das operações
const STATUS = {
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR',
    SKIPPED: 'SKIPPED',
    WARNING: 'WARNING',
    INFO: 'INFO'
};

// Máximo de logs a manter
const MAX_LOGS = 1000;

/**
 * Carrega logs existentes do arquivo
 * @returns {Promise<Array>} Array de logs
 */
async function loadLogs() {
    try {
        const data = await fs.readFile(LOGS_FILE, 'utf8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed.logs) ? parsed.logs : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('[Logger] Erro ao carregar logs:', error.message);
        return [];
    }
}

/**
 * Salva logs no arquivo
 * @param {Array} logs - Array de logs
 */
async function saveLogs(logs) {
    try {
        // Mantém apenas os últimos MAX_LOGS registros
        const logsToSave = logs.slice(-MAX_LOGS);

        await fs.writeFile(LOGS_FILE, JSON.stringify({
            lastUpdate: new Date().toISOString(),
            totalLogs: logsToSave.length,
            logs: logsToSave
        }, null, 2), 'utf8');
    } catch (error) {
        console.error('[Logger] Erro ao salvar logs:', error.message);
    }
}

/**
 * Registra uma operação no log
 * @param {string} operacao - Tipo de operação
 * @param {string} status - Status da operação
 * @param {Object} detalhes - Detalhes adicionais
 * @param {Error} error - Erro (opcional)
 */
async function log(operacao, status, detalhes = {}, error = null) {
    const timestamp = new Date().toISOString();

    const logEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        operacao,
        status,
        detalhes: {
            ...detalhes,
            ...(error && {
                erro: error.message,
                stack: error.stack
            })
        }
    };

    // Log no console
    const emoji = status === STATUS.SUCCESS ? '✅' :
                  status === STATUS.ERROR ? '❌' :
                  status === STATUS.WARNING ? '⚠️' :
                  status === STATUS.SKIPPED ? '⏭️' : 'ℹ️';

    console.log(`${emoji} [${operacao}] ${status}`, detalhes.mensagem || '');

    try {
        const logs = await loadLogs();
        logs.push(logEntry);
        await saveLogs(logs);
    } catch (err) {
        console.error('[Logger] Falha ao persistir log:', err.message);
    }

    return logEntry;
}

/**
 * Registra início de uma operação
 * @param {string} operacao - Tipo de operação
 * @param {Object} detalhes - Detalhes
 */
async function logStart(operacao, detalhes = {}) {
    return log(operacao, STATUS.INFO, {
        ...detalhes,
        evento: 'START',
        mensagem: `Iniciando ${operacao.toLowerCase()}...`
    });
}

/**
 * Registra sucesso de uma operação
 * @param {string} operacao - Tipo de operação
 * @param {Object} detalhes - Detalhes
 */
async function logSuccess(operacao, detalhes = {}) {
    return log(operacao, STATUS.SUCCESS, {
        ...detalhes,
        evento: 'COMPLETE'
    });
}

/**
 * Registra erro de uma operação
 * @param {string} operacao - Tipo de operação
 * @param {Error} error - Erro
 * @param {Object} detalhes - Detalhes adicionais
 */
async function logError(operacao, error, detalhes = {}) {
    return log(operacao, STATUS.ERROR, {
        ...detalhes,
        evento: 'ERROR',
        mensagem: error.message
    }, error);
}

/**
 * Registra warning
 * @param {string} operacao - Tipo de operação
 * @param {string} mensagem - Mensagem de warning
 * @param {Object} detalhes - Detalhes adicionais
 */
async function logWarning(operacao, mensagem, detalhes = {}) {
    return log(operacao, STATUS.WARNING, {
        ...detalhes,
        evento: 'WARNING',
        mensagem
    });
}

/**
 * Obtém logs filtrados
 * @param {Object} filtros - Filtros a aplicar
 * @returns {Promise<Array>} Logs filtrados
 */
async function getLogs(filtros = {}) {
    const logs = await loadLogs();

    let resultado = [...logs];

    // Filtro por operação
    if (filtros.operacao) {
        resultado = resultado.filter(l => l.operacao === filtros.operacao);
    }

    // Filtro por status
    if (filtros.status) {
        resultado = resultado.filter(l => l.status === filtros.status);
    }

    // Filtro por data (últimas N horas)
    if (filtros.ultimasHoras) {
        const limite = new Date(Date.now() - filtros.ultimasHoras * 60 * 60 * 1000);
        resultado = resultado.filter(l => new Date(l.timestamp) >= limite);
    }

    // Limite de resultados
    if (filtros.limite) {
        resultado = resultado.slice(-filtros.limite);
    }

    // Ordenação (mais recentes primeiro por padrão)
    resultado.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return resultado;
}

/**
 * Limpa todos os logs
 */
async function clearLogs() {
    await saveLogs([]);
    console.log('[Logger] Logs limpos');
}

/**
 * Obtém estatísticas dos logs
 * @returns {Promise<Object>} Estatísticas
 */
async function getStats() {
    const logs = await loadLogs();

    const stats = {
        total: logs.length,
        porOperacao: {},
        porStatus: {},
        ultimasHoras: {
            1: 0,
            24: 0,
            168: 0 // 7 dias
        }
    };

    const agora = Date.now();

    logs.forEach(log => {
        // Por operação
        stats.porOperacao[log.operacao] = (stats.porOperacao[log.operacao] || 0) + 1;

        // Por status
        stats.porStatus[log.status] = (stats.porStatus[log.status] || 0) + 1;

        // Por período
        const idade = agora - new Date(log.timestamp).getTime();
        if (idade <= 1 * 60 * 60 * 1000) stats.ultimasHoras[1]++;
        if (idade <= 24 * 60 * 60 * 1000) stats.ultimasHoras[24]++;
        if (idade <= 168 * 60 * 60 * 1000) stats.ultimasHoras[168]++;
    });

    return stats;
}

module.exports = {
    OPERATION_TYPES,
    STATUS,
    log,
    logStart,
    logSuccess,
    logError,
    logWarning,
    getLogs,
    clearLogs,
    getStats
};
