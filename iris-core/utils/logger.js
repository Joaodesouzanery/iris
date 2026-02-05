/**
 * Sistema de Logging - IRIS Core
 *
 * Logs estruturados e claros para processamento de deliberações
 */

// Cores para terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

// Níveis de log
const LOG_LEVELS = {
    DEBUG: { value: 0, color: colors.gray, label: 'DEBUG' },
    INFO: { value: 1, color: colors.blue, label: 'INFO ' },
    WARN: { value: 2, color: colors.yellow, label: 'WARN ' },
    ERROR: { value: 3, color: colors.red, label: 'ERROR' },
    SUCCESS: { value: 4, color: colors.green, label: 'OK   ' }
};

// Nível mínimo de log (pode ser configurado via env)
const MIN_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

// Buffer para logs estruturados (opcional)
const logBuffer = [];
const MAX_BUFFER_SIZE = 1000;

/**
 * Formata timestamp para log
 */
function formatTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Formata dados extras para exibição
 */
function formatExtras(extras) {
    if (!extras || Object.keys(extras).length === 0) {
        return '';
    }

    const parts = [];
    for (const [key, value] of Object.entries(extras)) {
        if (value !== undefined && value !== null) {
            const displayValue = typeof value === 'object'
                ? JSON.stringify(value)
                : String(value);
            parts.push(`${key}=${displayValue}`);
        }
    }

    return parts.length > 0 ? ` | ${parts.join(' | ')}` : '';
}

/**
 * Função principal de logging
 */
function log(level, modulo, mensagem, extras = {}) {
    const levelConfig = LOG_LEVELS[level] || LOG_LEVELS.INFO;

    // Verifica nível mínimo
    if (levelConfig.value < MIN_LEVEL.value) {
        return;
    }

    const timestamp = formatTimestamp();
    const extrasStr = formatExtras(extras);

    // Formata mensagem
    const logLine = `${colors.gray}[${timestamp}]${colors.reset} ` +
        `${levelConfig.color}${levelConfig.label}${colors.reset} ` +
        `${colors.cyan}[${modulo}]${colors.reset} ` +
        `${mensagem}${colors.gray}${extrasStr}${colors.reset}`;

    console.log(logLine);

    // Adiciona ao buffer
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        modulo,
        mensagem,
        extras
    };

    logBuffer.push(logEntry);

    // Limita tamanho do buffer
    if (logBuffer.length > MAX_BUFFER_SIZE) {
        logBuffer.shift();
    }
}

/**
 * Log de debug
 */
function debug(modulo, mensagem, extras = {}) {
    log('DEBUG', modulo, mensagem, extras);
}

/**
 * Log informativo
 */
function info(modulo, mensagem, extras = {}) {
    log('INFO', modulo, mensagem, extras);
}

/**
 * Log de aviso
 */
function warn(modulo, mensagem, extras = {}) {
    log('WARN', modulo, mensagem, extras);
}

/**
 * Log de erro
 */
function error(modulo, mensagem, extras = {}) {
    log('ERROR', modulo, mensagem, extras);
}

/**
 * Log de sucesso
 */
function success(modulo, mensagem, extras = {}) {
    log('SUCCESS', modulo, mensagem, extras);
}

/**
 * Log de início de operação
 */
function operationStart(operacao, detalhes = {}) {
    console.log('');
    console.log(`${colors.bright}${colors.cyan}${'─'.repeat(60)}${colors.reset}`);
    info('Operação', `Iniciando: ${operacao}`, detalhes);
}

/**
 * Log de fim de operação
 */
function operationEnd(operacao, sucesso = true, detalhes = {}) {
    if (sucesso) {
        success('Operação', `Concluída: ${operacao}`, detalhes);
    } else {
        error('Operação', `Falhou: ${operacao}`, detalhes);
    }
    console.log(`${colors.bright}${colors.cyan}${'─'.repeat(60)}${colors.reset}`);
    console.log('');
}

/**
 * Log de progresso
 */
