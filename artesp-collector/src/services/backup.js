/**
 * IRIS Platform - Backup Service
 *
 * Gera backups automaticos dos dados da plataforma em formato JSON.
 * Os backups podem ser:
 * 1. Salvos localmente em disco (pasta /backups)
 * 2. Enviados para Google Drive via API (configuravel)
 * 3. Exportados via endpoint da API para download manual
 *
 * Funcionalidades:
 * - Backup automatico diario (configuravel via BACKUP_INTERVAL_HOURS)
 * - Retencao configuravel (padrao: 30 dias)
 * - Relatorio de cada backup gerado
 * - Restauracao a partir de arquivo JSON
 */

const fs = require('fs');
const path = require('path');

// ── Configuration ──
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', 'backups');
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
const BACKUP_INTERVAL_HOURS = parseInt(process.env.BACKUP_INTERVAL_HOURS) || 24;

// ── Backup State ──
let backupTimer = null;
const backupHistory = [];

/**
 * Cria diretorio de backup se nao existe
 */
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`[Backup] Diretorio criado: ${BACKUP_DIR}`);
    }
}

/**
 * Gera backup completo dos dados da plataforma
 * @param {Object} dataSource - Objeto com funcoes para obter dados
 * @returns {Object} Relatorio do backup
 */
function generateBackup(dataSource) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `iris-backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    ensureBackupDir();

    try {
        // Collect all data
        const backupData = {
            meta: {
                version: '1.0',
                platform: 'IRIS',
                generatedAt: new Date().toISOString(),
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || 'development'
            },
            data: {}
        };

        // PDFs em memoria
        if (dataSource.getPdfs) {
            const pdfs = dataSource.getPdfs();
            backupData.data.pdfs = pdfs.map(p => ({
                nomeArquivo: p.nomeArquivo,
                data: p.data,
                reuniao: p.reuniao,
                numPaginas: p.numPaginas,
                numCaracteres: p.numCaracteres,
                origem: p.origem,
                url: p.url,
                statusExtracao: p.statusExtracao,
                analise: p.analise || null,
                empresasDetectadas: p.empresasDetectadas || []
                // Nota: texto completo nao e incluido para reduzir tamanho
            }));
        }

        // Deliberacoes
        if (dataSource.getDeliberacoes) {
            backupData.data.deliberacoes = dataSource.getDeliberacoes();
        }

        // Empresas detectadas (agregadas)
        if (dataSource.getEmpresas) {
            backupData.data.empresas = dataSource.getEmpresas();
        }

        // Reunioes monitoradas
        if (dataSource.getReunioes) {
            backupData.data.reunioes = dataSource.getReunioes();
        }

        // Metricas snapshot
        if (dataSource.getMetricas) {
            backupData.data.metricas = dataSource.getMetricas();
        }

        // Stats
        const stats = {
            totalPdfs: backupData.data.pdfs?.length || 0,
            totalDeliberacoes: backupData.data.deliberacoes?.length || 0,
            totalEmpresas: backupData.data.empresas?.length || 0,
            totalReunioes: backupData.data.reunioes?.length || 0
        };
        backupData.meta.stats = stats;

        // Write to file
        const jsonContent = JSON.stringify(backupData, null, 2);
        fs.writeFileSync(filepath, jsonContent, 'utf8');

        const fileSizeKB = Math.round(fs.statSync(filepath).size / 1024);

        // Generate report
        const report = {
            success: true,
            filename,
            filepath,
            fileSizeKB,
            timestamp: new Date().toISOString(),
            stats,
            retentionDays: BACKUP_RETENTION_DAYS
        };

        backupHistory.push(report);
        console.log(`[Backup] Backup salvo: ${filename} (${fileSizeKB}KB) - ${stats.totalPdfs} PDFs, ${stats.totalDeliberacoes} deliberacoes`);

        return report;

    } catch (error) {
        const report = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
        backupHistory.push(report);
        console.error(`[Backup] ERRO: ${error.message}`);
        return report;
    }
}

/**
 * Lista backups existentes no disco
 */
function listBackups() {
    ensureBackupDir();

    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('iris-backup-') && f.endsWith('.json'))
            .map(f => {
                const stat = fs.statSync(path.join(BACKUP_DIR, f));
                return {
                    filename: f,
                    sizeKB: Math.round(stat.size / 1024),
                    createdAt: stat.birthtime.toISOString(),
                    age: Math.round((Date.now() - stat.birthtime.getTime()) / (24 * 60 * 60 * 1000))
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return { success: true, backups: files, total: files.length, directory: BACKUP_DIR };
    } catch (error) {
        return { success: false, error: error.message, backups: [] };
    }
}

/**
 * Restaura dados de um backup
 * @param {string} filename - Nome do arquivo de backup
 * @returns {Object} Dados restaurados
 */
function restoreBackup(filename) {
    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
        return { success: false, error: 'Arquivo de backup nao encontrado' };
    }

    try {
        const content = fs.readFileSync(filepath, 'utf8');
        const data = JSON.parse(content);

        if (!data.meta || !data.data) {
            return { success: false, error: 'Formato de backup invalido' };
        }

        return {
            success: true,
            meta: data.meta,
            data: data.data,
            stats: data.meta.stats
        };
    } catch (error) {
        return { success: false, error: `Erro ao ler backup: ${error.message}` };
    }
}

/**
 * Remove backups mais antigos que o periodo de retencao
 */
function cleanOldBackups() {
    ensureBackupDir();

    const cutoffDate = new Date(Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    let removed = 0;

    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('iris-backup-') && f.endsWith('.json'));

        for (const file of files) {
            const filepath = path.join(BACKUP_DIR, file);
            const stat = fs.statSync(filepath);

            if (stat.birthtime < cutoffDate) {
                fs.unlinkSync(filepath);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`[Backup] Limpeza: ${removed} backup(s) antigo(s) removido(s) (>${BACKUP_RETENTION_DAYS} dias)`);
        }

        return { success: true, removed };
    } catch (error) {
        console.error(`[Backup] Erro na limpeza: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Inicia backup automatico
 * @param {Object} dataSource - Funcoes de coleta de dados
 */
