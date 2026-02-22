/**
 * IRIS Platform - Plataforma Unificada
 *
 * Combina coleta de PDFs (ARTESP) + Análise de Deliberações
 * Tudo em uma única interface
 *
 * Funcionalidades:
 * - Coleta automática de PDFs da ARTESP
 * - Upload manual de PDFs
 * - Análise de deliberações (classificação, votos, etc.)
 * - Monitoramento de novos documentos
 *
 * Acesse: http://localhost:3000
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

// Importa serviços do coletor
const { scrapeWithRetry } = require('./src/services/scraper');
const { downloadMultiplePDFs } = require('./src/services/downloader');
const { extractFromMultiple, gerarEstatisticas } = require('./src/services/extractor');
const syncManager = require('./src/services/sync-manager');

// Importa serviços do IRIS Core
const irisCore = require('../iris-core/processador');
const newsFetcher = require('../iris-core/services/news-fetcher');

const app = express();
const PORT = process.env.PORT || 3000;

// Armazena PDFs processados em memória
let pdfsProcessados = [];
let ultimaColeta = null;

// Sistema de Monitoramento
let monitoramentoAtivo = false;
let linksConhecidos = new Set();
let novosDocumentos = [];
let ultimoMonitoramento = null;
const INTERVALO_MONITORAMENTO = 30 * 60 * 1000; // 30 minutos

// ============================================================================
// LISTA DE EMPRESAS CONHECIDAS (para deteccao automatica em PDFs)
// ============================================================================
const empresasConhecidas = [
    // Rodovias - Concessionarias
    { nome: 'AutoBAn', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['AUTOBAN', 'Auto Ban', 'Autovias Bandeirantes'] },
    { nome: 'CCR ViaOeste', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['VIAOESTE', 'Via Oeste', 'CCR VIAOESTE'] },
    { nome: 'CCR AutoBAn', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['CCR AUTOBAN'] },
    { nome: 'CCR RodoAnel', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['RODOANEL', 'Rodo Anel'] },
    { nome: 'CCR SPVias', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['SPVIAS', 'SP Vias'] },
    { nome: 'EcoRodovias', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['ECORODOVIAS', 'Eco Rodovias', 'Ecovias'] },
    { nome: 'Arteris', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['ARTERIS', 'Arteris S.A.'] },
    { nome: 'Intervias', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['INTERVIAS', 'Inter Vias'] },
    { nome: 'Renovias', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['RENOVIAS', 'Reno Vias'] },
    { nome: 'Centrovias', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['CENTROVIAS', 'Centro Vias'] },
    { nome: 'Triângulo do Sol', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['TRIANGULO DO SOL', 'TrianguloSol'] },
    { nome: 'Tebe', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['TEBE'] },
    { nome: 'Vianorte', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['VIANORTE', 'Via Norte'] },
    { nome: 'Colinas', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['COLINAS', 'Colinas S.A.'] },
    { nome: 'Entrevias', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['ENTREVIAS', 'Entre Vias'] },
    { nome: 'Eixo SP', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['EIXO SP', 'EixoSP'] },
    { nome: 'Rota das Bandeiras', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['ROTA DAS BANDEIRAS', 'RotaBandeiras'] },
    { nome: 'Cart', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['CART', 'Concessionaria Auto Raposo Tavares'] },
    { nome: 'ViaRondon', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['VIARONDON', 'Via Rondon'] },
    { nome: 'Rodovias do Tiete', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['RODOVIAS DO TIETE', 'Tiete'] },
    { nome: 'AB Nascentes das Gerais', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['NASCENTES DAS GERAIS', 'AB Nascentes'] },
    { nome: 'Tamoios', setor: 'Rodovias', tipo: 'Concessionaria', aliases: ['TAMOIOS', 'Concessionaria Tamoios'] },
    // Ferrovias
    { nome: 'Rumo Logistica', setor: 'Ferrovias', tipo: 'Concessionaria', aliases: ['RUMO', 'Rumo S.A.', 'RUMO LOGISTICA'] },
    { nome: 'CPTM', setor: 'Ferrovias', tipo: 'Estatal', aliases: ['CPTM', 'Companhia Paulista de Trens Metropolitanos'] },
    { nome: 'VLI', setor: 'Ferrovias', tipo: 'Concessionaria', aliases: ['VLI', 'VLI Logistica'] },
    { nome: 'MRS Logistica', setor: 'Ferrovias', tipo: 'Concessionaria', aliases: ['MRS', 'MRS LOGISTICA'] },
    // Onibus
    { nome: 'Viacao Barretos', setor: 'Onibus', tipo: 'Permissionaria', aliases: ['VIACAO BARRETOS', 'Barretos'] },
    { nome: 'Viacao Cometa', setor: 'Onibus', tipo: 'Permissionaria', aliases: ['COMETA', 'VIACAO COMETA'] },
    { nome: 'Viacao Garcia', setor: 'Onibus', tipo: 'Permissionaria', aliases: ['GARCIA', 'VIACAO GARCIA'] },
    { nome: 'Viacao Itapemirim', setor: 'Onibus', tipo: 'Permissionaria', aliases: ['ITAPEMIRIM', 'VIACAO ITAPEMIRIM'] },
    { nome: 'Socicam', setor: 'Onibus', tipo: 'Operadora', aliases: ['SOCICAM'] },
    { nome: 'Viacao Piracicabana', setor: 'Onibus', tipo: 'Permissionaria', aliases: ['PIRACICABANA', 'VIACAO PIRACICABANA'] },
    // Aeroportos
    { nome: 'Viracopos', setor: 'Aeroportos', tipo: 'Concessionaria', aliases: ['VIRACOPOS', 'Aeroporto de Viracopos'] },
    { nome: 'GRU Airport', setor: 'Aeroportos', tipo: 'Concessionaria', aliases: ['GRU', 'GRU AIRPORT', 'Guarulhos'] },
    // Portos
    { nome: 'Porto de Santos', setor: 'Portos', tipo: 'Autoridade', aliases: ['PORTO DE SANTOS', 'Santos Port'] },
    { nome: 'Santos Brasil', setor: 'Portos', tipo: 'Operadora', aliases: ['SANTOS BRASIL'] },
    { nome: 'DP World Santos', setor: 'Portos', tipo: 'Operadora', aliases: ['DP WORLD', 'DPWORLD'] },
    // Multimodal
    { nome: 'ViaQuatro', setor: 'Multimodal', tipo: 'Concessionaria', aliases: ['VIAQUATRO', 'Via Quatro', 'Linha 4'] },
    { nome: 'ViaMobilidade', setor: 'Multimodal', tipo: 'Concessionaria', aliases: ['VIAMOBILIDADE', 'Via Mobilidade'] },
    { nome: 'Metro SP', setor: 'Multimodal', tipo: 'Estatal', aliases: ['METRO', 'METRO SP', 'Metropolitano'] }
];

/**
 * Detecta empresas mencionadas no texto do PDF
 * Usa a lista local de concessionárias + normalização unificada do iris-core
 * @param {string} texto - Texto extraido do PDF
 * @returns {Array} - Lista de empresas detectadas com suas informacoes
 */
function detectarEmpresas(texto) {
    if (!texto) return [];

    const textoUpper = texto.toUpperCase();
    const empresasDetectadas = [];

    for (const empresa of empresasConhecidas) {
        // Verifica o nome principal
        if (textoUpper.includes(empresa.nome.toUpperCase())) {
            // Usa normalizarEmpresa do iris-core para nome consistente
            const nomeNormalizado = irisCore.normalizarEmpresa ? irisCore.normalizarEmpresa(empresa.nome) : empresa.nome;
            empresasDetectadas.push({
                nome: empresa.nome,
                nomeNormalizado: nomeNormalizado,
                setor: empresa.setor,
                tipo: empresa.tipo,
                mencoes: contarMencoes(textoUpper, empresa.nome.toUpperCase())
            });
            continue;
        }

        // Verifica aliases
        for (const alias of empresa.aliases || []) {
            if (textoUpper.includes(alias.toUpperCase())) {
                const nomeNormalizado = irisCore.normalizarEmpresa ? irisCore.normalizarEmpresa(empresa.nome) : empresa.nome;
                empresasDetectadas.push({
                    nome: empresa.nome,
                    nomeNormalizado: nomeNormalizado,
                    setor: empresa.setor,
                    tipo: empresa.tipo,
                    mencoes: contarMencoes(textoUpper, alias.toUpperCase())
                });
                break;
            }
        }
    }

    // Remove duplicatas e ordena por numero de mencoes
    const empresasUnicas = [];
    const nomesVistos = new Set();

    for (const emp of empresasDetectadas) {
        if (!nomesVistos.has(emp.nome)) {
            nomesVistos.add(emp.nome);
            empresasUnicas.push(emp);
        }
    }

    return empresasUnicas.sort((a, b) => b.mencoes - a.mencoes);
}

/**
 * Conta quantas vezes um termo aparece no texto
 */
function contarMencoes(texto, termo) {
    const regex = new RegExp(termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (texto.match(regex) || []).length;
}

// Middleware - aumentado para suportar uploads grandes
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// ── Rate Limiting (sem dependência externa) ──
const rateLimitStore = {};
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 120; // 120 req/min por IP (generoso para SPA)
const RATE_LIMIT_STRICT = 20; // 20 req/min para endpoints pesados

function rateLimit(maxReqs = RATE_LIMIT_MAX) {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const key = `${ip}:${maxReqs}`;
        const now = Date.now();

        if (!rateLimitStore[key] || (now - rateLimitStore[key].start) > RATE_LIMIT_WINDOW) {
            rateLimitStore[key] = { count: 1, start: now };
        } else {
            rateLimitStore[key].count++;
        }

        if (rateLimitStore[key].count > maxReqs) {
            return res.status(429).json({
                success: false,
                erro: 'Limite de requisições excedido. Tente novamente em 1 minuto.',
                retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - rateLimitStore[key].start)) / 1000)
            });
        }

        res.setHeader('X-RateLimit-Limit', maxReqs);
        res.setHeader('X-RateLimit-Remaining', maxReqs - rateLimitStore[key].count);
        next();
    };
}

// Limpar entradas antigas do rate limit store a cada 5 min
setInterval(() => {
    const now = Date.now();
    for (const key of Object.keys(rateLimitStore)) {
        if ((now - rateLimitStore[key].start) > RATE_LIMIT_WINDOW * 2) {
            delete rateLimitStore[key];
        }
    }
}, 5 * 60 * 1000);

// Rate limit global
app.use(rateLimit(RATE_LIMIT_MAX));

// Timeout para requisições longas (10 minutos)
app.use((req, res, next) => {
    req.setTimeout(600000); // 10 minutos
    res.setTimeout(600000);
    next();
});

// ── Input Validation Helpers ──
function sanitizeString(str, maxLen = 500) {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '').trim().substring(0, maxLen);
}

function validateCNPJ(cnpj) {
    if (typeof cnpj !== 'string') return false;
    const cleaned = cnpj.replace(/[^\d]/g, '');
    return cleaned.length === 14;
}

// ── Performance: Cache headers for API ──
app.use((req, res, next) => {
    const origJson = res.json.bind(res);
    res.json = (body) => {
        res.setHeader('Cache-Control', 'no-cache');
        return origJson(body);
    };
    next();
});

// Servir arquivos estáticos com cache headers
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
}));

// ============================================================================
// API - NOTÍCIAS REAIS (RSS das Agências Reguladoras)
// ============================================================================

app.get('/api/noticias', async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 50;
        const forceRefresh = req.query.forceRefresh === 'true';
        const setor = req.query.setor || '';
        const esfera = req.query.esfera || '';

        console.log(`[Notícias] Buscando notícias reais (limite=${limite}, refresh=${forceRefresh})`);

        let noticias;

        if (setor) {
            noticias = await newsFetcher.fetchNoticiasPorSetor(setor, limite);
        } else if (esfera) {
            noticias = await newsFetcher.fetchNoticiasPorEsfera(esfera, limite);
        } else {
            noticias = await newsFetcher.fetchNoticiasComCache(forceRefresh);
            noticias = noticias.slice(0, limite);
        }

        console.log(`[Notícias] ${noticias.length} notícias obtidas de fontes oficiais`);

        res.json({
            success: true,
            noticias: noticias,
            total: noticias.length,
            fontes: Object.keys(newsFetcher.FONTES_RSS).length,
            cache: !forceRefresh,
            atualizadoEm: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Notícias] Erro:', error.message);
        res.status(500).json({
            success: false,
            noticias: [],
            erro: error.message
        });
    }
});

// Status de todas as fontes de notícias
app.get('/api/noticias/status', (req, res) => {
    res.json({
        success: true,
        fontes: newsFetcher.getStatusFontes ? newsFetcher.getStatusFontes() : [],
        total: Object.keys(newsFetcher.FONTES_RSS).length
    });
});

// ============================================================================
// API - COLETA DE PDFs
// ============================================================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'IRIS Platform',
        version: '1.1.0',
        pdfsEmMemoria: pdfsProcessados.length,
        ultimaColeta,
        uptime: process.uptime()
    });
});

