/**
 * ARTESP PDF Collector - Servidor Principal
 *
 * Sistema de coleta automática de PDFs de deliberações da ARTESP
 * com extração de texto e envio para Lovable
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

// Configurações
const PORT = process.env.PORT || 3000;
const REQUEST_DELAY = parseInt(process.env.REQUEST_DELAY) || 1000;

// Inicializa Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Armazena PDFs processados em memória (para a sessão atual)
let pdfsProcessados = [];
let ultimaAtualizacao = null;

/**
 * GET /api/health
 * Health check do servidor
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pdfsEmMemoria: pdfsProcessados.length,
        ultimaAtualizacao: ultimaAtualizacao
    });
});

/**
 * GET /api/pdfs
 * Retorna PDFs já processados na sessão atual
 */
app.get('/api/pdfs', (req, res) => {
    res.json({
        success: true,
        data: pdfsProcessados.map(pdf => ({
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
            statusExtracao: pdf.statusExtracao
        })),
        estatisticas: gerarEstatisticas(pdfsProcessados),
        ultimaAtualizacao: ultimaAtualizacao
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
 */
app.post('/api/scrape-and-extract', async (req, res) => {
    console.log('='.repeat(60));
    console.log('[Server] Iniciando processo de scraping e extração...');
    console.log('='.repeat(60));

    try {
        // Etapa 1: Scraping - encontra links dos PDFs
        console.log('\n[Server] ETAPA 1: Scraping da página da ARTESP...');
        const linksEncontrados = await scrapeWithRetry(3);

        if (linksEncontrados.length === 0) {
            console.log('[Server] Nenhum PDF encontrado para 2025-2026');
            return res.json({
                success: true,
                message: 'Nenhum PDF encontrado para os anos 2025-2026',
                data: [],
                estatisticas: {
                    totalPDFs: 0,
                    pdfsSucesso: 0,
                    pdfsErro: 0
                }
            });
        }

        console.log(`[Server] ${linksEncontrados.length} links encontrados`);

        // Etapa 2: Download - baixa PDFs em memória
        console.log('\n[Server] ETAPA 2: Download dos PDFs...');
        const pdfsComBuffer = await downloadMultiplePDFs(linksEncontrados, REQUEST_DELAY);

        // Etapa 3: Extração - extrai texto dos PDFs
        console.log('\n[Server] ETAPA 3: Extração de texto...');
        const pdfsComTexto = await extractFromMultiple(pdfsComBuffer);

        // Armazena em memória
        pdfsProcessados = pdfsComTexto;
        ultimaAtualizacao = new Date().toISOString();

        // Gera estatísticas
        const estatisticas = gerarEstatisticas(pdfsProcessados);

        console.log('\n' + '='.repeat(60));
        console.log('[Server] Processo concluído com sucesso!');
        console.log(`[Server] PDFs processados: ${estatisticas.pdfsSucesso}/${estatisticas.totalPDFs}`);
        console.log(`[Server] Total de páginas: ${estatisticas.totalPaginas}`);
        console.log(`[Server] Total de caracteres: ${estatisticas.totalCaracteres}`);
        console.log('='.repeat(60));

        res.json({
            success: true,
            message: `${estatisticas.pdfsSucesso} PDF(s) processado(s) com sucesso`,
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
                erroExtracao: pdf.erroExtracao
            })),
            estatisticas: estatisticas,
            ultimaAtualizacao: ultimaAtualizacao
        });

    } catch (error) {
        console.error('[Server] Erro no processo de scraping:', error);

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

    const { endpoint, indices } = req.body;

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
        // Se indices foi fornecido, filtra apenas os PDFs selecionados
        let pdfsParaEnviar = pdfsProcessados;
        if (indices && Array.isArray(indices) && indices.length > 0) {
            pdfsParaEnviar = indices
                .filter(i => i >= 0 && i < pdfsProcessados.length)
                .map(i => pdfsProcessados[i]);
        }

        console.log(`[Server] Enviando ${pdfsParaEnviar.length} PDF(s) para ${endpoint}`);

        const resultado = await sendMultipleToLovable(pdfsParaEnviar, endpoint, REQUEST_DELAY);

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
app.get('/api/estatisticas', (req, res) => {
    res.json({
        success: true,
        estatisticas: gerarEstatisticas(pdfsProcessados),
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
 * GET /
 * Serve a interface HTML
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia servidor
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('  ARTESP PDF Collector - Servidor Iniciado');
    console.log('='.repeat(60));
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(60));
    console.log('  Endpoints disponíveis:');
    console.log('  - GET  /api/health           Health check');
    console.log('  - GET  /api/pdfs             Lista PDFs processados');
    console.log('  - GET  /api/pdfs/:index      Detalhes de um PDF');
    console.log('  - POST /api/scrape-and-extract  Coleta e extrai PDFs');
    console.log('  - POST /api/send-to-lovable  Envia para Lovable');
    console.log('  - POST /api/test-connection  Testa endpoint Lovable');
    console.log('  - GET  /api/estatisticas     Estatísticas');
    console.log('  - DELETE /api/pdfs           Limpa memória');
    console.log('='.repeat(60));
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('[Server] Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Promise rejeitada não tratada:', reason);
});
