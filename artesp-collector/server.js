/**
 * ARTESP PDF Collector - Servidor Principal
 *
 * Sistema de coleta automática de PDFs de deliberações da ARTESP
 * com extração de texto, sincronização inteligente e envio para Lovable
 *
 * Funcionalidades:
 * - Sincronização incremental (coleta apenas PDFs novos)
 * - Logging estruturado
 * - API REST completa
 * - Interface web profissional
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Importa serviços
const { scrapeWithRetry } = require('./src/services/scraper');
const { downloadMultiplePDFs, formatBytes } = require('./src/services/downloader');
const { extractFromMultiple, gerarEstatisticas } = require('./src/services/extractor');
const { sendMultipleToLovable, isValidEndpoint, testConnection } = require('./src/services/sender');
const syncManager = require('./src/services/sync-manager');
const logger = require('./src/services/logger');
const newsFetcher = require('../iris-core/services/news-fetcher');

// Configurações
const PORT = process.env.PORT || 3000;

// Inicializa Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Armazena PDFs processados em memória (para a sessão atual)
let pdfsProcessados = [];
let ultimaAtualizacao = null;
let ultimaSincronizacao = null;

/**
 * GET /api/health
 * Health check do servidor
 */
app.get('/api/health', async (req, res) => {
    const syncStatus = await syncManager.getSyncStatus();

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pdfsEmMemoria: pdfsProcessados.length,
        ultimaAtualizacao: ultimaAtualizacao,
        sincronizacao: syncStatus
    });
});

/**
 * GET /api/sync-status
 * Retorna status da última sincronização
 */