app.post('/api/scrape-and-extract', rateLimit(RATE_LIMIT_STRICT), async (req, res) => {
    try {
        const forceComplete = req.query.force === 'true';

        console.log('\n════════════════════════════════════════════════════════');
        console.log('[IRIS] INICIANDO COLETA DE PDFs');
        console.log('════════════════════════════════════════════════════════');
        console.log(`[IRIS] Modo: ${forceComplete ? 'FORÇADO (ignora histórico)' : 'INCREMENTAL'}`);

        // 1. Scraping
        console.log('\n[IRIS] ETAPA 1: Scraping da página ARTESP...');
        const links = await scrapeWithRetry(3);

        console.log(`[IRIS] → ${links.length} links de deliberações encontrados`);

        if (links.length === 0) {
            console.log('[IRIS] ⚠️ Nenhum link encontrado!');
            return res.json({
                sucesso: true,
                mensagem: 'Nenhum PDF encontrado na página. Verifique o terminal para detalhes.',
                pdfs: [],
                etapa: 'scraping'
            });
        }

        // 2. Comparar com histórico (sempre força para garantir coleta)
        console.log('\n[IRIS] ETAPA 2: Preparando download...');
        let pdfsParaProcessar = links.map(pdf => ({ ...pdf, ehNovo: true }));
        console.log(`[IRIS] → ${pdfsParaProcessar.length} PDFs para processar`);

        // 3. Download
        console.log(`\n[IRIS] ETAPA 3: Download de ${pdfsParaProcessar.length} PDFs...`);
        console.log('[IRIS] ⏳ Isso pode demorar alguns minutos...');

        const pdfsComBuffer = await downloadMultiplePDFs(pdfsParaProcessar);

        const downloadSucesso = pdfsComBuffer.filter(p => p.status === 'sucesso').length;
        const downloadErro = pdfsComBuffer.filter(p => p.status === 'erro').length;
        console.log(`[IRIS] → Download: ${downloadSucesso} sucesso, ${downloadErro} erros`);

        if (downloadSucesso === 0) {
            console.log('[IRIS] ⚠️ Nenhum PDF baixado com sucesso!');
            return res.json({
                sucesso: false,
                mensagem: `Nenhum PDF baixado. ${downloadErro} erros de download. Verifique o terminal.`,
                pdfs: [],
                etapa: 'download',
                erros: downloadErro
            });
        }

        // 4. Extração
        console.log('\n[IRIS] ETAPA 4: Extração de texto...');
        const pdfsExtraidos = await extractFromMultiple(pdfsComBuffer);

        const extracaoSucesso = pdfsExtraidos.filter(p => p.statusExtracao === 'sucesso').length;
        console.log(`[IRIS] → Extração: ${extracaoSucesso} PDFs com texto extraído`);

        // 5. Atualiza histórico
        console.log('\n[IRIS] ETAPA 5: Finalizando...');
        await syncManager.updateHistory(pdfsExtraidos, true);

        // Armazena em memória
        pdfsProcessados = pdfsExtraidos.filter(p => p.statusExtracao === 'sucesso');
        ultimaColeta = new Date().toISOString();

        const stats = gerarEstatisticas(pdfsExtraidos);

        console.log('\n════════════════════════════════════════════════════════');
        console.log('[IRIS] ✅ COLETA CONCLUÍDA');
        console.log(`[IRIS] → PDFs com sucesso: ${stats.pdfsSucesso}`);
        console.log(`[IRIS] → PDFs com erro: ${stats.pdfsErro}`);
        console.log('════════════════════════════════════════════════════════\n');

        res.json({
            sucesso: true,
            mensagem: `${stats.pdfsSucesso} PDFs processados com sucesso`,
            estatisticas: stats,
            etapas: {
                linksEncontrados: links.length,
                downloadSucesso,
                downloadErro,
                extracaoSucesso
            },
            pdfs: pdfsProcessados.map(p => ({
                nomeArquivo: p.nomeArquivo,
                data: p.data,
                reuniao: p.reuniao,
                numPaginas: p.numPaginas,
                numCaracteres: p.numCaracteres,
                textoPreview: p.texto?.substring(0, 300) + '...'
            }))
        });

    } catch (error) {
        console.error('\n[IRIS] ❌ ERRO NA COLETA:', error.message);
        console.error(error.stack);
        res.status(500).json({ erro: error.message });
    }
});

app.get('/api/pdfs', (req, res) => {
    res.json({
        total: pdfsProcessados.length,
        ultimaColeta,
        pdfs: pdfsProcessados.map((p, i) => ({
            index: i,
            nome: p.nomeArquivo,
            nomeArquivo: p.nomeArquivo,
            data: p.data,
            reuniao: p.reuniao,
            numPaginas: p.numPaginas,
            numCaracteres: p.numCaracteres,
            size: p.numCaracteres || 0,
            status: p.analise ? 'analisado' : 'pendente',
            analisado: p.analise ? true : false,
            deliberacoes_count: p.analise?.totalDeliberacoes || p.analise?.deliberacoes?.length || 0
        }))
    });
});

app.get('/api/pdfs/:index', (req, res) => {
    const index = parseInt(req.params.index);

    if (index < 0 || index >= pdfsProcessados.length) {
        return res.status(404).json({ erro: 'PDF não encontrado' });
    }

    const pdf = pdfsProcessados[index];
    res.json({
        nomeArquivo: pdf.nomeArquivo,
        data: pdf.data,
        reuniao: pdf.reuniao,
        url: pdf.url,
        numPaginas: pdf.numPaginas,
        numCaracteres: pdf.numCaracteres,
        texto: pdf.texto,
        analise: pdf.analise || null
    });
});

// ============================================================================
// API - ANÁLISE IRIS CORE
// ============================================================================