function startAutoBackup(dataSource) {
    if (backupTimer) {
        console.warn('[Backup] Backup automatico ja esta ativo');
        return;
    }

    const intervalMs = BACKUP_INTERVAL_HOURS * 60 * 60 * 1000;

    // Gera backup imediato
    generateBackup(dataSource);
    cleanOldBackups();

    // Agenda proximo backup
    backupTimer = setInterval(() => {
        generateBackup(dataSource);
        cleanOldBackups();
    }, intervalMs);

    console.log(`[Backup] Backup automatico ATIVO (a cada ${BACKUP_INTERVAL_HOURS}h, retencao: ${BACKUP_RETENTION_DAYS} dias)`);
}

/**
 * Para backup automatico
 */
function stopAutoBackup() {
    if (backupTimer) {
        clearInterval(backupTimer);
        backupTimer = null;
        console.log('[Backup] Backup automatico PARADO');
    }
}

/**
 * Registra rotas de backup na aplicacao Express
 */
function registerBackupRoutes(app, authenticate, dataSource) {
    // Gerar backup manual
    app.post('/api/backup/gerar', authenticate, (req, res) => {
        const report = generateBackup(dataSource);
        res.json(report);
    });

    // Listar backups existentes
    app.get('/api/backup/listar', authenticate, (req, res) => {
        res.json(listBackups());
    });

    // Download de backup especifico
    app.get('/api/backup/download/:filename', authenticate, (req, res) => {
        const filename = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
        if (!filename.startsWith('iris-backup-') || !filename.endsWith('.json')) {
            return res.status(400).json({ error: 'Nome de arquivo invalido' });
        }

        const filepath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Backup nao encontrado' });
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.sendFile(filepath);
    });

    // Restaurar backup
    app.post('/api/backup/restaurar/:filename', authenticate, (req, res) => {
        const filename = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
        const result = restoreBackup(filename);
        res.json(result);
    });

    // Limpar backups antigos
    app.post('/api/backup/limpar', authenticate, (req, res) => {
        const result = cleanOldBackups();
        res.json(result);
    });

    // Status do backup automatico
    app.get('/api/backup/status', authenticate, (req, res) => {
        res.json({
            autoBackupAtivo: backupTimer !== null,
            intervaloHoras: BACKUP_INTERVAL_HOURS,
            retencaoDias: BACKUP_RETENTION_DAYS,
            diretorio: BACKUP_DIR,
            historico: backupHistory.slice(-10).reverse()
        });
    });

    // Iniciar backup automatico
    app.post('/api/backup/auto/iniciar', authenticate, (req, res) => {
        startAutoBackup(dataSource);
        res.json({ success: true, message: `Backup automatico iniciado (a cada ${BACKUP_INTERVAL_HOURS}h)` });
    });

    // Parar backup automatico
    app.post('/api/backup/auto/parar', authenticate, (req, res) => {
        stopAutoBackup();
        res.json({ success: true, message: 'Backup automatico parado' });
    });
}

module.exports = {
    generateBackup,
    listBackups,
    restoreBackup,
    cleanOldBackups,
    startAutoBackup,
    stopAutoBackup,
    registerBackupRoutes
};