app.get('/api/sync-status', async (req, res) => {
    try {
        const status = await syncManager.getSyncStatus();
        const summary = await syncManager.getHistorySummary();

        res.json({
            success: true,
            status: status,
            resumo: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/sync-history
 * Retorna histórico completo de sincronizações
 */
app.get('/api/sync-history', async (req, res) => {
    try {
        const history = await syncManager.getFullHistory();

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/sync-reset
 * Reseta histórico de sincronização
 */
app.post('/api/sync-reset', async (req, res) => {
    try {
        const resultado = await syncManager.resetHistory();

        // Limpa PDFs em memória também
        pdfsProcessados = [];
        ultimaAtualizacao = null;

        res.json({
            success: true,
            message: resultado.message,
            backupFile: resultado.backupFile
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/logs
 * Retorna logs do sistema
 */
app.get('/api/logs', async (req, res) => {
    try {
        const { operacao, status, limite, ultimasHoras } = req.query;

        const logs = await logger.getLogs({
            operacao,
            status,
            limite: limite ? parseInt(limite) : 100,
            ultimasHoras: ultimasHoras ? parseInt(ultimasHoras) : null
        });

        const stats = await logger.getStats();

        res.json({
            success: true,
            logs: logs,
            estatisticas: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/logs
 * Limpa logs do sistema
 */
app.delete('/api/logs', async (req, res) => {
    try {
        await logger.clearLogs();

        res.json({
            success: true,
            message: 'Logs limpos com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/pdfs
 * Retorna PDFs já processados na sessão atual
 */
app.get('/api/pdfs', (req, res) => {
    const { filtro } = req.query; // 'novos', 'jaColetados', ou undefined para todos

    let pdfsParaRetornar = pdfsProcessados;

    if (filtro === 'novos') {
        pdfsParaRetornar = pdfsProcessados.filter(p => p.ehNovo === true);
    } else if (filtro === 'jaColetados') {
        pdfsParaRetornar = pdfsProcessados.filter(p => p.ehNovo === false);
    }

    res.json({
        success: true,
        data: pdfsParaRetornar.map(pdf => ({
            // Retorna sem o texto completo para economizar bandwidth
            url: pdf.url,
            nomeArquivo: pdf.nomeArquivo,
            data: pdf.data,
            ano: pdf.ano,
            reuniao: pdf.reuniao,
            tamanhoFormatado: pdf.tamanhoFormatado,
            numPaginas: pdf.numPaginas,
            numCaracteres: pdf.numCaracteres,
            numPalavras: pdf.numPalavras,
            status: pdf.status,
            statusExtracao: pdf.statusExtracao,
            ehNovo: pdf.ehNovo,
            hash: pdf.hash
        })),
        estatisticas: gerarEstatisticas(pdfsProcessados),
        ultimaAtualizacao: ultimaAtualizacao,
        filtroAplicado: filtro || 'todos'
    });
});

/**
 * GET /api/pdfs/:index
 * Retorna detalhes de um PDF específico (incluindo texto)
 */
app.get('/api/pdfs/:index', (req, res) => {
    const index = parseInt(req.params.index);

    if (isNaN(index) || index < 0 || index >= pdfsProcessados.length) {
        return res.status(404).json({
            success: false,
            error: 'PDF não encontrado'
        });
    }

    const pdf = pdfsProcessados[index];

    res.json({
        success: true,
        data: pdf
    });
});

/**
 * POST /api/scrape-and-extract
 * Executa scraping completo: coleta links, baixa PDFs e extrai texto
 * Query params:
 * - force=true: Força coleta completa (ignora histórico)
 */
app.post('/api/scrape-and-extract', async (req, res) => {
    const forceComplete = req.query.force === 'true';

    console.log('='.repeat(60));
    console.log(`[Server] Iniciando processo de scraping e extração...`);
    console.log(`[Server] Modo: ${forceComplete ? 'COMPLETO (forçado)' : 'INCREMENTAL'}`);
    console.log('='.repeat(60));

    await logger.logStart(logger.OPERATION_TYPES.SYSTEM, {
        modo: forceComplete ? 'COMPLETO' : 'INCREMENTAL'
    });

    try {
        // Etapa 1: Scraping - encontra links dos PDFs
        console.log('\n[Server] ETAPA 1: Scraping da página da ARTESP...');
        const linksEncontrados = await scrapeWithRetry(3);

        if (linksEncontrados.length === 0) {
            console.log('[Server] Nenhum PDF encontrado para 2025-2026');
            return res.json({
                success: true,
                message: 'Nenhum PDF encontrado para os anos 2025-2026',
                modo: forceComplete ? 'COMPLETO' : 'INCREMENTAL',
                data: [],
                estatisticas: {
                    totalPDFs: 0,
                    pdfsSucesso: 0,
                    pdfsErro: 0,
                    pdfsNovos: 0,
                    pdfsJaColetados: 0
                }
            });
        }

        console.log(`[Server] ${linksEncontrados.length} links encontrados`);

        // Etapa 2: Comparar com histórico (se não for forçado)
        console.log('\n[Server] ETAPA 2: Verificando histórico de sincronização...');
        let comparacao;

        if (forceComplete) {
            // Força coleta de todos
            comparacao = {
                modo: 'COMPLETO',
                novos: linksEncontrados.map(pdf => ({ ...pdf, ehNovo: true })),
                jaColetados: [],
                totalNovos: linksEncontrados.length,
                totalJaColetados: 0,
                totalNoSite: linksEncontrados.length
            };
            console.log(`[Server] Modo COMPLETO: ${comparacao.totalNovos} PDFs serão coletados`);
        } else {
            comparacao = await syncManager.compareWithHistory(linksEncontrados);
            console.log(`[Server] Modo ${comparacao.modo}:`);
            console.log(`[Server] - Novos: ${comparacao.totalNovos}`);
            console.log(`[Server] - Já coletados: ${comparacao.totalJaColetados}`);
        }

        // Se não há novos PDFs, retorna apenas info dos já coletados
        if (comparacao.novos.length === 0) {
            console.log('[Server] Nenhum PDF novo para coletar');

            pdfsProcessados = comparacao.jaColetados.map(pdf => ({
                ...pdf,
                statusExtracao: 'pulado',
                texto: null
            }));
            ultimaAtualizacao = new Date().toISOString();

            return res.json({
                success: true,
                message: 'Nenhum PDF novo encontrado. Todos já foram coletados anteriormente.',
                modo: comparacao.modo,
                data: pdfsProcessados.map(pdf => ({
                    url: pdf.url,
                    nomeArquivo: pdf.nomeArquivo,
                    data: pdf.data,
                    ano: pdf.ano,
                    reuniao: pdf.reuniao,
                    ehNovo: pdf.ehNovo,
                    status: 'ja_coletado'
                })),
                estatisticas: {
                    totalPDFs: comparacao.totalNoSite,
                    pdfsSucesso: 0,
                    pdfsErro: 0,
                    pdfsNovos: 0,
                    pdfsJaColetados: comparacao.totalJaColetados
                },
                ultimaAtualizacao: ultimaAtualizacao
            });
        }

        // Etapa 3: Download - baixa apenas PDFs novos
        console.log('\n[Server] ETAPA 3: Download dos PDFs novos...');
        const pdfsComBuffer = await downloadMultiplePDFs(comparacao.novos);

        // Etapa 4: Extração - extrai texto dos PDFs
        console.log('\n[Server] ETAPA 4: Extração de texto...');
        const pdfsComTexto = await extractFromMultiple(pdfsComBuffer);

        // Combina novos processados com já coletados (sem texto)
        const jaColetadosInfo = comparacao.jaColetados.map(pdf => ({
            ...pdf,
            texto: null,
            numPaginas: 0,
            numCaracteres: 0,
            numPalavras: 0,
            statusExtracao: 'ja_coletado',
            erroExtracao: null
        }));

        pdfsProcessados = [...pdfsComTexto, ...jaColetadosInfo];
        ultimaAtualizacao = new Date().toISOString();

        // Etapa 5: Atualizar histórico
        console.log('\n[Server] ETAPA 5: Atualizando histórico de sincronização...');
        const updateResult = await syncManager.updateHistory(pdfsComTexto, forceComplete);

        // Gera estatísticas
        const estatisticas = gerarEstatisticas(pdfsProcessados);

        console.log('\n' + '='.repeat(60));
        console.log('[Server] Processo concluído com sucesso!');
        console.log(`[Server] Modo: ${comparacao.modo}`);
        console.log(`[Server] PDFs novos processados: ${estatisticas.pdfsNovos}`);
        console.log(`[Server] PDFs já coletados: ${estatisticas.pdfsJaColetados}`);
        console.log(`[Server] Total de páginas: ${estatisticas.totalPaginas}`);
        console.log(`[Server] Total de caracteres: ${estatisticas.totalCaracteres}`);
        console.log('='.repeat(60));

        await logger.logSuccess(logger.OPERATION_TYPES.SYSTEM, {
            modo: comparacao.modo,
            pdfsNovos: estatisticas.pdfsNovos,
            pdfsJaColetados: estatisticas.pdfsJaColetados,
            totalPaginas: estatisticas.totalPaginas,
            totalCaracteres: estatisticas.totalCaracteres
        });

        res.json({
            success: true,
            message: `${estatisticas.pdfsSucesso} PDF(s) processado(s) com sucesso`,
            modo: comparacao.modo,
            data: pdfsProcessados.map(pdf => ({
                url: pdf.url,
                nomeArquivo: pdf.nomeArquivo,
                data: pdf.data,
                ano: pdf.ano,
                reuniao: pdf.reuniao,
                tamanhoFormatado: pdf.tamanhoFormatado,
                numPaginas: pdf.numPaginas,
                numCaracteres: pdf.numCaracteres,
                numPalavras: pdf.numPalavras,
                status: pdf.status,
                statusExtracao: pdf.statusExtracao,
                erro: pdf.erro,
                erroExtracao: pdf.erroExtracao,
                ehNovo: pdf.ehNovo,
                hash: pdf.hash
            })),
            estatisticas: estatisticas,
            sincronizacao: {
                novosAdicionados: updateResult.novosAdicionados,
                totalNoHistorico: updateResult.totalNoHistorico,
                ultimaSync: updateResult.ultimaSync
            },
            ultimaAtualizacao: ultimaAtualizacao
        });

    } catch (error) {
        console.error('[Server] Erro no processo de scraping:', error);

        await logger.logError(logger.OPERATION_TYPES.SYSTEM, error, {
            mensagem: 'Falha no processo de scraping e extração'
        });

        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Falha no processo de scraping e extração'
        });
    }
});

/**
 * POST /api/send-to-lovable
 * Envia PDFs processados para o endpoint da Lovable
 */
app.post('/api/send-to-lovable', async (req, res) => {
    console.log('='.repeat(60));
    console.log('[Server] Iniciando envio para Lovable...');
    console.log('='.repeat(60));

    const { endpoint, indices, apenasNovos } = req.body;

    // Valida endpoint
    if (!endpoint) {
        return res.status(400).json({
            success: false,
            error: 'Endpoint não fornecido',
            message: 'Configure o endpoint da Lovable antes de enviar'
        });
    }

    if (!isValidEndpoint(endpoint)) {
        return res.status(400).json({
            success: false,
            error: 'Endpoint inválido',
            message: 'O endpoint deve ser uma URL HTTP/HTTPS válida'
        });
    }

    // Verifica se há PDFs para enviar
    if (pdfsProcessados.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Nenhum PDF disponível',
            message: 'Execute o scraping primeiro para coletar PDFs'
        });
    }

    try {
        // Filtra PDFs para enviar
        let pdfsParaEnviar = pdfsProcessados;

        // Filtra apenas novos se solicitado
        if (apenasNovos) {
            pdfsParaEnviar = pdfsParaEnviar.filter(p => p.ehNovo === true);
        }

        // Se indices foi fornecido, filtra apenas os PDFs selecionados
        if (indices && Array.isArray(indices) && indices.length > 0) {
            pdfsParaEnviar = indices
                .filter(i => i >= 0 && i < pdfsProcessados.length)
                .map(i => pdfsProcessados[i]);
        }

        console.log(`[Server] Enviando ${pdfsParaEnviar.length} PDF(s) para ${endpoint}`);

        const resultado = await sendMultipleToLovable(pdfsParaEnviar, endpoint);

        console.log('\n' + '='.repeat(60));
        console.log('[Server] Envio para Lovable concluído!');
        console.log(`[Server] Sucessos: ${resultado.sucessos}`);
        console.log(`[Server] Erros: ${resultado.erros}`);
        console.log(`[Server] Pulados: ${resultado.pulados}`);
        console.log('='.repeat(60));

        res.json({
            success: resultado.sucessos > 0,
            message: `${resultado.sucessos} PDF(s) enviado(s) com sucesso`,
            resultado: resultado
        });

    } catch (error) {
        console.error('[Server] Erro ao enviar para Lovable:', error);

        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Falha no envio para Lovable'
        });
    }
});

/**
 * POST /api/test-connection
 * Testa conexão com o endpoint da Lovable
 */
app.post('/api/test-connection', async (req, res) => {
    const { endpoint } = req.body;

    if (!endpoint) {
        return res.status(400).json({
            success: false,
            error: 'Endpoint não fornecido'
        });
    }

    const resultado = await testConnection(endpoint);

    res.json({
        success: resultado.success,
        message: resultado.message,
        statusCode: resultado.statusCode
    });
});

/**
 * GET /api/estatisticas
 * Retorna estatísticas dos PDFs processados
 */
app.get('/api/estatisticas', async (req, res) => {
    const syncStatus = await syncManager.getSyncStatus();
    const logStats = await logger.getStats();

    res.json({
        success: true,
        estatisticas: gerarEstatisticas(pdfsProcessados),
        sincronizacao: syncStatus,
        logs: logStats,
        ultimaAtualizacao: ultimaAtualizacao
    });
});

/**
 * DELETE /api/pdfs
 * Limpa PDFs da memória
 */
app.delete('/api/pdfs', (req, res) => {
    const quantidade = pdfsProcessados.length;
    pdfsProcessados = [];
    ultimaAtualizacao = null;

    console.log(`[Server] ${quantidade} PDF(s) removido(s) da memória`);

    res.json({
        success: true,
        message: `${quantidade} PDF(s) removido(s) da memória`
    });
});

/**
 * GET /api/noticias
 * Busca notícias reais de agências reguladoras (fontes públicas)
 */
app.get('/api/noticias', async (req, res) => {
    try {
        const { agencia, setor, esfera, limite = 50, forceRefresh } = req.query;

        let noticias;

        if (agencia) {
            // Busca de uma agência específica
            noticias = await newsFetcher.fetchAgenciaNoticias(agencia.toUpperCase());
        } else if (setor) {
            // Busca por setor (energia, saude, transporte, etc.)
            noticias = await newsFetcher.fetchNoticiasPorSetor(setor, parseInt(limite));
        } else if (esfera) {
            // Busca por esfera (federal, estadual)
            noticias = await newsFetcher.fetchNoticiasPorEsfera(esfera, parseInt(limite));
        } else {
            // Busca todas com cache
            noticias = await newsFetcher.fetchNoticiasComCache(forceRefresh === 'true');
        }

        // Aplica limite
        noticias = noticias.slice(0, parseInt(limite));

        res.json({
            success: true,
            total: noticias.length,
            fontes: Object.keys(newsFetcher.FONTES_RSS).length,
            atualizadoEm: new Date().toISOString(),
            noticias: noticias
        });
    } catch (error) {
        logger.error(`Erro ao buscar notícias: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/noticias/fontes
 * Lista todas as fontes de notícias disponíveis
 */
app.get('/api/noticias/fontes', (req, res) => {
    const fontes = Object.entries(newsFetcher.FONTES_RSS).map(([sigla, config]) => ({
        sigla,
        nome: config.nome,
        url: config.url,
        tipo: config.tipo,
        esfera: config.esfera,
        setor: config.setor,
        cor: config.cor
    }));

    res.json({
        success: true,
        total: fontes.length,
        fontes: fontes
    });
});

/**
 * GET /
 * Serve a interface HTML
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia servidor
const server = app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('  ARTESP PDF Collector - Servidor Iniciado');
    console.log('  Sistema de Sincronização Inteligente');
    console.log('='.repeat(60));
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(60));
    console.log('  Endpoints disponíveis:');
    console.log('  - GET  /api/health              Health check');
    console.log('  - GET  /api/sync-status         Status da sincronização');
    console.log('  - GET  /api/sync-history        Histórico completo');
    console.log('  - POST /api/sync-reset          Resetar histórico');
    console.log('  - GET  /api/logs                Logs do sistema');
    console.log('  - DELETE /api/logs              Limpar logs');
    console.log('  - GET  /api/pdfs                Lista PDFs processados');
    console.log('  - GET  /api/pdfs/:index         Detalhes de um PDF');
    console.log('  - POST /api/scrape-and-extract  Coleta e extrai PDFs');
    console.log('  - POST /api/send-to-lovable     Envia para Lovable');
    console.log('  - POST /api/test-connection     Testa endpoint Lovable');
    console.log('  - GET  /api/estatisticas        Estatísticas');
    console.log('  - DELETE /api/pdfs              Limpa memória');
    console.log('='.repeat(60));
    console.log('  Parâmetros especiais:');
    console.log('  - POST /api/scrape-and-extract?force=true');
    console.log('    Força coleta completa ignorando histórico');
    console.log('='.repeat(60));
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n[Server] Recebido ${signal}. Iniciando shutdown graceful...`);

    await logger.log(logger.OPERATION_TYPES.SYSTEM, logger.STATUS.INFO, {
        mensagem: `Shutdown iniciado (${signal})`,
        pdfsEmMemoria: pdfsProcessados.length
    });

    server.close(async () => {
        console.log('[Server] Servidor HTTP fechado.');
        console.log(`[Server] ${pdfsProcessados.length} PDF(s) em memória serão descartados.`);
        process.exit(0);
    });

    // Força saída após 10 segundos
    setTimeout(() => {
        console.error('[Server] Timeout no shutdown. Forçando saída...');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Tratamento de erros não capturados
process.on('uncaughtException', async (error) => {
    console.error('[Server] Erro não capturado:', error);
    await logger.logError(logger.OPERATION_TYPES.SYSTEM, error, {
        tipo: 'uncaughtException'
    });
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('[Server] Promise rejeitada não tratada:', reason);
    await logger.logError(logger.OPERATION_TYPES.SYSTEM, new Error(String(reason)), {
        tipo: 'unhandledRejection'
    });
});