app.post('/api/analisar', (req, res) => {
    try {
        const { texto } = req.body;

        if (!texto || texto.trim().length < 10) {
            return res.status(400).json({ erro: 'Texto muito curto' });
        }

        const analise = irisCore.analisarTexto(texto);
        res.json({ sucesso: true, analise });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.post('/api/analisar-pdf/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);

        if (index < 0 || index >= pdfsProcessados.length) {
            return res.status(404).json({ erro: 'PDF não encontrado' });
        }

        const pdf = pdfsProcessados[index];

        if (!pdf.texto) {
            return res.status(400).json({ erro: 'PDF não possui texto extraído' });
        }

        // Usa a nova extração estruturada
        const extracao = irisCore.extrairDeliberacoesEstruturadas(pdf.texto);

        // Também faz análise tradicional para manter compatibilidade
        const analiseTradicional = irisCore.analisarTexto(pdf.texto);

        // Detecta empresas mencionadas no texto
        const empresasDetectadas = detectarEmpresas(pdf.texto);

        // Combina os resultados
        const analise = {
            ...analiseTradicional,
            deliberacoes: extracao.deliberations,
            totalDeliberacoes: extracao.total,
            empresasDetectadas: empresasDetectadas
        };

        // Salva análise no PDF
        pdfsProcessados[index].analise = analise;
        pdfsProcessados[index].empresasDetectadas = empresasDetectadas;

        res.json({
            sucesso: true,
            nomeArquivo: pdf.nomeArquivo,
            analise,
            empresasDetectadas
        });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.post('/api/analisar-todos', async (req, res) => {
    try {
        if (pdfsProcessados.length === 0) {
            return res.status(400).json({ erro: 'Nenhum PDF em memória. Execute a coleta primeiro.' });
        }

        const resultados = [];
        let totalDeliberacoes = 0;
        const todasEmpresas = new Map();

        for (let i = 0; i < pdfsProcessados.length; i++) {
            const pdf = pdfsProcessados[i];

            if (pdf.texto) {
                // Usa a nova extração estruturada
                const extracao = irisCore.extrairDeliberacoesEstruturadas(pdf.texto);
                const analiseTradicional = irisCore.analisarTexto(pdf.texto);

                // Detecta empresas mencionadas
                const empresasDetectadas = detectarEmpresas(pdf.texto);

                const analise = {
                    ...analiseTradicional,
                    deliberacoes: extracao.deliberations,
                    totalDeliberacoes: extracao.total,
                    empresasDetectadas: empresasDetectadas
                };

                pdfsProcessados[i].analise = analise;
                pdfsProcessados[i].empresasDetectadas = empresasDetectadas;
                totalDeliberacoes += extracao.total;

                // Agrega empresas detectadas
                for (const emp of empresasDetectadas) {
                    if (todasEmpresas.has(emp.nome)) {
                        todasEmpresas.get(emp.nome).mencoes += emp.mencoes;
                        todasEmpresas.get(emp.nome).documentos++;
                    } else {
                        todasEmpresas.set(emp.nome, { ...emp, documentos: 1 });
                    }
                }

                resultados.push({
                    index: i,
                    nomeArquivo: pdf.nomeArquivo,
                    tipo: analise.tipo,
                    decisao: analise.decisao,
                    microtema: analise.microtema,
                    confianca: analise.confiancaGeral,
                    deliberacoes: extracao.deliberations.length,
                    empresasDetectadas: empresasDetectadas.length
                });
            }
        }

        res.json({
            sucesso: true,
            totalAnalisados: resultados.length,
            totalDeliberacoes,
            empresasAgregadas: Array.from(todasEmpresas.values()).sort((a, b) => b.mencoes - a.mencoes),
            resultados
        });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.get('/api/estatisticas', (req, res) => {
    const analisados = pdfsProcessados.filter(p => p.analise);

    const stats = {
        totalPdfs: pdfsProcessados.length,
        totalAnalisados: analisados.length,
        porTipo: {
            pleitoExterno: analisados.filter(p => p.analise.tipo === 'Pleito Externo').length,
            atoInterno: analisados.filter(p => p.analise.tipo === 'Ato Administrativo Interno').length,
            naoClassificado: analisados.filter(p => p.analise.tipo === 'Não Classificado').length
        },
        porDecisao: {
            deferido: analisados.filter(p => p.analise.decisao === 'Deferido').length,
            indeferido: analisados.filter(p => p.analise.decisao === 'Indeferido').length,
            naoIdentificado: analisados.filter(p => p.analise.decisao === 'Não Identificada').length
        },
        ultimaColeta
    };

    res.json(stats);
});

// ============================================================================
// API - EMPRESAS DETECTADAS
// ============================================================================

// Endpoint para listar empresas conhecidas
app.get('/api/empresas/conhecidas', (req, res) => {
    res.json({
        sucesso: true,
        total: empresasConhecidas.length,
        empresas: empresasConhecidas.map(e => ({
            nome: e.nome,
            setor: e.setor,
            tipo: e.tipo
        }))
    });
});

// Endpoint para listar todas as empresas detectadas nos PDFs
app.get('/api/empresas/detectadas', (req, res) => {
    const empresasAgregadas = new Map();

    for (const pdf of pdfsProcessados) {
        const empresas = pdf.empresasDetectadas || [];
        for (const emp of empresas) {
            if (empresasAgregadas.has(emp.nome)) {
                empresasAgregadas.get(emp.nome).mencoes += emp.mencoes;
                empresasAgregadas.get(emp.nome).documentos++;
            } else {
                empresasAgregadas.set(emp.nome, { ...emp, documentos: 1 });
            }
        }
    }

    const lista = Array.from(empresasAgregadas.values()).sort((a, b) => b.mencoes - a.mencoes);

    res.json({
        sucesso: true,
        total: lista.length,
        empresas: lista
    });
});

// Endpoint para adicionar empresa a partir de deteccao
app.post('/api/empresas/adicionar', rateLimit(RATE_LIMIT_STRICT), (req, res) => {
    const nome = sanitizeString(req.body.nome, 200);
    const setor = sanitizeString(req.body.setor, 100);
    const tipo = sanitizeString(req.body.tipo, 100);

    if (!nome || nome.length < 2 || !setor || setor.length < 2) {
        return res.status(400).json({ erro: 'Nome (min 2 chars) e setor sao obrigatorios' });
    }

    // Verifica se ja existe
    const existe = empresasConhecidas.find(e => e.nome.toLowerCase() === nome.toLowerCase());
    if (existe) {
        return res.status(400).json({ erro: 'Empresa ja cadastrada' });
    }

    // Adiciona a nova empresa
    empresasConhecidas.push({
        nome,
        setor,
        tipo: tipo || 'Empresa',
        aliases: [nome.toUpperCase()]
    });

    res.json({
        sucesso: true,
        mensagem: `Empresa "${nome}" adicionada com sucesso`,
        empresa: { nome, setor, tipo: tipo || 'Empresa' }
    });
});

// ============================================================================
// API - UPLOAD DE PDFs
// ============================================================================

// Endpoint para upload de PDFs (aceita base64)
app.post('/api/upload-pdf', async (req, res) => {
    try {
        const { arquivo, nomeArquivo } = req.body;

        if (!arquivo) {
            return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
        }

        console.log(`\n[IRIS] Processando upload: ${nomeArquivo}`);

        // Decodifica base64
        const base64Data = arquivo.replace(/^data:application\/pdf;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Extrai texto do PDF
        const pdfData = await pdfParse(buffer);

        // Detecta empresas automaticamente no texto do PDF
        const empresasDetectadas = detectarEmpresas(pdfData.text);

        const pdf = {
            nomeArquivo: nomeArquivo || `upload_${Date.now()}.pdf`,
            texto: pdfData.text,
            numPaginas: pdfData.numpages,
            numCaracteres: pdfData.text.length,
            data: new Date().toLocaleDateString('pt-BR'),
            origem: 'upload',
            statusExtracao: 'sucesso',
            empresasDetectadas: empresasDetectadas
        };

        pdfsProcessados.push(pdf);

        console.log(`[IRIS] Upload processado: ${pdf.nomeArquivo} (${pdf.numPaginas} páginas)`);
        if (empresasDetectadas.length > 0) {
            console.log(`[IRIS] Empresas detectadas: ${empresasDetectadas.map(e => e.nome).join(', ')}`);
        }

        res.json({
            sucesso: true,
            mensagem: `PDF "${pdf.nomeArquivo}" carregado com sucesso`,
            index: pdfsProcessados.length - 1,
            pdf: {
                nomeArquivo: pdf.nomeArquivo,
                numPaginas: pdf.numPaginas,
                numCaracteres: pdf.numCaracteres
            },
            empresasDetectadas: empresasDetectadas
        });

    } catch (error) {
        console.error('[IRIS] Erro no upload:', error.message);
        res.status(500).json({ erro: 'Erro ao processar PDF: ' + error.message });
    }
});

// Endpoint para upload múltiplo
app.post('/api/upload-multiplo', async (req, res) => {
    try {
        const { arquivos } = req.body;

        if (!arquivos || !Array.isArray(arquivos) || arquivos.length === 0) {
            return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
        }

        const total = arquivos.length;
        console.log(`\n[IRIS] ════════════════════════════════════════════════`);
        console.log(`[IRIS] UPLOAD MÚLTIPLO: ${total} PDFs`);
        console.log(`[IRIS] ════════════════════════════════════════════════`);

        const resultados = [];
        let sucesso = 0;
        let erros = 0;

        // Processa em lotes de 10 para não sobrecarregar memória
        const TAMANHO_LOTE = 10;
        const numLotes = Math.ceil(total / TAMANHO_LOTE);

        for (let lote = 0; lote < numLotes; lote++) {
            const inicio = lote * TAMANHO_LOTE;
            const fim = Math.min(inicio + TAMANHO_LOTE, total);
            const arquivosLote = arquivos.slice(inicio, fim);

            console.log(`[IRIS] Processando lote ${lote + 1}/${numLotes} (PDFs ${inicio + 1}-${fim})`);

            // Processa cada arquivo do lote
            for (const arq of arquivosLote) {
                try {
                    const base64Data = arq.arquivo.replace(/^data:application\/pdf;base64,/, '');
                    const buffer = Buffer.from(base64Data, 'base64');

                    // Libera memória do base64 original
                    arq.arquivo = null;

                    const pdfData = await pdfParse(buffer);

                    const pdf = {
                        nomeArquivo: arq.nomeArquivo || `upload_${Date.now()}.pdf`,
                        texto: pdfData.text,
                        numPaginas: pdfData.numpages,
                        numCaracteres: pdfData.text.length,
                        data: new Date().toLocaleDateString('pt-BR'),
                        origem: 'upload',
                        statusExtracao: 'sucesso'
                    };

                    pdfsProcessados.push(pdf);
                    resultados.push({ nome: pdf.nomeArquivo, status: 'sucesso' });
                    sucesso++;

                } catch (err) {
                    console.log(`[IRIS] ⚠️ Erro no PDF: ${arq.nomeArquivo} - ${err.message}`);
                    resultados.push({ nome: arq.nomeArquivo, status: 'erro', erro: err.message });
                    erros++;
                }
            }

            // Força garbage collection entre lotes (se disponível)
            if (global.gc) {
                global.gc();
            }

            console.log(`[IRIS] Lote ${lote + 1} concluído. Progresso: ${sucesso + erros}/${total}`);
        }

        console.log(`[IRIS] ════════════════════════════════════════════════`);
        console.log(`[IRIS] ✅ UPLOAD CONCLUÍDO: ${sucesso} sucesso, ${erros} erros`);
        console.log(`[IRIS] ════════════════════════════════════════════════\n`);

        res.json({
            sucesso: true,
            mensagem: `${sucesso} PDFs carregados com sucesso`,
            totalSucesso: sucesso,
            totalErros: erros,
            resultados
        });

    } catch (error) {
        console.error('[IRIS] Erro no upload múltiplo:', error.message);
        res.status(500).json({ erro: error.message });
    }
});

// Endpoint para upload via URL
app.post('/api/upload-url', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ erro: 'URL é obrigatória' });
        }

        console.log(`\n[IRIS] Baixando PDF de: ${url}`);

        // Baixa o PDF
        const axios = require('axios');
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const buffer = Buffer.from(response.data);

        // Extrai o nome do arquivo da URL
        const nomeArquivo = url.split('/').pop() || `download_${Date.now()}.pdf`;

        // Extrai texto do PDF
        const pdfData = await pdfParse(buffer);

        const pdf = {
            nomeArquivo,
            texto: pdfData.text,
            numPaginas: pdfData.numpages,
            numCaracteres: pdfData.text.length,
            data: new Date().toLocaleDateString('pt-BR'),
            origem: 'url',
            url: url,
            statusExtracao: 'sucesso'
        };

        pdfsProcessados.push(pdf);

        console.log(`[IRIS] PDF baixado: ${pdf.nomeArquivo} (${pdf.numPaginas} páginas)`);

        res.json({
            sucesso: true,
            mensagem: `PDF "${pdf.nomeArquivo}" baixado com sucesso`,
            index: pdfsProcessados.length - 1,
            pdf: {
                nomeArquivo: pdf.nomeArquivo,
                numPaginas: pdf.numPaginas,
                numCaracteres: pdf.numCaracteres
            }
        });

    } catch (error) {
        console.error('[IRIS] Erro ao baixar PDF:', error.message);
        res.status(500).json({ erro: 'Erro ao baixar PDF: ' + error.message });
    }
});

// Endpoint para excluir PDF
app.delete('/api/pdf/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);

        if (index < 0 || index >= pdfsProcessados.length) {
            return res.status(404).json({ erro: 'PDF não encontrado' });
        }

        const pdf = pdfsProcessados[index];
        pdfsProcessados.splice(index, 1);

        console.log(`[IRIS] PDF removido: ${pdf.nomeArquivo}`);

        res.json({
            sucesso: true,
            mensagem: `PDF "${pdf.nomeArquivo}" removido`
        });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// ============================================================================
// API - MONITORAMENTO DE NOVOS DOCUMENTOS
// ============================================================================

let intervalMonitoramento = null;

// Função para verificar novos documentos
async function verificarNovosDocumentos() {
    try {
        console.log('\n[MONITOR] Verificando novos documentos na ARTESP...');
        ultimoMonitoramento = new Date().toISOString();

        const links = await scrapeWithRetry(2);

        if (links.length === 0) {
            console.log('[MONITOR] Nenhum link encontrado');
            return { novos: 0, total: 0 };
        }

        // Primeira execução - apenas registra os links conhecidos
        if (linksConhecidos.size === 0) {
            links.forEach(l => linksConhecidos.add(l.url));
            console.log(`[MONITOR] Primeira verificação: ${links.length} documentos registrados`);
            return { novos: 0, total: links.length, primeiraExecucao: true };
        }

        // Verifica novos documentos
        const novos = links.filter(l => !linksConhecidos.has(l.url));

        if (novos.length > 0) {
            console.log(`[MONITOR] NOVOS DOCUMENTOS ENCONTRADOS: ${novos.length}`);
            novos.forEach(doc => {
                linksConhecidos.add(doc.url);
                novosDocumentos.push({
                    ...doc,
                    descobertoEm: new Date().toISOString(),
                    lido: false
                });
                console.log(`  - ${doc.nomeArquivo}`);
            });
        } else {
            console.log('[MONITOR] Nenhum documento novo encontrado');
        }

        return { novos: novos.length, total: links.length, documentos: novos };

    } catch (error) {
        console.error('[MONITOR] Erro na verificação:', error.message);
        return { erro: error.message };
    }
}

// Iniciar monitoramento
app.post('/api/monitoramento/iniciar', (req, res) => {
    if (monitoramentoAtivo) {
        return res.json({ sucesso: false, mensagem: 'Monitoramento já está ativo' });
    }

    monitoramentoAtivo = true;

    // Executa imediatamente
    verificarNovosDocumentos();

    // Configura intervalo (30 minutos)
    intervalMonitoramento = setInterval(verificarNovosDocumentos, INTERVALO_MONITORAMENTO);

    console.log('[MONITOR] Monitoramento INICIADO (intervalo: 30 min)');

    res.json({
        sucesso: true,
        mensagem: 'Monitoramento iniciado',
        intervalo: '30 minutos'
    });
});

// Parar monitoramento
app.post('/api/monitoramento/parar', (req, res) => {
    if (!monitoramentoAtivo) {
        return res.json({ sucesso: false, mensagem: 'Monitoramento não está ativo' });
    }

    monitoramentoAtivo = false;
    if (intervalMonitoramento) {
        clearInterval(intervalMonitoramento);
        intervalMonitoramento = null;
    }

    console.log('[MONITOR] Monitoramento PARADO');

    res.json({
        sucesso: true,
        mensagem: 'Monitoramento parado'
    });
});

// Status do monitoramento
app.get('/api/monitoramento/status', (req, res) => {
    res.json({
        ativo: monitoramentoAtivo,
        ultimaVerificacao: ultimoMonitoramento,
        documentosConhecidos: linksConhecidos.size,
        novosDocumentos: novosDocumentos.filter(d => !d.lido).length,
        intervalo: '30 minutos'
    });
});

// Listar novos documentos encontrados
app.get('/api/monitoramento/novos', (req, res) => {
    res.json({
        total: novosDocumentos.length,
        naoLidos: novosDocumentos.filter(d => !d.lido).length,
        documentos: novosDocumentos.slice(-50).reverse() // Últimos 50
    });
});

// Marcar documentos como lidos
app.post('/api/monitoramento/marcar-lidos', (req, res) => {
    const naoLidos = novosDocumentos.filter(d => !d.lido).length;
    novosDocumentos.forEach(d => d.lido = true);

    res.json({
        sucesso: true,
        marcados: naoLidos
    });
});

// Verificar agora (manual)
app.post('/api/monitoramento/verificar-agora', async (req, res) => {
    const resultado = await verificarNovosDocumentos();
    res.json(resultado);
});

// Limpar PDFs da memória
app.post('/api/limpar-pdfs', (req, res) => {
    const total = pdfsProcessados.length;
    pdfsProcessados = [];
    ultimaColeta = null;

    res.json({
        sucesso: true,
        mensagem: `${total} PDFs removidos da memória`
    });
});

// ============================================================================
// API - MÉTRICAS
// ============================================================================

// Coleta todas as deliberações de todos os PDFs analisados
function coletarTodasDeliberacoes() {
    const todas = [];
    for (const pdf of pdfsProcessados) {
        if (pdf.analise && pdf.analise.deliberacoes) {
            for (const d of pdf.analise.deliberacoes) {
                todas.push({
                    ...d,
                    arquivoOrigem: pdf.nomeArquivo,
                    dataArquivo: pdf.data
                });
            }
        }
    }
    return todas;
}

// Métricas gerais (resumo do dashboard)
app.get('/api/metricas/resumo', (req, res) => {
    const deliberacoes = coletarTodasDeliberacoes();
    const analisados = pdfsProcessados.filter(p => p.analise).length;

    // Contagem por resultado
    const deferidos = deliberacoes.filter(d => d.resultado === 'Deferido').length;
    const indeferidos = deliberacoes.filter(d => d.resultado === 'Indeferido').length;

    // Contagem por tipo (pauta interna vs externa)
    const pautaInterna = deliberacoes.filter(d => d.classificacao === 'Pauta Interna da Agência' || d.interessado === 'ARTESP').length;
    const pautaExterna = deliberacoes.length - pautaInterna;

    // Microtemas únicos
    const microtemas = [...new Set(deliberacoes.map(d => d.microtema).filter(m => m))];

    // Diretores únicos
    const diretoresSet = new Set();
    deliberacoes.forEach(d => {
        (d.votos_a_favor || []).forEach(v => diretoresSet.add(v));
        (d.votos_contra || []).forEach(v => diretoresSet.add(v));
    });

    res.json({
        totalPdfs: pdfsProcessados.length,
        pdfsAnalisados: analisados,
        percentualClassificado: pdfsProcessados.length > 0 ? Math.round((analisados / pdfsProcessados.length) * 100) : 0,
        totalDeliberacoes: deliberacoes.length,
        deferidos,
        indeferidos,
        taxaDeferimento: deliberacoes.length > 0 ? Math.round((deferidos / deliberacoes.length) * 100) : 0,
        pautaInterna,
        pautaExterna,
        microtemasIdentificados: microtemas.length,
        microtemas,
        diretoresMapeados: diretoresSet.size,
        diretores: [...diretoresSet],
        ultimaAtualizacao: ultimaColeta
    });
});

// Métricas por diretor
app.get('/api/metricas/por-diretor', (req, res) => {
    const deliberacoes = coletarTodasDeliberacoes();
    const diretoresMap = {};

    deliberacoes.forEach(d => {
        const isPautaInterna = d.classificacao === 'Pauta Interna da Agência' || d.interessado === 'ARTESP';

        // Votos a favor
        (d.votos_a_favor || []).forEach(diretor => {
            if (!diretoresMap[diretor]) {
                diretoresMap[diretor] = {
                    nome: diretor,
                    totalVotos: 0,
                    votosPleitoExterno: 0,
                    votosPautaInterna: 0,
                    votosDeferido: 0,
                    votosIndeferido: 0,
                    votosFavor: 0,
                    votosContra: 0,
                    temas: {}
                };
            }
            diretoresMap[diretor].totalVotos++;
            diretoresMap[diretor].votosFavor++;
            if (isPautaInterna) {
                diretoresMap[diretor].votosPautaInterna++;
            } else {
                diretoresMap[diretor].votosPleitoExterno++;
            }
            if (d.resultado === 'Deferido') diretoresMap[diretor].votosDeferido++;
            if (d.resultado === 'Indeferido') diretoresMap[diretor].votosIndeferido++;
            if (d.microtema) {
                diretoresMap[diretor].temas[d.microtema] = (diretoresMap[diretor].temas[d.microtema] || 0) + 1;
            }
        });

        // Votos contra
        (d.votos_contra || []).forEach(diretor => {
            if (!diretoresMap[diretor]) {
                diretoresMap[diretor] = {
                    nome: diretor,
                    totalVotos: 0,
                    votosPleitoExterno: 0,
                    votosPautaInterna: 0,
                    votosDeferido: 0,
                    votosIndeferido: 0,
                    votosFavor: 0,
                    votosContra: 0,
                    temas: {}
                };
            }
            diretoresMap[diretor].totalVotos++;
            diretoresMap[diretor].votosContra++;
            if (isPautaInterna) {
                diretoresMap[diretor].votosPautaInterna++;
            } else {
                diretoresMap[diretor].votosPleitoExterno++;
            }
            if (d.microtema) {
                diretoresMap[diretor].temas[d.microtema] = (diretoresMap[diretor].temas[d.microtema] || 0) + 1;
            }
        });
    });

    // Calcula percentuais e ordena temas
    const diretores = Object.values(diretoresMap).map(d => ({
        ...d,
        percentualPleitoExterno: d.totalVotos > 0 ? Math.round((d.votosPleitoExterno / d.totalVotos) * 100) : 0,
        percentualPautaInterna: d.totalVotos > 0 ? Math.round((d.votosPautaInterna / d.totalVotos) * 100) : 0,
        taxaDeferimento: d.totalVotos > 0 ? Math.round((d.votosDeferido / d.totalVotos) * 100) : 0,
        temasOrdenados: Object.entries(d.temas)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tema, count]) => ({ tema, count }))
    }));

    res.json({ diretores });
});

// Métricas avançadas por diretor (Tendência, Votos Divergentes, Mandato)
app.get('/api/metricas/diretor-avancado', (req, res) => {
    const deliberacoes = coletarTodasDeliberacoes();

    // Dados dos mandatos dos diretores
    const mandatosConfig = {
        'André Isper Rodrigues Barnabé': { inicio: '2024-09-10', termino: '2029-09-09', cargo: 'Diretor-Presidente' },
        'Andre Isper Rodrigues Barnabe': { inicio: '2024-09-10', termino: '2029-09-09', cargo: 'Diretor-Presidente' },
        'Diego Albert Zanatto': { inicio: '2024-08-14', termino: '2029-08-13', cargo: 'Diretor' },
        'Fernanda Esbízaro Rodrigues Rudnik': { inicio: '2025-08-28', termino: '2030-08-27', cargo: 'Diretora' },
        'Fernanda Esbizaro Rodrigues Rudnik': { inicio: '2025-08-28', termino: '2030-08-27', cargo: 'Diretora' },
        'Raquel França Carneiro': { inicio: '2025-05-14', termino: '2030-05-13', cargo: 'Diretora' },
        'Raquel Franca Carneiro': { inicio: '2025-05-14', termino: '2030-05-13', cargo: 'Diretora' }
    };

    // Estrutura para análise por diretor
    const diretoresAnalise = {};

    deliberacoes.forEach(d => {
        // Extrai data da deliberação (do arquivo ou reunião)
        let dataDeliberacao = null;
        if (d.dataArquivo) {
            // Formato esperado: YYYY-MM ou similar
            const match = d.dataArquivo.match(/(\d{4})-(\d{2})/);
            if (match) {
                dataDeliberacao = new Date(match[1], parseInt(match[2]) - 1, 15);
            }
        }
        if (!dataDeliberacao && d.reuniao_ordinaria) {
            // Estima data baseado no número da reunião (aproximado)
            const numReuniao = parseInt(d.reuniao_ordinaria);
            if (numReuniao >= 1170) {
                dataDeliberacao = new Date(2025, 11, 1); // Dezembro 2025
            } else if (numReuniao >= 1150) {
                dataDeliberacao = new Date(2025, 6, 1); // Julho 2025
            } else if (numReuniao >= 1130) {
                dataDeliberacao = new Date(2025, 0, 1); // Janeiro 2025
            } else {
                dataDeliberacao = new Date(2024, 6, 1); // Julho 2024
            }
        }
        if (!dataDeliberacao) {
            dataDeliberacao = new Date(); // Fallback para hoje
        }

        const mesAno = `${dataDeliberacao.getFullYear()}-${String(dataDeliberacao.getMonth() + 1).padStart(2, '0')}`;

        // Processa votos a favor
        (d.votos_a_favor || []).forEach(diretor => {
            if (!diretoresAnalise[diretor]) {
                const mandato = mandatosConfig[diretor] || { inicio: '2024-01-01', termino: '2029-01-01', cargo: 'Diretor(a)' };
                diretoresAnalise[diretor] = {
                    nome: diretor,
                    cargo: mandato.cargo,
                    mandato: {
                        inicio: mandato.inicio,
                        termino: mandato.termino
                    },
                    votosPorMes: {},
                    votosDivergentes: 0,
                    votosAcompanhou: 0,
                    totalVotos: 0,
                    decisoesDuranteMandato: 0,
                    decisoesForaMandato: 0,
                    tendenciaPorPeriodo: {},
                    votosFavorDeferido: 0,
                    votosFavorIndeferido: 0
                };
            }

            const dir = diretoresAnalise[diretor];
            dir.totalVotos++;
            dir.votosAcompanhou++;

            // Agrupa por mês
            if (!dir.votosPorMes[mesAno]) {
                dir.votosPorMes[mesAno] = { favor: 0, contra: 0, deferidos: 0, indeferidos: 0, total: 0 };
            }
            dir.votosPorMes[mesAno].favor++;
            dir.votosPorMes[mesAno].total++;
            if (d.resultado === 'Deferido') {
                dir.votosPorMes[mesAno].deferidos++;
                dir.votosFavorDeferido++;
            }
            if (d.resultado === 'Indeferido') {
                dir.votosPorMes[mesAno].indeferidos++;
                dir.votosFavorIndeferido++;
            }

            // Verifica se está dentro do mandato
            const inicioMandato = new Date(dir.mandato.inicio);
            const terminoMandato = new Date(dir.mandato.termino);
            if (dataDeliberacao >= inicioMandato && dataDeliberacao <= terminoMandato) {
                dir.decisoesDuranteMandato++;
            } else {
                dir.decisoesForaMandato++;
            }
        });

        // Processa votos contra (votos divergentes)
        (d.votos_contra || []).forEach(diretor => {
            if (!diretoresAnalise[diretor]) {
                const mandato = mandatosConfig[diretor] || { inicio: '2024-01-01', termino: '2029-01-01', cargo: 'Diretor(a)' };
                diretoresAnalise[diretor] = {
                    nome: diretor,
                    cargo: mandato.cargo,
                    mandato: {
                        inicio: mandato.inicio,
                        termino: mandato.termino
                    },
                    votosPorMes: {},
                    votosDivergentes: 0,
                    votosAcompanhou: 0,
                    totalVotos: 0,
                    decisoesDuranteMandato: 0,
                    decisoesForaMandato: 0,
                    tendenciaPorPeriodo: {},
                    votosFavorDeferido: 0,
                    votosFavorIndeferido: 0
                };
            }

            const dir = diretoresAnalise[diretor];
            dir.totalVotos++;
            dir.votosDivergentes++; // Voto contra = divergente

            // Agrupa por mês
            if (!dir.votosPorMes[mesAno]) {
                dir.votosPorMes[mesAno] = { favor: 0, contra: 0, deferidos: 0, indeferidos: 0, total: 0 };
            }
            dir.votosPorMes[mesAno].contra++;
            dir.votosPorMes[mesAno].total++;

            // Verifica se está dentro do mandato
            const inicioMandato = new Date(dir.mandato.inicio);
            const terminoMandato = new Date(dir.mandato.termino);
            if (dataDeliberacao >= inicioMandato && dataDeliberacao <= terminoMandato) {
                dir.decisoesDuranteMandato++;
            } else {
                dir.decisoesForaMandato++;
            }
        });
    });

    // Calcula tendência decisória para cada diretor
    const diretoresComTendencia = Object.values(diretoresAnalise).map(dir => {
        // Ordena meses cronologicamente
        const mesesOrdenados = Object.keys(dir.votosPorMes).sort();

        // Calcula tendência por período (trimestre)
        const tendenciaTrimestral = {};
        mesesOrdenados.forEach(mes => {
            const ano = mes.substring(0, 4);
            const mesNum = parseInt(mes.substring(5, 7));
            const trimestre = Math.ceil(mesNum / 3);
            const chave = `${ano}-T${trimestre}`;

            if (!tendenciaTrimestral[chave]) {
                tendenciaTrimestral[chave] = { deferidos: 0, indeferidos: 0, total: 0, periodo: chave };
            }
            tendenciaTrimestral[chave].deferidos += dir.votosPorMes[mes].deferidos;
            tendenciaTrimestral[chave].indeferidos += dir.votosPorMes[mes].indeferidos;
            tendenciaTrimestral[chave].total += dir.votosPorMes[mes].total;
        });

        // Calcula taxa de deferimento por trimestre
        const tendenciaArray = Object.values(tendenciaTrimestral).map(t => ({
            ...t,
            taxaDeferimento: t.total > 0 ? Math.round((t.deferidos / t.total) * 100) : 0
        })).sort((a, b) => a.periodo.localeCompare(b.periodo));

        // Identifica tendência geral (crescente, estável, decrescente)
        let tendenciaGeral = 'estável';
        if (tendenciaArray.length >= 2) {
            const primeiros = tendenciaArray.slice(0, Math.ceil(tendenciaArray.length / 2));
            const ultimos = tendenciaArray.slice(Math.ceil(tendenciaArray.length / 2));
            const mediaPrimeiros = primeiros.reduce((s, t) => s + t.taxaDeferimento, 0) / primeiros.length;
            const mediaUltimos = ultimos.reduce((s, t) => s + t.taxaDeferimento, 0) / ultimos.length;

            if (mediaUltimos > mediaPrimeiros + 5) {
                tendenciaGeral = 'crescente';
            } else if (mediaUltimos < mediaPrimeiros - 5) {
                tendenciaGeral = 'decrescente';
            }
        }

        // Evolução mensal
        const evolucaoMensal = mesesOrdenados.map(mes => ({
            mes,
            ...dir.votosPorMes[mes],
            taxaDeferimento: dir.votosPorMes[mes].total > 0
                ? Math.round((dir.votosPorMes[mes].deferidos / dir.votosPorMes[mes].total) * 100)
                : 0
        }));

        return {
            nome: dir.nome,
            cargo: dir.cargo,
            mandato: dir.mandato,
            metricas: {
                totalVotos: dir.totalVotos,
                votosDivergentes: dir.votosDivergentes,
                votosAcompanhou: dir.votosAcompanhou,
                percentualDivergencia: dir.totalVotos > 0
                    ? Math.round((dir.votosDivergentes / dir.totalVotos) * 100)
                    : 0,
                decisoesDuranteMandato: dir.decisoesDuranteMandato,
                decisoesForaMandato: dir.decisoesForaMandato,
                taxaDeferimentoGeral: dir.totalVotos > 0
                    ? Math.round((dir.votosFavorDeferido / dir.totalVotos) * 100)
                    : 0
            },
            tendencia: {
                geral: tendenciaGeral,
                porTrimestre: tendenciaArray,
                evolucaoMensal
            }
        };
    }).filter(d => d.metricas.totalVotos > 0);

    // Estatísticas agregadas
    const estatisticasGerais = {
        totalDiretoresAnalisados: diretoresComTendencia.length,
        totalVotosDivergentesGeral: diretoresComTendencia.reduce((s, d) => s + d.metricas.votosDivergentes, 0),
        mediaTaxaDeferimento: Math.round(
            diretoresComTendencia.reduce((s, d) => s + d.metricas.taxaDeferimentoGeral, 0) /
            (diretoresComTendencia.length || 1)
        ),
        diretoresMaisDivergentes: [...diretoresComTendencia]
            .sort((a, b) => b.metricas.votosDivergentes - a.metricas.votosDivergentes)
            .slice(0, 5)
            .map(d => ({ nome: d.nome, divergentes: d.metricas.votosDivergentes })),
        diretoresTendenciaCrescente: diretoresComTendencia.filter(d => d.tendencia.geral === 'crescente').length,
        diretoresTendenciaDecrescente: diretoresComTendencia.filter(d => d.tendencia.geral === 'decrescente').length,
        diretoresTendenciaEstavel: diretoresComTendencia.filter(d => d.tendencia.geral === 'estável').length
    };

    res.json({
        diretores: diretoresComTendencia,
        estatisticas: estatisticasGerais,
        atualizadoEm: new Date().toISOString()
    });
});

// Métricas por tema
app.get('/api/metricas/por-tema', (req, res) => {
    const deliberacoes = coletarTodasDeliberacoes();
    const temasMap = {};

    deliberacoes.forEach(d => {
        const tema = d.microtema || 'Não classificado';
        if (!temasMap[tema]) {
            temasMap[tema] = {
                tema,
                total: 0,
                deferidos: 0,
                indeferidos: 0,
                porMes: {}
            };
        }
        temasMap[tema].total++;
        if (d.resultado === 'Deferido') temasMap[tema].deferidos++;
        if (d.resultado === 'Indeferido') temasMap[tema].indeferidos++;

        // Agrupa por mês (usando data do arquivo)
        const mes = d.dataArquivo || 'Sem data';
        temasMap[tema].porMes[mes] = (temasMap[tema].porMes[mes] || 0) + 1;
    });

    const temas = Object.values(temasMap).map(t => ({
        ...t,
        taxaDeferimento: t.total > 0 ? Math.round((t.deferidos / t.total) * 100) : 0,
        taxaIndeferimento: t.total > 0 ? Math.round((t.indeferidos / t.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);

    // Tema com mais deferimento
    const temaMaisDeferido = [...temas].sort((a, b) => b.taxaDeferimento - a.taxaDeferimento)[0];
    // Tema com mais indeferimento
    const temaMaisIndeferido = [...temas].sort((a, b) => b.taxaIndeferimento - a.taxaIndeferimento)[0];

    res.json({
        temas,
        temaMaisDeferido,
        temaMaisIndeferido,
        totalTemas: temas.length
    });
});

// Métricas institucionais
app.get('/api/metricas/institucional', (req, res) => {
    const deliberacoes = coletarTodasDeliberacoes();

    // Reuniões únicas
    const reunioes = [...new Set(deliberacoes.map(d => d.reuniao_ordinaria).filter(r => r))];

    // Pauta interna vs externa
    const pautaInterna = deliberacoes.filter(d => d.classificacao === 'Pauta Interna da Agência' || d.interessado === 'ARTESP').length;
    const pautaExterna = deliberacoes.length - pautaInterna;

    res.json({
        totalReunioes: reunioes.length,
        reunioes: reunioes.sort((a, b) => parseInt(b) - parseInt(a)),
        pautaInterna,
        pautaExterna,
        percentualPautaInterna: deliberacoes.length > 0 ? Math.round((pautaInterna / deliberacoes.length) * 100) : 0,
        percentualPautaExterna: deliberacoes.length > 0 ? Math.round((pautaExterna / deliberacoes.length) * 100) : 0,
        totalDeliberacoes: deliberacoes.length
    });
});

// Métricas competitivas (análise avançada)
app.get('/api/metricas/competitivo', (req, res) => {
    const deliberacoes = coletarTodasDeliberacoes();

    // Matriz tema x diretor x decisão
    const matriz = {};
    deliberacoes.forEach(d => {
        const tema = d.microtema || 'Outros';
        if (!matriz[tema]) matriz[tema] = {};

        [...(d.votos_a_favor || []), ...(d.votos_contra || [])].forEach(diretor => {
            if (!matriz[tema][diretor]) {
                matriz[tema][diretor] = { deferidos: 0, indeferidos: 0, total: 0 };
            }
            matriz[tema][diretor].total++;
            if (d.resultado === 'Deferido') matriz[tema][diretor].deferidos++;
            if (d.resultado === 'Indeferido') matriz[tema][diretor].indeferidos++;
        });
    });

    // Comparação entre diretores
    const diretoresMap = {};
    deliberacoes.forEach(d => {
        [...(d.votos_a_favor || [])].forEach(diretor => {
            if (!diretoresMap[diretor]) diretoresMap[diretor] = { favor: 0, contra: 0, total: 0 };
            diretoresMap[diretor].favor++;
            diretoresMap[diretor].total++;
        });
        [...(d.votos_contra || [])].forEach(diretor => {
            if (!diretoresMap[diretor]) diretoresMap[diretor] = { favor: 0, contra: 0, total: 0 };
            diretoresMap[diretor].contra++;
            diretoresMap[diretor].total++;
        });
    });

    const comparacaoDiretores = Object.entries(diretoresMap).map(([nome, dados]) => ({
        nome,
        ...dados,
        taxaFavor: dados.total > 0 ? Math.round((dados.favor / dados.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);

    res.json({
        matrizTemaDiretor: matriz,
        comparacaoDiretores,
        totalDeliberacoes: deliberacoes.length
    });
});

// Exportar todas as deliberações como JSON
app.get('/api/metricas/exportar', (req, res) => {
    const deliberacoes = coletarTodasDeliberacoes();
    res.json({
        exportadoEm: new Date().toISOString(),
        total: deliberacoes.length,
        deliberations: deliberacoes
    });
});


// ============================================================================
// INTERFACE WEB UNIFICADA - Redireciona para SPA
// ============================================================================

app.get('/', (req, res) => {
    res.redirect('/metricas');
});


// ============================================================================
// PLATAFORMA IRIS - Single Page Application (SPA)
// ============================================================================

// SPA - Todas as rotas de navegação servem o mesmo arquivo
const spaRoutes = ['/deliberacoes', '/monitor', '/diretores', '/jurimetria', '/governanca', '/metricas', '/boletim', '/auditoria', '/app', '/upload', '/analise', '/agencias', '/mapa', '/radar', '/painel-regulatorio', '/setores', '/microtemas', '/empresas', '/historico', '/grafo', '/monitoramento', '/dossie', '/cruzamento', '/hub'];

spaRoutes.forEach(route => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'app.html'));
    });
});

// ============================================================================
// API - GRAFO DE VÍNCULOS (dados reais dos PDFs)
// ============================================================================
app.get('/api/grafo-data', (req, res) => {
    const deliberacoes = coletarTodasDeliberacoes();
    const nodesMap = {};
    const edgesMap = {};

    // Central agency node
    nodesMap['ARTESP'] = {
        id: 'ARTESP', label: 'ARTESP', full: 'Agência de Transporte do Estado de SP',
        type: 'agency', deliberations: deliberacoes.length
    };

    deliberacoes.forEach(d => {
        const allVoters = [...(d.votos_a_favor || []), ...(d.votos_contra || [])];

        // Directors
        allVoters.forEach(dir => {
            if (!nodesMap[dir]) {
                nodesMap[dir] = { id: dir, label: dir, type: 'director', votesCount: 0, role: 'Diretor(a)' };
            }
            nodesMap[dir].votesCount++;
            const ek = `ARTESP||${dir}`;
            if (!edgesMap[ek]) edgesMap[ek] = { source: 'ARTESP', target: dir, label: 'Membro', count: 0, type: 'membro' };
            edgesMap[ek].count++;
        });

        // Companies from interessado
        if (d.interessado && d.interessado !== 'ARTESP' && d.interessado.length > 2) {
            const comp = d.interessado;
            if (!nodesMap[comp]) nodesMap[comp] = { id: comp, label: comp, type: 'company', mentions: 0 };
            nodesMap[comp].mentions = (nodesMap[comp].mentions || 0) + 1;

            allVoters.forEach(dir => {
                const ek = `${dir}||${comp}`;
                if (!edgesMap[ek]) edgesMap[ek] = { source: dir, target: comp, label: 'Deliberação', count: 0, type: 'deliberacao' };
                edgesMap[ek].count++;
            });
        }

        // Themes from microtema (singular) and microtemas (array)
        const temas = d.microtemas && d.microtemas.length > 0 ? d.microtemas : (d.microtema ? [d.microtema] : []);
        temas.forEach(theme => {
            if (!theme || theme.length < 2) return;
            if (!nodesMap[theme]) nodesMap[theme] = { id: theme, label: theme, type: 'theme', count: 0 };
            nodesMap[theme].count = (nodesMap[theme].count || 0) + 1;

            // Theme ↔ Director edges
            allVoters.forEach(dir => {
                const ek = `${dir}||${theme}`;
                if (!edgesMap[ek]) edgesMap[ek] = { source: dir, target: theme, label: 'Votou sobre', count: 0, type: 'tema_voto' };
                edgesMap[ek].count++;
            });

            // Theme ↔ Company edges
            if (d.interessado && d.interessado !== 'ARTESP' && d.interessado.length > 2) {
                const ek = `${d.interessado}||${theme}`;
                if (!edgesMap[ek]) edgesMap[ek] = { source: d.interessado, target: theme, label: 'Relacionado a', count: 0, type: 'tema_empresa' };
                edgesMap[ek].count++;
            }
        });
    });

    // Add detected companies from PDFs
    pdfsProcessados.forEach(pdf => {
        (pdf.empresasDetectadas || []).forEach(emp => {
            if (!nodesMap[emp.nome]) {
                nodesMap[emp.nome] = { id: emp.nome, label: emp.nome, type: 'company', sector: emp.setor, companyType: emp.tipo, mentions: emp.mencoes };
            } else {
                nodesMap[emp.nome].sector = nodesMap[emp.nome].sector || emp.setor;
                nodesMap[emp.nome].companyType = nodesMap[emp.nome].companyType || emp.tipo;
            }
        });
    });

    // Calculate edge strength based on count (normalized 0-1)
    const allEdges = Object.values(edgesMap);
    const maxCount = Math.max(1, ...allEdges.map(e => e.count));
    allEdges.forEach(e => {
        e.strength = Math.max(0.15, e.count / maxCount);
        if (e.count > 1) e.label = `${e.label} (${e.count}x)`;
    });

    res.json({
        success: true,
        nodes: Object.values(nodesMap),
        edges: allEdges,
        meta: { totalDeliberacoes: deliberacoes.length, totalPdfs: pdfsProcessados.length, pdfsAnalisados: pdfsProcessados.filter(p => p.analise).length }
    });
});

// ============================================================================
// API: DOSSIÊ AUTOMÁTICO POR ENTIDADE (Estilo Sherlocker)
// ============================================================================
app.get('/api/dossie/:entidade', (req, res) => {
    const entidadeNome = decodeURIComponent(req.params.entidade);
    const deliberacoes = coletarTodasDeliberacoes();

    // Identify entity type
    const DIRETORES = ['André Isper', 'Diego Albert', 'Fernanda Esbizaro', 'Raquel França', 'Milton Persoli', 'Sergio Massaru', 'Carlos Eduardo', 'Antonio Carlos', 'Flavio Augusto'];
    const isDiretor = DIRETORES.some(d => entidadeNome.includes(d)) ||
                      deliberacoes.some(dl => [...(dl.votos_a_favor || []), ...(dl.votos_contra || [])].includes(entidadeNome));
    const tipo = entidadeNome === 'ARTESP' ? 'agencia' : isDiretor ? 'diretor' : 'empresa';

    // Filter relevant deliberations
    let delibsRelevantes = [];
    if (tipo === 'diretor') {
        delibsRelevantes = deliberacoes.filter(d =>
            [...(d.votos_a_favor || []), ...(d.votos_contra || [])].includes(entidadeNome)
        );
    } else if (tipo === 'empresa') {
        delibsRelevantes = deliberacoes.filter(d =>
            d.interessado && d.interessado.toLowerCase().includes(entidadeNome.toLowerCase())
        );
    } else {
        delibsRelevantes = deliberacoes;
    }

    // Timeline — group by date
    const timeline = {};
    delibsRelevantes.forEach(d => {
        const data = d.data_reuniao || d.dataArquivo || 'Sem data';
        if (!timeline[data]) timeline[data] = [];
        timeline[data].push({
            numero: d.numero_deliberacao || '',
            resultado: d.resultado || '',
            interessado: d.interessado || '',
            microtema: d.microtema || '',
            confianca: d.confianca || 0
        });
    });

    // Connected entities
    const entidadesConectadas = { diretores: {}, empresas: {}, temas: {} };
    delibsRelevantes.forEach(d => {
        const voters = [...(d.votos_a_favor || []), ...(d.votos_contra || [])];
        voters.forEach(v => {
            if (v !== entidadeNome) {
                entidadesConectadas.diretores[v] = (entidadesConectadas.diretores[v] || 0) + 1;
            }
        });
        if (d.interessado && d.interessado !== entidadeNome && d.interessado !== 'ARTESP' && d.interessado.length > 2) {
            entidadesConectadas.empresas[d.interessado] = (entidadesConectadas.empresas[d.interessado] || 0) + 1;
        }
        const temas = d.microtemas && d.microtemas.length > 0 ? d.microtemas : (d.microtema ? [d.microtema] : []);
        temas.forEach(t => {
            entidadesConectadas.temas[t] = (entidadesConectadas.temas[t] || 0) + 1;
        });
    });

    // Voting pattern analysis (for directors)
    let padraoVotos = null;
    if (tipo === 'diretor') {
        const aFavor = deliberacoes.filter(d => (d.votos_a_favor || []).includes(entidadeNome)).length;
        const contra = deliberacoes.filter(d => (d.votos_contra || []).includes(entidadeNome)).length;
        const total = aFavor + contra;
        const deferidos = delibsRelevantes.filter(d => d.resultado === 'Deferido').length;
        const indeferidos = delibsRelevantes.filter(d => d.resultado === 'Indeferido').length;
        padraoVotos = { aFavor, contra, total, deferidos, indeferidos, taxaDeferimento: total > 0 ? Math.round((deferidos / total) * 100) : 0 };
    }

    // Risk alerts
    const alertas = [];
    if (tipo === 'empresa') {
        const indeferidos = delibsRelevantes.filter(d => d.resultado === 'Indeferido');
        if (indeferidos.length > 3) alertas.push({ nivel: 'alto', mensagem: `${indeferidos.length} deliberações indeferidas`, detalhe: 'Volume acima do normal de decisões negativas' });
        const baixaConfianca = delibsRelevantes.filter(d => (d.confianca || 0) < 50);
        if (baixaConfianca.length > delibsRelevantes.length * 0.3) alertas.push({ nivel: 'medio', mensagem: `${baixaConfianca.length} extrações com baixa confiança`, detalhe: 'Verifique manualmente estas deliberações' });
    }
    if (tipo === 'diretor') {
        const votosContra = deliberacoes.filter(d => (d.votos_contra || []).includes(entidadeNome));
        if (votosContra.length > 5) alertas.push({ nivel: 'medio', mensagem: `${votosContra.length} votos contrários registrados`, detalhe: 'Padrão divergente detectado' });
    }
    if (delibsRelevantes.length === 0) alertas.push({ nivel: 'info', mensagem: 'Nenhuma deliberação encontrada', detalhe: 'Faça upload de PDFs para gerar o dossiê' });

    // Stats summary
    const resumo = {
        totalDeliberacoes: delibsRelevantes.length,
        deferidos: delibsRelevantes.filter(d => d.resultado === 'Deferido').length,
        indeferidos: delibsRelevantes.filter(d => d.resultado === 'Indeferido').length,
        confiancaMedia: delibsRelevantes.length > 0 ? Math.round(delibsRelevantes.reduce((s, d) => s + (d.confianca || 0), 0) / delibsRelevantes.length) : 0,
        primeiraData: delibsRelevantes.map(d => d.data_reuniao).filter(Boolean).sort()[0] || null,
        ultimaData: delibsRelevantes.map(d => d.data_reuniao).filter(Boolean).sort().pop() || null,
        totalConexoes: Object.keys(entidadesConectadas.diretores).length + Object.keys(entidadesConectadas.empresas).length + Object.keys(entidadesConectadas.temas).length
    };

    res.json({
        success: true,
        entidade: entidadeNome,
        tipo,
        resumo,
        timeline: Object.entries(timeline).sort(([a], [b]) => b.localeCompare(a)).map(([data, itens]) => ({ data, itens })),
        conexoes: {
            diretores: Object.entries(entidadesConectadas.diretores).map(([nome, count]) => ({ nome, deliberacoes: count })).sort((a, b) => b.deliberacoes - a.deliberacoes),
            empresas: Object.entries(entidadesConectadas.empresas).map(([nome, count]) => ({ nome, deliberacoes: count })).sort((a, b) => b.deliberacoes - a.deliberacoes),
            temas: Object.entries(entidadesConectadas.temas).map(([nome, count]) => ({ nome, ocorrencias: count })).sort((a, b) => b.ocorrencias - a.ocorrencias)
        },
        padraoVotos,
        alertas,
        geradoEm: new Date().toISOString()
    });
});

// API: Listar entidades disponíveis para dossiê
app.get('/api/dossie-entidades', (req, res) => {
    const deliberacoes = coletarTodasDeliberacoes();
    const diretores = new Set();
    const empresas = new Set();

    deliberacoes.forEach(d => {
        [...(d.votos_a_favor || []), ...(d.votos_contra || [])].forEach(v => diretores.add(v));
        if (d.interessado && d.interessado !== 'ARTESP' && d.interessado.length > 2) empresas.add(d.interessado);
    });

    res.json({
        success: true,
        entidades: [
            { nome: 'ARTESP', tipo: 'agencia', deliberacoes: deliberacoes.length },
            ...[...diretores].map(d => ({ nome: d, tipo: 'diretor', deliberacoes: deliberacoes.filter(dl => [...(dl.votos_a_favor || []), ...(dl.votos_contra || [])].includes(d)).length })),
            ...[...empresas].map(e => ({ nome: e, tipo: 'empresa', deliberacoes: deliberacoes.filter(dl => dl.interessado === e).length }))
        ].sort((a, b) => b.deliberacoes - a.deliberacoes)
    });
});

// ============================================================================
// APIs PARA DELIBERAÇÕES
// ============================================================================

// Lista todas as deliberações extraídas
app.get('/api/deliberacoes', (req, res) => {
    // Extrai deliberações de todos os PDFs analisados
    const deliberacoes = [];

    pdfsProcessados.forEach((pdf, pdfIndex) => {
        if (pdf.analise && pdf.analise.deliberacoes) {
            pdf.analise.deliberacoes.forEach((delib, delibIndex) => {
                deliberacoes.push({
                    id: `${pdfIndex}-${delibIndex}`,
                    pdf_nome: pdf.nomeArquivo,
                    processo: delib.numero_deliberacao || delib.processo || '',
                    interessado: delib.interessado || '',
                    microtema: delib.microtema || delib.classificacao || '',
                    decisao: delib.resultado || '',
                    pauta_interna: delib.classificacao === 'Ato Interno',
                    numero_reuniao: delib.reuniao_ordinaria || '',
                    data_reuniao: pdf.data || '',
                    votos_favor: delib.votos_a_favor || [],
                    votos_contra: delib.votos_contra || []
                });
            });
        }
    });

    res.json({
        total: deliberacoes.length,
        deliberacoes
    });
});

// ============================================================================
// APIs PARA REUNIÕES MONITORADAS
// ============================================================================

// Armazena reuniões monitoradas
let reunioesMonitoradas = [];

app.get('/api/reunioes-monitoradas', (req, res) => {
    res.json({
        total: reunioesMonitoradas.length,
        reunioes: reunioesMonitoradas
    });
});

app.post('/api/reunioes-monitoradas', (req, res) => {
    const { url, tipo } = req.body;

    if (!url) {
        return res.status(400).json({ erro: 'URL é obrigatória' });
    }

    const novaReuniao = {
        id: Date.now().toString(),
        url_origem: url,
        tipo: tipo || 'deliberacao',
        status: 'pendente',
        progresso: 0,
        tentativas: 0,
        created_at: new Date().toISOString()
    };

    reunioesMonitoradas.push(novaReuniao);

    res.json({
        sucesso: true,
        mensagem: 'Reunião adicionada para monitoramento',
        reuniao: novaReuniao
    });
});

app.post('/api/reunioes-monitoradas/:id/processar', async (req, res) => {
    const { id } = req.params;
    const reuniao = reunioesMonitoradas.find(r => r.id === id);

    if (!reuniao) {
        return res.status(404).json({ erro: 'Reunião não encontrada' });
    }

    // Simula início do processamento
    reuniao.status = 'processando';
    reuniao.progresso = 10;
    reuniao.tentativas++;

    // Em produção, aqui seria chamada a função de processamento real
    res.json({
        sucesso: true,
        mensagem: 'Processamento iniciado',
        reuniao
    });
});

app.delete('/api/reunioes-monitoradas/:id', (req, res) => {
    const { id } = req.params;
    const index = reunioesMonitoradas.findIndex(r => r.id === id);

    if (index === -1) {
        return res.status(404).json({ erro: 'Reunião não encontrada' });
    }

    reunioesMonitoradas.splice(index, 1);

    res.json({
        sucesso: true,
        mensagem: 'Reunião removida'
    });
});

// Código antigo da página de métricas removido - agora serve arquivo estático
// ============================================================================

/*
Removido código inline da página de métricas.
Agora serve: public/metricas.html
*/

/* CÓDIGO ANTIGO DESATIVADO:
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IRIS Platform - Metricas</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            color: #e4e4e4;
        }
        .header {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #1a3a5c;
        }
        .header h1 {
            font-size: 1.8em;
            background: linear-gradient(90deg, #c9a227, #e8c547);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .header nav a {
            color: #c9a227;
            text-decoration: none;
            margin-left: 20px;
            padding: 8px 15px;
            border-radius: 20px;
            background: rgba(0,212,255,0.1);
            transition: all 0.3s;
        }
        .header nav a:hover { background: rgba(0,212,255,0.2); }
        .container {
            padding: 30px;
            max-width: 1600px;
            margin: 0 auto;
        }
        .section-title {
            color: #c9a227;
            font-size: 1.3em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border: 1px solid #1a3a5c;
        }
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .metric-card {
            background: #1a1a2e;
            border-radius: 15px;
            padding: 20px;
            border-left: 4px solid #c9a227;
        }
        .metric-card h3 {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        .metric-card .value {
            font-size: 2.5em;
            font-weight: 700;
            color: #c9a227;
        }
        .metric-card .value.green { color: #4ade80; }
        .metric-card .value.red { color: #f87171; }
        .metric-card .value.purple { color: #c084fc; }
        .metric-card .subtitle {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        .chart-container {
            background: #1a1a2e;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .chart-title {
            color: #c9a227;
            font-size: 1em;
            margin-bottom: 15px;
        }
        .bar-chart {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .bar-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .bar-label {
            width: 120px;
            font-size: 13px;
            color: #888;
        }
        .bar-track {
            flex: 1;
            height: 24px;
            background: #0a1628;
            border-radius: 12px;
            overflow: hidden;
        }
        .bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #c9a227, #4ade80);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            font-size: 12px;
            font-weight: 600;
        }
        .bar-fill.red { background: linear-gradient(90deg, #f87171, #fbbf24); }
        .director-card {
            background: #0a1628;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .director-name {
            font-weight: 600;
            color: #c9a227;
            margin-bottom: 10px;
        }
        .director-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }
        .director-stat {
            text-align: center;
        }
        .director-stat .label {
            font-size: 10px;
            color: #666;
        }
        .director-stat .value {
            font-size: 1.2em;
            font-weight: 600;
        }
        .pie-chart {
            display: flex;
            align-items: center;
            gap: 30px;
        }
        .pie-visual {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            position: relative;
        }
        .pie-legend {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
        }
        .two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        @media (max-width: 900px) {
            .two-columns { grid-template-columns: 1fr; }
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .loading {
            text-align: center;
            padding: 40px;
        }
        .loading::after {
            content: '';
            display: inline-block;
            width: 30px;
            height: 30px;
            border: 1px solid #1a3a5c;
            border-top-color: #c9a227;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .table-container {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #1a3a5c;
        }
        th {
            color: #888;
            font-size: 11px;
            text-transform: uppercase;
        }
        td {
            font-size: 13px;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            background: #c9a227;
            color: #000;
            font-weight: 600;
        }
        .btn:hover {
            background: #00b8e6;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>IRIS Metricas</h1>
        <nav>
            <a href="/">Analise PDFs</a>
            <a href="/metricas">Metricas</a>
        </nav>
    </div>

    <div class="container">
        <div id="content">
            <div class="loading"></div>
        </div>
    </div>

    <script>
        async function carregarMetricas() {
            try {
                const [resumo, porDiretor, porTema, institucional] = await Promise.all([
                    fetch('/api/metricas/resumo').then(r => r.json()),
                    fetch('/api/metricas/por-diretor').then(r => r.json()),
                    fetch('/api/metricas/por-tema').then(r => r.json()),
                    fetch('/api/metricas/institucional').then(r => r.json())
                ]);

                renderMetricas(resumo, porDiretor, porTema, institucional);
            } catch (e) {
                document.getElementById('content').innerHTML =
                    '<div class="empty-state"><p>Erro ao carregar metricas: ' + e.message + '</p></div>';
            }
        }

        function renderMetricas(resumo, porDiretor, porTema, institucional) {
            if (resumo.totalDeliberacoes === 0) {
                document.getElementById('content').innerHTML = \\\`
                    <div class="empty-state">
                        <h2 style="color: #c9a227; margin-bottom: 20px;">Nenhuma deliberacao analisada</h2>
                        <p>Faca upload de PDFs e analise-os para ver as metricas.</p>
                        <a href="/" class="btn" style="display: inline-block; margin-top: 20px; text-decoration: none;">Ir para Analise</a>
                    </div>
                \\\`;
                return;
            }

            let html = '';

            // SEÇÃO 1: MÉTRICAS DE VALOR REGULATÓRIO
            html += '<h2 class="section-title">Metricas de Valor Regulatorio</h2>';
            html += '<div class="cards-grid">';
            html += \\\`
                <div class="metric-card">
                    <h3>Deliberacoes Processadas</h3>
                    <div class="value">\\\${resumo.totalDeliberacoes}</div>
                </div>
                <div class="metric-card">
                    <h3>PDFs Analisados</h3>
                    <div class="value">\\\${resumo.pdfsAnalisados}</div>
                    <div class="subtitle">de \\\${resumo.totalPdfs} carregados</div>
                </div>
                <div class="metric-card">
                    <h3>% Classificadas</h3>
                    <div class="value green">\\\${resumo.percentualClassificado}%</div>
                </div>
                <div class="metric-card">
                    <h3>Microtemas</h3>
                    <div class="value purple">\\\${resumo.microtemasIdentificados}</div>
                </div>
                <div class="metric-card">
                    <h3>Deferidos</h3>
                    <div class="value green">\\\${resumo.deferidos}</div>
                    <div class="subtitle">\\\${resumo.taxaDeferimento}% do total</div>
                </div>
                <div class="metric-card">
                    <h3>Indeferidos</h3>
                    <div class="value red">\\\${resumo.indeferidos}</div>
                </div>
                <div class="metric-card">
                    <h3>Diretores Mapeados</h3>
                    <div class="value">\\\${resumo.diretoresMapeados}</div>
                </div>
                <div class="metric-card">
                    <h3>Pauta Externa</h3>
                    <div class="value">\\\${resumo.pautaExterna}</div>
                    <div class="subtitle">pleitos de terceiros</div>
                </div>
            \\\`;
            html += '</div>';

            // SEÇÃO 2: DEFERIDO VS INDEFERIDO (gráfico)
            html += '<div class="two-columns">';

            // Gráfico de decisões
            const totalDecisoes = resumo.deferidos + resumo.indeferidos;
            const pctDeferido = totalDecisoes > 0 ? Math.round((resumo.deferidos / totalDecisoes) * 100) : 0;
            html += \\\`
                <div class="chart-container">
                    <div class="chart-title">Resultado das Deliberacoes</div>
                    <div class="bar-chart">
                        <div class="bar-item">
                            <span class="bar-label">Deferidos</span>
                            <div class="bar-track">
                                <div class="bar-fill" style="width: \\\${pctDeferido}%">\\\${resumo.deferidos}</div>
                            </div>
                        </div>
                        <div class="bar-item">
                            <span class="bar-label">Indeferidos</span>
                            <div class="bar-track">
                                <div class="bar-fill red" style="width: \\\${100 - pctDeferido}%">\\\${resumo.indeferidos}</div>
                            </div>
                        </div>
                    </div>
                </div>
            \\\`;

            // Gráfico pauta interna vs externa
            const totalPauta = institucional.pautaInterna + institucional.pautaExterna;
            html += \\\`
                <div class="chart-container">
                    <div class="chart-title">Pauta Interna vs Externa</div>
                    <div class="bar-chart">
                        <div class="bar-item">
                            <span class="bar-label">Pauta Externa</span>
                            <div class="bar-track">
                                <div class="bar-fill" style="width: \\\${institucional.percentualPautaExterna}%">\\\${institucional.pautaExterna}</div>
                            </div>
                        </div>
                        <div class="bar-item">
                            <span class="bar-label">Pauta Interna</span>
                            <div class="bar-track">
                                <div class="bar-fill" style="width: \\\${institucional.percentualPautaInterna}%; background: linear-gradient(90deg, #c084fc, #a855f7);">\\\${institucional.pautaInterna}</div>
                            </div>
                        </div>
                    </div>
                </div>
            \\\`;
            html += '</div>';

            // SEÇÃO 3: MÉTRICAS POR TEMA
            html += '<h2 class="section-title">Metricas por Tema</h2>';
            html += '<div class="chart-container">';
            html += '<div class="chart-title">Temas Mais Recorrentes</div>';
            html += '<div class="bar-chart">';
            const maxTema = porTema.temas[0]?.total || 1;
            porTema.temas.slice(0, 8).forEach(t => {
                const pct = Math.round((t.total / maxTema) * 100);
                html += \\\`
                    <div class="bar-item">
                        <span class="bar-label">\\\${t.tema}</span>
                        <div class="bar-track">
                            <div class="bar-fill" style="width: \\\${pct}%">\\\${t.total} (\\\${t.taxaDeferimento}% def)</div>
                        </div>
                    </div>
                \\\`;
            });
            html += '</div></div>';

            // Cards de tema destaque
            if (porTema.temaMaisDeferido || porTema.temaMaisIndeferido) {
                html += '<div class="cards-grid" style="grid-template-columns: repeat(2, 1fr);">';
                if (porTema.temaMaisDeferido) {
                    html += \\\`
                        <div class="metric-card" style="border-left-color: #4ade80;">
                            <h3>Tema com Mais Deferimento</h3>
                            <div class="value green">\\\${porTema.temaMaisDeferido.tema}</div>
                            <div class="subtitle">\\\${porTema.temaMaisDeferido.taxaDeferimento}% de deferimento</div>
                        </div>
                    \\\`;
                }
                if (porTema.temaMaisIndeferido) {
                    html += \\\`
                        <div class="metric-card" style="border-left-color: #f87171;">
                            <h3>Tema com Mais Indeferimento</h3>
                            <div class="value red">\\\${porTema.temaMaisIndeferido.tema}</div>
                            <div class="subtitle">\\\${porTema.temaMaisIndeferido.taxaIndeferimento}% de indeferimento</div>
                        </div>
                    \\\`;
                }
                html += '</div>';
            }

            // SEÇÃO 4: MÉTRICAS POR DIRETOR
            html += '<h2 class="section-title">Metricas por Diretor</h2>';
            if (porDiretor.diretores.length === 0) {
                html += '<div class="empty-state"><p>Nenhum diretor identificado nas deliberacoes</p></div>';
            } else {
                html += '<div class="table-container"><table>';
                html += '<thead><tr><th>Diretor</th><th>Total Votos</th><th>A Favor</th><th>Contra</th><th>% Pleito Externo</th><th>Taxa Deferimento</th><th>Top Temas</th></tr></thead>';
                html += '<tbody>';
                porDiretor.diretores.forEach(d => {
                    const topTemas = d.temasOrdenados.slice(0, 3).map(t => t.tema).join(', ');
                    html += \\\`
                        <tr>
                            <td style="color: #c9a227; font-weight: 600;">\\\${d.nome}</td>
                            <td>\\\${d.totalVotos}</td>
                            <td style="color: #4ade80;">\\\${d.votosFavor}</td>
                            <td style="color: #f87171;">\\\${d.votosContra}</td>
                            <td>\\\${d.percentualPleitoExterno}%</td>
                            <td>\\\${d.taxaDeferimento}%</td>
                            <td style="color: #888; font-size: 11px;">\\\${topTemas || '-'}</td>
                        </tr>
                    \\\`;
                });
                html += '</tbody></table></div>';
            }

            // SEÇÃO 5: MÉTRICAS INSTITUCIONAIS
            html += '<h2 class="section-title">Metricas Institucionais</h2>';
            html += '<div class="cards-grid" style="grid-template-columns: repeat(4, 1fr);">';
            html += \\\`
                <div class="metric-card">
                    <h3>Total Reunioes</h3>
                    <div class="value">\\\${institucional.totalReunioes}</div>
                </div>
                <div class="metric-card">
                    <h3>Deliberacoes</h3>
                    <div class="value">\\\${institucional.totalDeliberacoes}</div>
                </div>
                <div class="metric-card">
                    <h3>% Pauta Externa</h3>
                    <div class="value green">\\\${institucional.percentualPautaExterna}%</div>
                </div>
                <div class="metric-card">
                    <h3>% Pauta Interna</h3>
                    <div class="value purple">\\\${institucional.percentualPautaInterna}%</div>
                </div>
            \\\`;
            html += '</div>';

            // Botão de exportar
            html += \\\`
                <div style="text-align: center; margin-top: 40px;">
                    <button class="btn" onclick="exportarDados()">Exportar Dados (JSON)</button>
                </div>
            \\\`;

            document.getElementById('content').innerHTML = html;
        }

        async function exportarDados() {
            const res = await fetch('/api/metricas/exportar');
            const data = await res.json();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'iris_metricas_' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        carregarMetricas();
    </script>
</body>
</html>
FIM DO CÓDIGO ANTIGO DESATIVADO */

// ============================================================================
// BASE DE DADOS PÚBLICA - AGÊNCIAS REGULADORAS E DIRETORES
// Fonte: Portais de transparência, DOU, sites oficiais das agências
// LGPD Art. 7º, II e III — Dados públicos de agentes públicos no exercício
// de suas funções. Nomes, cargos e mandatos são informações de domínio público.
// ============================================================================

// ============================================================================
// BASE DE DADOS: AGÊNCIAS REGULADORAS E DIRIGENTES
// Fonte: Diário Oficial da União, portais gov.br, Lei de Acesso à Informação
// LGPD Art. 7º, II e III — dados públicos de agentes públicos
// Verificado: fevereiro/2026 via portais oficiais
// Nota: Houve grande renovação de diretorias em ago-set/2025
// ============================================================================
const AGENCIAS_REGULADORAS = {
    'ANEEL': {
        nome: 'Agência Nacional de Energia Elétrica',
        sigla: 'ANEEL',
        esfera: 'federal',
        setor: 'Energia Elétrica',
        site: 'https://www.gov.br/aneel',
        lei_criacao: 'Lei nº 9.427/1996',
        vinculacao: 'Ministério de Minas e Energia',
        diretores: [
            { nome: 'Sandoval de Araújo Feitosa Neto', cargo: 'Diretor-Geral', mandato: '2022-2027' },
            { nome: 'Agnes Maria de Aragão da Costa', cargo: 'Diretora', mandato: '2022-2028' },
            { nome: 'Fernando Luiz Mosna Ferreira da Silva', cargo: 'Diretor', mandato: '2022-2026' },
            { nome: 'Willamy Moreira Frota', cargo: 'Diretor', mandato: '2025-2029' },
            { nome: 'Gentil Nogueira de Sá Júnior', cargo: 'Diretor', mandato: '2025-2030' }
        ]
    },
    'ANATEL': {
        nome: 'Agência Nacional de Telecomunicações',
        sigla: 'ANATEL',
        esfera: 'federal',
        setor: 'Telecomunicações',
        site: 'https://www.gov.br/anatel',
        lei_criacao: 'Lei nº 9.472/1997',
        vinculacao: 'Ministério das Comunicações',
        diretores: [
            { nome: 'Carlos Manuel Baigorri', cargo: 'Presidente', mandato: '2022-2026' },
            { nome: 'Alexandre Reis Siqueira Freire', cargo: 'Conselheiro', mandato: '2022-2027' },
            { nome: 'Octávio Penna Pieranti', cargo: 'Conselheiro', mandato: '2025-2028' },
            { nome: 'Edson Victor Eugênio de Holanda', cargo: 'Conselheiro', mandato: '2025-2029' }
        ]
    },
    'ANP': {
        nome: 'Agência Nacional do Petróleo, Gás Natural e Biocombustíveis',
        sigla: 'ANP',
        esfera: 'federal',
        setor: 'Petróleo e Gás',
        site: 'https://www.gov.br/anp',
        lei_criacao: 'Lei nº 9.478/1997',
        vinculacao: 'Ministério de Minas e Energia',
        diretores: [
            { nome: 'Artur Watt Neto', cargo: 'Diretor-Geral', mandato: '2025-2029' },
            { nome: 'Symone Christine de Santana Araújo', cargo: 'Diretora', mandato: '2023-2027' },
            { nome: 'Daniel Maia Vieira', cargo: 'Diretor', mandato: '2022-2026' },
            { nome: 'Fernando Luiz Gonçalves Moura', cargo: 'Diretor', mandato: '2022-2026' },
            { nome: 'Pietro Adamo Sampaio Mendes', cargo: 'Diretor', mandato: '2025-2029' }
        ]
    },
    'ANVISA': {
        nome: 'Agência Nacional de Vigilância Sanitária',
        sigla: 'ANVISA',
        esfera: 'federal',
        setor: 'Vigilância Sanitária',
        site: 'https://www.gov.br/anvisa',
        lei_criacao: 'Lei nº 9.782/1999',
        vinculacao: 'Ministério da Saúde',
        diretores: [
            { nome: 'Leandro Pinheiro Safatle', cargo: 'Diretor-Presidente', mandato: '2025-2030' },
            { nome: 'Daniel Meirelles Fernandes Pereira', cargo: 'Diretor', mandato: '2023-2028' },
            { nome: 'Daniela Marreco Cerqueira', cargo: 'Diretora', mandato: '2025-2030' },
            { nome: 'Thiago Lopes Cardoso Campos', cargo: 'Diretor', mandato: '2025-2030' }
        ]
    },
    'ANS': {
        nome: 'Agência Nacional de Saúde Suplementar',
        sigla: 'ANS',
        esfera: 'federal',
        setor: 'Saúde Suplementar',
        site: 'https://www.gov.br/ans',
        lei_criacao: 'Lei nº 9.961/2000',
        vinculacao: 'Ministério da Saúde',
        diretores: [
            { nome: 'Wadih Nemer Damous Filho', cargo: 'Diretor-Presidente', mandato: '2025-2029' },
            { nome: 'Eliane Aparecida de Castro Medeiros', cargo: 'Diretora de Fiscalização', mandato: '2022-2026' },
            { nome: 'Lenise Barcellos de Mello Secchin', cargo: 'Diretora de Normas', mandato: '2025-2030' },
            { nome: 'Jorge Antônio Aquino Lopes', cargo: 'Diretor de Normas e Habilitação', mandato: '2022-2026' }
        ]
    },
    'ANTT': {
        nome: 'Agência Nacional de Transportes Terrestres',
        sigla: 'ANTT',
        esfera: 'federal',
        setor: 'Transportes Terrestres',
        site: 'https://www.gov.br/antt',
        lei_criacao: 'Lei nº 10.233/2001',
        vinculacao: 'Ministério dos Transportes',
        diretores: [
            { nome: 'Guilherme Theo Rodrigues da Rocha Sampaio', cargo: 'Diretor-Geral', mandato: '2025-2030' },
            { nome: 'Alex Antônio de Azevedo Cruz', cargo: 'Diretor', mandato: '2025-2030' },
            { nome: 'Felipe Fernandes Queiroz', cargo: 'Diretor', mandato: '2022-2027' },
            { nome: 'Lucas Asfor Rocha Lima', cargo: 'Diretor', mandato: '2023-2028' }
        ]
    },
    'ANTAQ': {
        nome: 'Agência Nacional de Transportes Aquaviários',
        sigla: 'ANTAQ',
        esfera: 'federal',
        setor: 'Transportes Aquaviários',
        site: 'https://www.gov.br/antaq',
        lei_criacao: 'Lei nº 10.233/2001',
        vinculacao: 'Ministério de Portos e Aeroportos',
        diretores: [
            { nome: 'Frederico Carvalho Dias', cargo: 'Diretor-Geral', mandato: '2025-2030' },
            { nome: 'Wilson Pereira de Lima Filho', cargo: 'Diretor', mandato: '2022-2027' },
            { nome: 'Alber Furtado de Vasconcelos Neto', cargo: 'Diretor', mandato: '2022-2026' },
            { nome: 'Caio César Farias Leôncio', cargo: 'Diretor', mandato: '2022-2027' }
        ]
    },
    'ANAC': {
        nome: 'Agência Nacional de Aviação Civil',
        sigla: 'ANAC',
        esfera: 'federal',
        setor: 'Aviação Civil',
        site: 'https://www.gov.br/anac',
        lei_criacao: 'Lei nº 11.182/2005',
        vinculacao: 'Ministério de Portos e Aeroportos',
        diretores: [
            { nome: 'Tiago Chagas Faierstein', cargo: 'Diretor-Presidente', mandato: '2025-2030' },
            { nome: 'Tiago Sousa Pereira', cargo: 'Diretor', mandato: '2021-2026' },
            { nome: 'Rui Chagas Mesquita', cargo: 'Diretor', mandato: '2025-2030' },
            { nome: 'Antônio Mathias Nogueira Moreira', cargo: 'Diretor', mandato: '2025-2030' }
        ]
    },
    'ANA': {
        nome: 'Agência Nacional de Águas e Saneamento Básico',
        sigla: 'ANA',
        esfera: 'federal',
        setor: 'Águas e Saneamento',
        site: 'https://www.gov.br/ana',
        lei_criacao: 'Lei nº 9.984/2000',
        vinculacao: 'Ministério da Integração e do Desenvolvimento Regional',
        diretores: [
            { nome: 'Ana Carolina Argolo Nascimento de Castro', cargo: 'Diretora-Presidente Interina', mandato: '2022-2026' },
            { nome: 'Larissa Oliveira Rego', cargo: 'Diretora', mandato: '2025-2029' },
            { nome: 'Cristiane Collet Battiston', cargo: 'Diretora', mandato: '2025-2030' },
            { nome: 'Leonardo Goes Silva', cargo: 'Diretor', mandato: '2025-2029' }
        ]
    },
    'ANM': {
        nome: 'Agência Nacional de Mineração',
        sigla: 'ANM',
        esfera: 'federal',
        setor: 'Mineração',
        site: 'https://www.gov.br/anm',
        lei_criacao: 'Lei nº 13.575/2017',
        vinculacao: 'Ministério de Minas e Energia',
        diretores: [
            { nome: 'Mauro Henrique Moreira Sousa', cargo: 'Diretor-Geral', mandato: '2022-2026' },
            { nome: 'José Fernando de Mendonça Gomes Júnior', cargo: 'Diretor', mandato: '2025-2028' },
            { nome: 'Luiz Paniago Neves', cargo: 'Diretor Substituto', mandato: '2025-2026' },
            { nome: 'Fábio Fernando Borges', cargo: 'Diretor Substituto', mandato: '2025-2026' }
        ]
    },
    'ANCINE': {
        nome: 'Agência Nacional do Cinema',
        sigla: 'ANCINE',
        esfera: 'federal',
        setor: 'Audiovisual',
        site: 'https://www.gov.br/ancine',
        lei_criacao: 'MP nº 2.228-1/2001',
        vinculacao: 'Ministério da Cultura',
        diretores: [
            { nome: 'Alex Braga Muniz', cargo: 'Diretor-Presidente', mandato: '2021-2026' },
            { nome: 'Vinícius Clay Araújo Gomes', cargo: 'Diretor', mandato: '2021-2026' },
            { nome: 'Paulo Xavier Alcoforado', cargo: 'Diretor', mandato: '2023-2027' },
            { nome: 'Patrícia Barcelos', cargo: 'Diretora', mandato: '2025-2029' }
        ]
    },
    'CVM': {
        nome: 'Comissão de Valores Mobiliários',
        sigla: 'CVM',
        esfera: 'federal',
        setor: 'Mercado de Capitais',
        site: 'https://www.gov.br/cvm',
        lei_criacao: 'Lei nº 6.385/1976',
        vinculacao: 'Ministério da Fazenda',
        diretores: [
            { nome: 'João Carlos de Andrade Uzeda Accioly', cargo: 'Presidente Interino', mandato: '2022-2026' },
            { nome: 'Marina Palma Copola de Carvalho', cargo: 'Diretora', mandato: '2024-2028' }
        ]
    },
    'CADE': {
        nome: 'Conselho Administrativo de Defesa Econômica',
        sigla: 'CADE',
        esfera: 'federal',
        setor: 'Defesa da Concorrência',
        site: 'https://www.gov.br/cade',
        lei_criacao: 'Lei nº 12.529/2011',
        vinculacao: 'Ministério da Justiça',
        diretores: [
            { nome: 'Gustavo Augusto Freitas de Lima', cargo: 'Presidente', mandato: '2022-2026' },
            { nome: 'Carlos Jacques Vieira Gomes', cargo: 'Conselheiro', mandato: '2024-2028' },
            { nome: 'Diogo Thomson de Andrade', cargo: 'Conselheiro', mandato: '2023-2027' },
            { nome: 'Victor Oliveira Fernandes', cargo: 'Conselheiro', mandato: '2022-2026' },
            { nome: 'Camila Cabral Pires Alves', cargo: 'Conselheira', mandato: '2024-2028' },
            { nome: 'José Levi Mello do Amaral Júnior', cargo: 'Conselheiro', mandato: '2024-2028' }
        ]
    },
    // ─── Agências Estaduais ───
    'ARTESP': {
        nome: 'Agência de Transporte do Estado de São Paulo',
        sigla: 'ARTESP',
        esfera: 'estadual',
        setor: 'Transportes SP',
        site: 'https://www.artesp.sp.gov.br',
        lei_criacao: 'Lei Complementar nº 914/2002',
        vinculacao: 'Governo do Estado de São Paulo',
        diretores: [
            { nome: 'André Isper Rodrigues Barnabé', cargo: 'Diretor-Presidente', mandato: '2023-2027' },
            { nome: 'Diego Zanatto', cargo: 'Diretor', mandato: '2023-2027' },
            { nome: 'Fernanda Esbizaro Rodrigues Rudnik', cargo: 'Diretora', mandato: '2023-2027' },
            { nome: 'Raquel França Carneiro', cargo: 'Diretora', mandato: '2025-2029' }
        ]
    },
    'ARSESP': {
        nome: 'Agência Reguladora de Serviços Públicos do Estado de São Paulo',
        sigla: 'ARSESP',
        esfera: 'estadual',
        setor: 'Saneamento e Energia SP',
        site: 'https://www.arsesp.sp.gov.br',
        lei_criacao: 'Lei Complementar nº 1.025/2007',
        vinculacao: 'Governo do Estado de São Paulo',
        diretores: [
            { nome: 'Thiago Mesquita Nunes', cargo: 'Diretor-Presidente', mandato: '2023-2027' },
            { nome: 'Amauri Gavião Almeida Marques da Silva', cargo: 'Diretor de Gás', mandato: '2022-2027' },
            { nome: 'Gustavo Zarif Frayha', cargo: 'Diretor de Saneamento', mandato: '2023-2027' },
            { nome: 'Daniel Antônio Narzetti', cargo: 'Diretor de Regulação', mandato: '2024-2028' },
            { nome: 'Thiago Roberto Magalhães Veloso', cargo: 'Diretor de Energia', mandato: '2023-2027' }
        ]
    }
};

// ============================================================================
// API: CRUZAMENTO DE DADOS - Consulta a bases públicas externas
// LGPD Art. 7º, III — Tratamento pela administração pública
// Todas as consultas são a portais de transparência pública
// ============================================================================

// Consulta CNPJ na Receita Federal (API pública)
async function consultarCNPJ(cnpj) {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
        return { erro: 'CNPJ inválido — deve conter 14 dígitos' };
    }

    try {
        const axios = require('axios');
        // API pública do ReceitaWS (sem autenticação, limite de 3/min)
        const resp = await axios.get(`https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`, {
            timeout: 15000,
            headers: { 'Accept': 'application/json' }
        });

        if (resp.data.status === 'ERROR') {
            return { erro: resp.data.message || 'CNPJ não encontrado' };
        }

        return {
            cnpj: resp.data.cnpj,
            razao_social: resp.data.nome,
            nome_fantasia: resp.data.fantasia,
            situacao: resp.data.situacao,
            data_abertura: resp.data.abertura,
            natureza_juridica: resp.data.natureza_juridica,
            porte: resp.data.porte,
            capital_social: resp.data.capital_social,
            atividade_principal: resp.data.atividade_principal,
            atividades_secundarias: resp.data.atividades_secundarias,
            endereco: {
                logradouro: resp.data.logradouro,
                numero: resp.data.numero,
                complemento: resp.data.complemento,
                bairro: resp.data.bairro,
                municipio: resp.data.municipio,
                uf: resp.data.uf,
                cep: resp.data.cep
            },
            socios: (resp.data.qsa || []).map(s => ({
                nome: s.nome,
                qualificacao: s.qual,
                pais_origem: s.pais_origem
            })),
            fonte: 'ReceitaWS (dados públicos da Receita Federal)'
        };
    } catch (error) {
        if (error.response && error.response.status === 429) {
            return { erro: 'Limite de consultas atingido. Aguarde 1 minuto e tente novamente.' };
        }
        return { erro: `Erro na consulta: ${error.message}` };
    }
}

// Consulta dados de transparência do Portal da Transparência
async function consultarTransparencia(tipo, termo) {
    try {
        const axios = require('axios');
        let url = '';

        if (tipo === 'servidores') {
            url = `https://api.portaldatransparencia.gov.br/api-de-dados/servidores?nome=${encodeURIComponent(termo)}&pagina=1&tamanhoPagina=10`;
        } else if (tipo === 'contratos') {
            url = `https://api.portaldatransparencia.gov.br/api-de-dados/contratos?codigoOrgao=&dataInicial=2024-01-01&dataFinal=2025-12-31&pagina=1&tamanhoPagina=10`;
        } else if (tipo === 'licitacoes') {
            url = `https://api.portaldatransparencia.gov.br/api-de-dados/licitacoes?codigoOrgao=&dataInicial=2024-01-01&dataFinal=2025-12-31&pagina=1&tamanhoPagina=10`;
        }

        // Nota: O Portal da Transparência exige chave de API
        // Cadastro gratuito em: https://portaldatransparencia.gov.br/api-de-dados
        const apiKey = process.env.PORTAL_TRANSPARENCIA_API_KEY;
        if (!apiKey) {
            return {
                aviso: 'API Key do Portal da Transparência não configurada.',
                instrucoes: 'Cadastre-se gratuitamente em https://portaldatransparencia.gov.br/api-de-dados e adicione PORTAL_TRANSPARENCIA_API_KEY ao .env',
                dados_disponiveis: ['servidores', 'contratos', 'licitacoes', 'convenios', 'despesas']
            };
        }

        const resp = await axios.get(url, {
            headers: {
                'chave-api-dados': apiKey,
                'Accept': 'application/json'
            },
            timeout: 15000
        });

        return { dados: resp.data, fonte: 'Portal da Transparência (gov.br)' };
    } catch (error) {
        return { erro: `Erro na consulta: ${error.message}` };
    }
}

// ── ENDPOINT: Consulta CNPJ ──
app.get('/api/cruzamento/cnpj/:cnpj', async (req, res) => {
    const resultado = await consultarCNPJ(req.params.cnpj);
    res.json({ success: !resultado.erro, ...resultado });
});

// ── ENDPOINT: Consulta Transparência ──
app.get('/api/cruzamento/transparencia/:tipo', async (req, res) => {
    const resultado = await consultarTransparencia(req.params.tipo, req.query.termo || '');
    res.json({ success: !resultado.erro, ...resultado });
});

// ── ENDPOINT: Base completa de agências e diretores ──
app.get('/api/agencias-reguladoras', (req, res) => {
    const lista = Object.values(AGENCIAS_REGULADORAS).map(ag => ({
        sigla: ag.sigla,
        nome: ag.nome,
        esfera: ag.esfera,
        setor: ag.setor,
        site: ag.site,
        lei_criacao: ag.lei_criacao,
        vinculacao: ag.vinculacao,
        total_diretores: ag.diretores.length,
        diretores: ag.diretores
    }));

    res.json({
        success: true,
        total: lista.length,
        agencias: lista,
        aviso_lgpd: 'Todos os dados são públicos — nomes, cargos e mandatos de dirigentes de agências reguladoras são informações de acesso público (Lei de Acesso à Informação, Art. 7º, §3º; LGPD Art. 7º, II e III).'
    });
});

// ── ENDPOINT: Grafo completo com dados de TODAS as agências ──
// Cache for grafo-data-completo (rebuilt every 5 min or on PDF change)
let _grafoCache = null;
let _grafoCacheTime = 0;
const GRAFO_CACHE_TTL = 5 * 60 * 1000;

app.get('/api/grafo-data-completo', (req, res) => {
    if (_grafoCache && (Date.now() - _grafoCacheTime) < GRAFO_CACHE_TTL) {
        return res.json(_grafoCache);
    }
    const nodesMap = {};
    const edgesMap = {};

    // Adiciona todas as agências como nós
    for (const [sigla, ag] of Object.entries(AGENCIAS_REGULADORAS)) {
        nodesMap[sigla] = {
            id: sigla,
            label: sigla,
            full: ag.nome,
            type: 'agency',
            setor: ag.setor,
            esfera: ag.esfera,
            site: ag.site
        };

        // Adiciona diretores como nós
        ag.diretores.forEach(dir => {
            const dirId = dir.nome;
            if (!nodesMap[dirId]) {
                nodesMap[dirId] = {
                    id: dirId,
                    label: dir.nome,
                    type: 'director',
                    role: dir.cargo,
                    mandato: dir.mandato
                };
            }

            // Edge: Diretor → Agência
            const ek = `${sigla}||${dirId}`;
            edgesMap[ek] = {
                source: sigla,
                target: dirId,
                label: dir.cargo,
                type: 'membro',
                strength: dir.cargo.includes('Geral') || dir.cargo.includes('Presidente') ? 1 : 0.7
            };
        });

        // Conecta agências do mesmo setor
        for (const [sigla2, ag2] of Object.entries(AGENCIAS_REGULADORAS)) {
            if (sigla === sigla2) continue;
            if (ag.setor === ag2.setor || ag.vinculacao === ag2.vinculacao) {
                const ek = [sigla, sigla2].sort().join('||');
                if (!edgesMap[ek]) {
                    edgesMap[ek] = {
                        source: sigla,
                        target: sigla2,
                        label: ag.setor === ag2.setor ? 'Mesmo setor' : 'Mesmo ministério',
                        type: 'setor',
                        strength: 0.3
                    };
                }
            }
        }
    }

    // Merge com dados das deliberações (se existirem)
    const deliberacoes = coletarTodasDeliberacoes();
    deliberacoes.forEach(d => {
        const allVoters = [...(d.votos_a_favor || []), ...(d.votos_contra || [])];

        if (d.interessado && d.interessado !== 'ARTESP' && d.interessado.length > 2) {
            const comp = d.interessado;
            if (!nodesMap[comp]) nodesMap[comp] = { id: comp, label: comp, type: 'company', mentions: 0 };
            nodesMap[comp].mentions = (nodesMap[comp].mentions || 0) + 1;

            allVoters.forEach(dir => {
                const ek = `${dir}||${comp}`;
                if (!edgesMap[ek]) edgesMap[ek] = { source: dir, target: comp, label: 'Deliberação', count: 0, type: 'deliberacao', strength: 0.5 };
                edgesMap[ek].count = (edgesMap[ek].count || 0) + 1;
            });
        }

        const temas = d.microtemas && d.microtemas.length > 0 ? d.microtemas : (d.microtema ? [d.microtema] : []);
        temas.forEach(theme => {
            if (!theme || theme.length < 2) return;
            if (!nodesMap[theme]) nodesMap[theme] = { id: theme, label: theme, type: 'theme', count: 0 };
            nodesMap[theme].count = (nodesMap[theme].count || 0) + 1;

            allVoters.forEach(dir => {
                const ek = `${dir}||${theme}`;
                if (!edgesMap[ek]) edgesMap[ek] = { source: dir, target: theme, label: 'Votou sobre', count: 0, type: 'tema_voto', strength: 0.4 };
                edgesMap[ek].count = (edgesMap[ek].count || 0) + 1;
            });
        });
    });

    const allEdges = Object.values(edgesMap);
    const maxCount = Math.max(1, ...allEdges.map(e => e.count || 1));
    allEdges.forEach(e => {
        if (!e.strength) e.strength = Math.max(0.15, (e.count || 1) / maxCount);
    });

    const result = {
        success: true,
        nodes: Object.values(nodesMap),
        edges: allEdges,
        meta: {
            totalAgencias: Object.keys(AGENCIAS_REGULADORAS).length,
            totalDiretores: Object.values(AGENCIAS_REGULADORAS).reduce((acc, ag) => acc + ag.diretores.length, 0),
            totalDeliberacoes: deliberacoes.length,
            aviso_lgpd: 'Dados públicos de agentes públicos no exercício de funções regulatórias.'
        }
    };
    _grafoCache = result;
    _grafoCacheTime = Date.now();
    res.json(result);
});

// ── ENDPOINT: Status de integração com bases externas ──
app.get('/api/cruzamento/status', (req, res) => {
    const portalKey = !!process.env.PORTAL_TRANSPARENCIA_API_KEY;
    res.json({
        success: true,
        integracoes: {
            receita_federal: { status: 'ativo', descricao: 'Consulta CNPJ via ReceitaWS (API pública, 3 req/min)', endpoint: '/api/cruzamento/cnpj/:cnpj' },
            portal_transparencia: { status: portalKey ? 'ativo' : 'requer_configuracao', descricao: 'Servidores, contratos, licitações', endpoint: '/api/cruzamento/transparencia/:tipo', configurado: portalKey },
            diarios_oficiais: { status: 'ativo', descricao: 'DOU via RSS (Imprensa Nacional)', endpoint: '/api/noticias?setor=geral' },
            agencias_reguladoras: { status: 'ativo', descricao: 'Base própria com dados públicos de 15 agências e 50+ diretores', endpoint: '/api/agencias-reguladoras' }
        },
        bases_futuras: [
            { nome: 'JUCESP/JUCERJA', descricao: 'Juntas Comerciais — consulta de empresas e sócios', status: 'planejado', motivo: 'Requer convênio ou API específica' },
            { nome: 'TSE', descricao: 'Doações eleitorais de empresas/pessoas', status: 'planejado', api: 'https://divulgacandcontas.tse.jus.br/divulga/' },
            { nome: 'CEIS/CNEP', descricao: 'Cadastro de empresas inidôneas e punidas', status: 'planejado', api: 'Portal da Transparência' },
            { nome: 'Dados Abertos', descricao: 'Portal brasileiro de dados abertos', status: 'planejado', api: 'https://dados.gov.br/dados/api/publico/1' }
        ]
    });
});

// Inicia servidor
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║   🔍 IRIS PLATFORM - Plataforma Unificada                   ║');
    console.log('║                                                              ║');
    console.log('║   Coleta de PDFs + Análise de Deliberações                  ║');
    console.log('║                                                              ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║                                                              ║');
    console.log('║   🌐 Acesse: http://localhost:' + PORT + '                          ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
});