function progress(atual, total, descricao = '') {
    const percent = Math.round((atual / total) * 100);
    const barLength = 30;
    const filled = Math.round((barLength * atual) / total);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

    process.stdout.write(
        `\r${colors.cyan}[${bar}]${colors.reset} ${percent}% (${atual}/${total}) ${descricao}`
    );

    if (atual === total) {
        console.log(''); // Nova linha ao completar
    }
}

/**
 * Log de seção (título)
 */
function section(titulo) {
    console.log('');
    console.log(`${colors.bright}${colors.magenta}┌${'─'.repeat(58)}┐${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}│${colors.reset} ${titulo.padEnd(56)} ${colors.bright}${colors.magenta}│${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}└${'─'.repeat(58)}┘${colors.reset}`);
}

/**
 * Log de tabela simples
 */
function table(dados, colunas) {
    if (!dados || dados.length === 0) {
        info('Tabela', 'Sem dados para exibir');
        return;
    }

    // Cabeçalho
    const header = colunas.map(c => c.padEnd(15)).join(' | ');
    console.log(`${colors.bright}${header}${colors.reset}`);
    console.log('-'.repeat(header.length));

    // Dados
    for (const row of dados) {
        const line = colunas.map(c => {
            const value = row[c];
            return String(value ?? '-').substring(0, 15).padEnd(15);
        }).join(' | ');
        console.log(line);
    }
}

/**
 * Log de resumo de processamento
 */
function resumoProcessamento(stats) {
    console.log('');
    console.log(`${colors.bright}${colors.green}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.green}  RESUMO DO PROCESSAMENTO${colors.reset}`);
    console.log(`${colors.bright}${colors.green}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log('');

    console.log(`  ${colors.cyan}Deliberações processadas:${colors.reset} ${stats.totalProcessadas || 0}`);
    console.log(`  ${colors.green}Salvas com sucesso:${colors.reset}      ${stats.salvas || 0}`);
    console.log(`  ${colors.yellow}Duplicatas ignoradas:${colors.reset}    ${stats.duplicatas || 0}`);
    console.log(`  ${colors.red}Erros:${colors.reset}                   ${stats.erros || 0}`);
    console.log('');

    if (stats.porTipo) {
        console.log(`  ${colors.bright}Por Tipo:${colors.reset}`);
        console.log(`    Pleito Externo:           ${stats.porTipo.pleitoExterno || 0}`);
        console.log(`    Ato Administrativo:       ${stats.porTipo.atoAdministrativo || 0}`);
    }

    if (stats.porDecisao) {
        console.log('');
        console.log(`  ${colors.bright}Por Decisão:${colors.reset}`);
        console.log(`    ${colors.green}Deferido:${colors.reset}                 ${stats.porDecisao.deferido || 0}`);
        console.log(`    ${colors.red}Indeferido:${colors.reset}               ${stats.porDecisao.indeferido || 0}`);
        console.log(`    ${colors.yellow}Não Identificado:${colors.reset}         ${stats.porDecisao.naoIdentificado || 0}`);
    }

    console.log('');
    console.log(`  ${colors.gray}Tempo total: ${stats.tempoTotal || '0'}ms${colors.reset}`);
    console.log('');
    console.log(`${colors.bright}${colors.green}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log('');
}

/**
 * Obtém logs do buffer
 */
function getLogs(filtros = {}) {
    let logs = [...logBuffer];

    if (filtros.level) {
        logs = logs.filter(l => l.level === filtros.level);
    }

    if (filtros.modulo) {
        logs = logs.filter(l => l.modulo === filtros.modulo);
    }

    if (filtros.desde) {
        const desde = new Date(filtros.desde);
        logs = logs.filter(l => new Date(l.timestamp) >= desde);
    }

    return logs;
}

/**
 * Limpa buffer de logs
 */
function clearLogs() {
    logBuffer.length = 0;
}

module.exports = {
    debug,
    info,
    warn,
    error,
    success,
    operationStart,
    operationEnd,
    progress,
    section,
    table,
    resumoProcessamento,
    getLogs,
    clearLogs,
    LOG_LEVELS
};
