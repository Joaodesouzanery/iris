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

// Middleware - aumentado para suportar uploads grandes
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Timeout para requisições longas (10 minutos)
app.use((req, res, next) => {
    req.setTimeout(600000); // 10 minutos
    res.setTimeout(600000);
    next();
});

// ============================================================================
// API - COLETA DE PDFs
// ============================================================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'IRIS Platform',
        pdfsEmMemoria: pdfsProcessados.length,
        ultimaColeta
    });
});

app.post('/api/scrape-and-extract', async (req, res) => {
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
            nomeArquivo: p.nomeArquivo,
            data: p.data,
            reuniao: p.reuniao,
            numPaginas: p.numPaginas,
            numCaracteres: p.numCaracteres,
            analisado: p.analise ? true : false
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

        // Combina os resultados
        const analise = {
            ...analiseTradicional,
            deliberacoes: extracao.deliberations,
            totalDeliberacoes: extracao.total
        };

        // Salva análise no PDF
        pdfsProcessados[index].analise = analise;

        res.json({
            sucesso: true,
            nomeArquivo: pdf.nomeArquivo,
            analise
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

        for (let i = 0; i < pdfsProcessados.length; i++) {
            const pdf = pdfsProcessados[i];

            if (pdf.texto) {
                // Usa a nova extração estruturada
                const extracao = irisCore.extrairDeliberacoesEstruturadas(pdf.texto);
                const analiseTradicional = irisCore.analisarTexto(pdf.texto);

                const analise = {
                    ...analiseTradicional,
                    deliberacoes: extracao.deliberations,
                    totalDeliberacoes: extracao.total
                };

                pdfsProcessados[i].analise = analise;
                totalDeliberacoes += extracao.total;

                resultados.push({
                    index: i,
                    nomeArquivo: pdf.nomeArquivo,
                    tipo: analise.tipo,
                    decisao: analise.decisao,
                    microtema: analise.microtema,
                    confianca: analise.confiancaGeral,
                    deliberacoes: extracao.deliberations.length
                });
            }
        }

        res.json({
            sucesso: true,
            totalAnalisados: resultados.length,
            totalDeliberacoes,
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

        const pdf = {
            nomeArquivo: nomeArquivo || `upload_${Date.now()}.pdf`,
            texto: pdfData.text,
            numPaginas: pdfData.numpages,
            numCaracteres: pdfData.text.length,
            data: new Date().toLocaleDateString('pt-BR'),
            origem: 'upload',
            statusExtracao: 'sucesso'
        };

        pdfsProcessados.push(pdf);

        console.log(`[IRIS] Upload processado: ${pdf.nomeArquivo} (${pdf.numPaginas} páginas)`);

        res.json({
            sucesso: true,
            mensagem: `PDF "${pdf.nomeArquivo}" carregado com sucesso`,
            index: pdfsProcessados.length - 1,
            pdf: {
                nomeArquivo: pdf.nomeArquivo,
                numPaginas: pdf.numPaginas,
                numCaracteres: pdf.numCaracteres
            }
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
// INTERFACE WEB UNIFICADA
// ============================================================================

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IRIS Platform - Coleta e Análise de Deliberações</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0a1628 0%, #0d1e36 50%, #0a1628 100%);
            min-height: 100vh;
            color: #e4e4e4;
        }

        .header {
            background: rgba(10, 22, 40, 0.9);
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #1a3a5c;
        }

        .header h1 {
            font-size: 1.8em;
            background: linear-gradient(90deg, #c9a227, #e8c547);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .header .status {
            display: flex;
            gap: 20px;
            font-size: 14px;
        }

        .header .status span {
            background: rgba(255,255,255,0.1);
            padding: 8px 15px;
            border-radius: 20px;
        }

        .container {
            display: grid;
            grid-template-columns: 350px 1fr 400px;
            height: calc(100vh - 80px);
        }

        .sidebar {
            background: rgba(10, 22, 40, 0.5);
            border-right: 1px solid #1a3a5c;
            display: flex;
            flex-direction: column;
        }

        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid #1a3a5c;
        }

        .sidebar-header h2 {
            font-size: 1.1em;
            color: #c9a227;
            margin-bottom: 15px;
        }

        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            width: 100%;
            transition: all 0.3s;
        }

        .btn-primary {
            background: linear-gradient(135deg, #c9a227, #a88620);
            color: #0a1628;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(201, 162, 39, 0.4);
        }

        .btn-secondary {
            background: #1a3a5c;
            color: #fff;
            margin-top: 10px;
        }

        .btn-secondary:hover {
            background: #254a70;
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .pdf-list {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }

        .pdf-item {
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.3s;
            border-left: 3px solid transparent;
        }

        .pdf-item:hover {
            background: rgba(255,255,255,0.1);
        }

        .pdf-item.selected {
            border-left-color: #c9a227;
            background: rgba(201, 162, 39, 0.1);
        }

        .pdf-item.analisado {
            border-left-color: #4ade80;
        }

        .pdf-item .nome {
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 13px;
        }

        .pdf-item .info {
            font-size: 11px;
            color: #888;
        }

        .pdf-item .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 10px;
            margin-top: 8px;
        }

        .badge-deferido { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
        .badge-indeferido { background: rgba(248, 113, 113, 0.2); color: #f87171; }
        .badge-externo { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
        .badge-interno { background: rgba(192, 132, 252, 0.2); color: #c084fc; }

        .main-content {
            padding: 20px;
            overflow-y: auto;
        }

        .content-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .content-header h2 {
            color: #c9a227;
        }

        .texto-box {
            background: #0a1628;
            border-radius: 10px;
            padding: 20px;
            height: calc(100% - 80px);
            overflow-y: auto;
            font-family: 'Consolas', monospace;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
            border: 1px solid #1a3a5c;
        }

        .analysis-panel {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid #1a3a5c;
            padding: 20px;
            overflow-y: auto;
        }

        .analysis-panel h2 {
            color: #c9a227;
            margin-bottom: 20px;
            font-size: 1.1em;
        }

        .analysis-card {
            background: #0a1628;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 3px solid #c9a227;
        }

        .analysis-card h3 {
            font-size: 12px;
            color: #888;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .analysis-value {
            font-size: 1.3em;
            font-weight: 600;
        }

        .analysis-value.deferido { color: #4ade80; }
        .analysis-value.indeferido { color: #f87171; }
        .analysis-value.externo { color: #60a5fa; }
        .analysis-value.interno { color: #c084fc; }

        .confidence-bar {
            height: 4px;
            background: #1a3a5c;
            border-radius: 2px;
            margin-top: 8px;
        }

        .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, #c9a227, #4ade80);
            border-radius: 2px;
        }

        .justificativa {
            font-size: 11px;
            color: #666;
            margin-top: 5px;
        }

        .votos-section {
            margin-top: 20px;
        }

        .voto-item {
            background: rgba(255,255,255,0.05);
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .voto-item .nome { font-weight: 600; font-size: 13px; }
        .voto-item .cargo { font-size: 11px; color: #888; }
        .voto-item .voto { font-size: 12px; }
        .voto-item .voto.favoravel { color: #4ade80; }
        .voto-item .voto.contrario { color: #f87171; }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }

        .empty-state p { margin-bottom: 20px; }

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

        .stats-bar {
            display: flex;
            gap: 15px;
            padding: 15px;
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
            margin-bottom: 15px;
        }

        .stat-item {
            text-align: center;
            flex: 1;
        }

        .stat-item .value {
            font-size: 1.5em;
            font-weight: 700;
            color: #c9a227;
        }

        .stat-item .label {
            font-size: 11px;
            color: #888;
        }

        /* Upload styles */
        .upload-section {
            margin-bottom: 10px;
        }

        .upload-label {
            display: block;
            text-align: center;
            cursor: pointer;
        }

        .progress-bar {
            height: 4px;
            background: #1a3a5c;
            border-radius: 2px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #c9a227, #4ade80);
            width: 0%;
            transition: width 0.3s;
        }

        /* Monitor status */
        .monitor-status {
            cursor: pointer;
            position: relative;
        }

        .monitor-status.active {
            background: rgba(74, 222, 128, 0.2) !important;
            color: #4ade80 !important;
        }

        .monitor-status .badge-count {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #f87171;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Modal */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .modal-content {
            background: #1a1a2e;
            border-radius: 15px;
            width: 500px;
            max-height: 80vh;
            overflow: hidden;
            border: 1px solid #1a3a5c;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border: 1px solid #1a3a5c;
        }

        .modal-header h2 {
            color: #c9a227;
            font-size: 1.2em;
        }

        .close-btn {
            background: none;
            border: none;
            color: #888;
            font-size: 20px;
            cursor: pointer;
        }

        .close-btn:hover {
            color: #fff;
        }

        .modal-body {
            padding: 20px;
            overflow-y: auto;
            max-height: 60vh;
        }

        .monitor-info {
            background: #0a1628;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
        }

        .monitor-info p {
            margin-bottom: 8px;
            font-size: 14px;
        }

        .monitor-actions {
            display: flex;
            gap: 10px;
        }

        .monitor-actions .btn {
            flex: 1;
        }

        .novos-docs-list {
            max-height: 200px;
            overflow-y: auto;
        }

        .novo-doc-item {
            background: rgba(74, 222, 128, 0.1);
            border-left: 3px solid #4ade80;
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 5px;
        }

        .novo-doc-item .nome {
            font-weight: 600;
            font-size: 13px;
        }

        .novo-doc-item .data {
            font-size: 11px;
            color: #888;
        }

        .pdf-item.upload {
            border-left-color: #c084fc;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>IRIS Platform</h1>
        <div class="status">
            <span id="statusPdfs">0 PDFs</span>
            <span id="statusAnalisados">0 Analisados</span>
            <span id="statusMonitor" class="monitor-status" onclick="abrirPainelMonitor()">Monitor: OFF</span>
            <a href="/metricas" style="background: linear-gradient(135deg, #c084fc, #a855f7); color: white; text-decoration: none; padding: 8px 15px; border-radius: 20px; font-weight: 600;">Metricas</a>
        </div>
    </div>

    <!-- Modal de Monitoramento -->
    <div id="monitorModal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Monitoramento de Novos Documentos</h2>
                <button onclick="fecharPainelMonitor()" class="close-btn">X</button>
            </div>
            <div class="modal-body">
                <div class="monitor-info">
                    <p><strong>Status:</strong> <span id="monitorStatusText">Inativo</span></p>
                    <p><strong>Ultima verificacao:</strong> <span id="ultimaVerificacao">-</span></p>
                    <p><strong>Docs conhecidos:</strong> <span id="docsConhecidos">0</span></p>
                    <p><strong>Novos nao lidos:</strong> <span id="novosNaoLidos">0</span></p>
                </div>
                <div class="monitor-actions">
                    <button class="btn btn-primary" id="btnMonitor" onclick="toggleMonitoramento()">Iniciar Monitoramento</button>
                    <button class="btn btn-secondary" onclick="verificarAgora()">Verificar Agora</button>
                </div>
                <div id="listaNovosDocs" class="novos-docs-list" style="margin-top: 15px;"></div>
            </div>
        </div>
    </div>

    <div class="container">
        <!-- Sidebar - Lista de PDFs -->
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>PDFs</h2>

                <!-- Upload de PDFs -->
                <div class="upload-section">
                    <label for="fileInput" class="btn btn-primary upload-label">
                        Upload PDFs
                    </label>
                    <input type="file" id="fileInput" accept=".pdf" multiple style="display: none;" onchange="uploadPDFs(this.files)">
                    <div id="uploadProgress" style="display: none; margin-top: 10px;">
                        <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
                        <span id="uploadStatus" style="font-size: 11px; color: #888;"></span>
                    </div>
                </div>

                <button class="btn btn-secondary" onclick="analisarTodos()" id="btnAnalisarTodos">
                    Analisar Todos
                </button>
                <button class="btn btn-secondary" onclick="limparPDFs()" style="background: #4a2a2a;">
                    Limpar Lista
                </button>
            </div>
            <div class="pdf-list" id="pdfList">
                <div class="empty-state">
                    <p>Nenhum PDF carregado</p>
                    <p style="font-size: 12px">Faca upload de PDFs ou ative o monitoramento</p>
                </div>
            </div>
        </div>

        <!-- Conteúdo Principal - Texto do PDF -->
        <div class="main-content">
            <div class="content-header">
                <h2 id="pdfTitle">Selecione um PDF</h2>
                <button class="btn btn-primary" onclick="analisarSelecionado()" id="btnAnalisar" style="width: auto; display: none;">
                    🔍 Analisar Este PDF
                </button>
            </div>
            <div class="texto-box" id="textoBox">
                <div class="empty-state">
                    <p>Selecione um PDF na lista à esquerda para ver o conteúdo</p>
                </div>
            </div>
        </div>

        <!-- Painel de Análise -->
        <div class="analysis-panel">
            <h2>📊 Análise</h2>

            <div id="analysisContent">
                <div class="empty-state">
                    <p>Selecione um PDF e clique em "Analisar" para ver os resultados</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        let pdfs = [];
        let selectedIndex = -1;
        let monitorAtivo = false;

        // Carrega PDFs e status do monitor ao iniciar
        carregarPDFs();
        atualizarStatusMonitor();

        async function carregarPDFs() {
            try {
                const res = await fetch('/api/pdfs');
                const data = await res.json();
                pdfs = data.pdfs || [];
                renderPdfList();
                atualizarStatus();
            } catch (e) {
                console.error('Erro ao carregar PDFs:', e);
            }
        }

        function renderPdfList() {
            const list = document.getElementById('pdfList');

            if (pdfs.length === 0) {
                list.innerHTML = '<div class="empty-state"><p>Nenhum PDF coletado</p></div>';
                return;
            }

            list.innerHTML = pdfs.map((pdf, i) => {
                const classes = ['pdf-item'];
                if (i === selectedIndex) classes.push('selected');
                if (pdf.analisado) classes.push('analisado');

                let badges = '';
                if (pdf.analisado) {
                    // Precisamos buscar a análise para mostrar os badges
                }

                return \`
                    <div class="\${classes.join(' ')}" onclick="selecionarPDF(\${i})">
                        <div class="nome">\${pdf.nomeArquivo}</div>
                        <div class="info">\${pdf.data || ''} • \${pdf.numPaginas || 0} páginas</div>
                        \${pdf.analisado ? '<span class="badge badge-deferido">✓ Analisado</span>' : ''}
                    </div>
                \`;
            }).join('');
        }

        async function selecionarPDF(index) {
            selectedIndex = index;
            renderPdfList();

            const res = await fetch('/api/pdfs/' + index);
            const pdf = await res.json();

            document.getElementById('pdfTitle').textContent = pdf.nomeArquivo;
            document.getElementById('textoBox').textContent = pdf.texto || 'Sem texto extraído';
            document.getElementById('btnAnalisar').style.display = 'block';

            if (pdf.analise) {
                renderAnalise(pdf.analise);
            } else {
                document.getElementById('analysisContent').innerHTML =
                    '<div class="empty-state"><p>Clique em "Analisar Este PDF"</p></div>';
            }
        }

        async function coletarPDFs() {
            const btn = document.getElementById('btnColetar');
            btn.disabled = true;
            btn.textContent = '⏳ Coletando...';

            document.getElementById('pdfList').innerHTML = '<div class="loading"></div>';

            try {
                const res = await fetch('/api/scrape-and-extract', { method: 'POST' });
                const data = await res.json();

                if (data.erro) {
                    alert('Erro: ' + data.erro);
                } else {
                    alert(data.mensagem);
                    await carregarPDFs();
                }
            } catch (e) {
                alert('Erro na coleta: ' + e.message);
            }

            btn.disabled = false;
            btn.textContent = '🚀 Coletar PDFs da ARTESP';
        }

        async function analisarSelecionado() {
            if (selectedIndex < 0) return;

            const btn = document.getElementById('btnAnalisar');
            btn.disabled = true;
            btn.textContent = '⏳ Analisando...';

            try {
                const res = await fetch('/api/analisar-pdf/' + selectedIndex, { method: 'POST' });
                const data = await res.json();

                if (data.analise) {
                    renderAnalise(data.analise);
                    pdfs[selectedIndex].analisado = true;
                    renderPdfList();
                    atualizarStatus();
                }
            } catch (e) {
                alert('Erro: ' + e.message);
            }

            btn.disabled = false;
            btn.textContent = '🔍 Analisar Este PDF';
        }

        async function analisarTodos() {
            if (pdfs.length === 0) {
                alert('Colete os PDFs primeiro!');
                return;
            }

            const btn = document.getElementById('btnAnalisarTodos');
            btn.disabled = true;
            btn.textContent = '⏳ Analisando...';

            try {
                const res = await fetch('/api/analisar-todos', { method: 'POST' });
                const data = await res.json();

                alert(\`\${data.totalAnalisados} PDFs analisados!\`);
                await carregarPDFs();

                if (selectedIndex >= 0) {
                    selecionarPDF(selectedIndex);
                }
            } catch (e) {
                alert('Erro: ' + e.message);
            }

            btn.disabled = false;
            btn.textContent = '🔍 Analisar Todos';
        }

        function renderAnalise(analise) {
            let html = '';

            // Se tem deliberações estruturadas, mostra elas
            if (analise.deliberacoes && analise.deliberacoes.length > 0) {
                html += \`
                    <div class="analysis-card" style="border-left-color: #4ade80;">
                        <h3>DELIBERACOES ENCONTRADAS</h3>
                        <div class="analysis-value" style="color: #4ade80">\${analise.deliberacoes.length}</div>
                    </div>
                \`;

                for (let i = 0; i < analise.deliberacoes.length; i++) {
                    const d = analise.deliberacoes[i];
                    const resultClass = d.resultado === 'Deferido' ? 'deferido' :
                                       d.resultado === 'Indeferido' ? 'indeferido' : '';

                    html += \`
                        <div class="delib-card" style="background: #0a1628; border-radius: 10px; padding: 15px; margin-bottom: 15px; border-left: 3px solid \${d.resultado === 'Deferido' ? '#4ade80' : d.resultado === 'Indeferido' ? '#f87171' : '#c9a227'};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: bold; color: #c9a227;">Deliberacao \${i + 1}</span>
                                <span class="badge \${resultClass ? 'badge-' + resultClass : ''}" style="padding: 4px 10px; border-radius: 12px; font-size: 11px; background: \${d.resultado === 'Deferido' ? 'rgba(74,222,128,0.2)' : d.resultado === 'Indeferido' ? 'rgba(248,113,113,0.2)' : 'rgba(0,212,255,0.2)'}; color: \${d.resultado === 'Deferido' ? '#4ade80' : d.resultado === 'Indeferido' ? '#f87171' : '#c9a227'};">
                                    \${d.resultado || 'N/A'}
                                </span>
                            </div>

                            \${d.numero_deliberacao ? \`<div style="margin-bottom: 5px;"><span style="color: #888; font-size: 11px;">Numero:</span> <span style="font-family: monospace;">\${d.numero_deliberacao}</span></div>\` : ''}
                            \${d.reuniao_ordinaria ? \`<div style="margin-bottom: 5px;"><span style="color: #888; font-size: 11px;">Reuniao:</span> \${d.reuniao_ordinaria}a R.O.</div>\` : ''}
                            \${d.interessado ? \`<div style="margin-bottom: 5px;"><span style="color: #888; font-size: 11px;">Interessado:</span> \${d.interessado}</div>\` : ''}
                            \${d.processo ? \`<div style="margin-bottom: 5px;"><span style="color: #888; font-size: 11px;">Processo:</span> <span style="font-family: monospace;">\${d.processo}</span></div>\` : ''}
                            \${d.microtema ? \`<div style="margin-bottom: 5px;"><span style="color: #888; font-size: 11px;">Microtema:</span> <span style="color: #c084fc;">\${d.microtema}</span></div>\` : ''}
                            \${d.classificacao ? \`<div style="margin-bottom: 5px;"><span style="color: #888; font-size: 11px;">Classificacao:</span> <span style="color: #fbbf24;">\${d.classificacao}</span></div>\` : ''}

                            \${d.votos_a_favor && d.votos_a_favor.length > 0 ? \`
                                <div style="margin-top: 10px; padding-top: 10px; border: 1px solid #1a3a5c;">
                                    <span style="color: #4ade80; font-size: 11px;">A Favor (\${d.votos_a_favor.length}):</span>
                                    <span style="font-size: 12px; color: #888;"> \${d.votos_a_favor.join(', ')}</span>
                                </div>
                            \` : ''}

                            \${d.votos_contra && d.votos_contra.length > 0 ? \`
                                <div style="margin-top: 5px;">
                                    <span style="color: #f87171; font-size: 11px;">Contra (\${d.votos_contra.length}):</span>
                                    <span style="font-size: 12px; color: #888;"> \${d.votos_contra.join(', ')}</span>
                                </div>
                            \` : ''}
                        </div>
                    \`;
                }

                // Botão para exportar JSON
                html += \`
                    <button onclick="exportarJSON()" class="btn btn-secondary" style="width: 100%; margin-top: 10px;">
                        Exportar JSON
                    </button>
                \`;

            } else {
                // Fallback para análise tradicional
                const tipoClass = analise.tipo === 'Pleito Externo' ? 'externo' : 'interno';
                const decisaoClass = analise.decisao === 'Deferido' ? 'deferido' :
                                     analise.decisao === 'Indeferido' ? 'indeferido' : '';

                // Tipo
                html += \`
                    <div class="analysis-card">
                        <h3>Tipo</h3>
                        <div class="analysis-value \${tipoClass}">\${analise.tipo}</div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: \${analise.tipoConfianca}%"></div>
                        </div>
                        <div class="justificativa">\${analise.tipoJustificativa || ''}</div>
                    </div>
                \`;

                // Decisão
                html += \`
                    <div class="analysis-card">
                        <h3>Decisao</h3>
                        <div class="analysis-value \${decisaoClass}">\${analise.decisao}</div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: \${analise.decisaoConfianca}%"></div>
                        </div>
                        <div class="justificativa">\${analise.decisaoJustificativa || ''}</div>
                    </div>
                \`;

                // Microtema
                html += \`
                    <div class="analysis-card">
                        <h3>Microtema</h3>
                        <div class="analysis-value">\${analise.microtema}</div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: \${analise.microtemaConfianca}%"></div>
                        </div>
                    </div>
                \`;

                // Confiança Geral
                html += \`
                    <div class="analysis-card">
                        <h3>Confianca Geral</h3>
                        <div class="analysis-value" style="color: #c9a227">\${analise.confiancaGeral}%</div>
                    </div>
                \`;

                // Votos
                if (analise.votos && analise.votos.length > 0) {
                    html += '<div class="votos-section"><h3 style="color: #888; font-size: 12px; margin-bottom: 10px;">VOTOS</h3>';

                    for (const voto of analise.votos) {
                        const votoClass = voto.voto === 'Favorável' ? 'favoravel' :
                                         voto.voto === 'Contrário' ? 'contrario' : '';
                        html += \`
                            <div class="voto-item">
                                <div>
                                    <div class="nome">\${voto.diretor}</div>
                                    <div class="cargo">\${voto.cargo || ''}</div>
                                </div>
                                <div class="voto \${votoClass}">\${voto.voto}</div>
                            </div>
                        \`;
                    }

                    html += '</div>';
                }

                // Processos
                if (analise.processos && analise.processos.length > 0) {
                    html += '<div class="analysis-card"><h3>Processos</h3>';
                    html += analise.processos.map(p =>
                        \`<div style="font-family: monospace; font-size: 12px; margin-top: 5px;">\${p}</div>\`
                    ).join('');
                    html += '</div>';
                }
            }

            document.getElementById('analysisContent').innerHTML = html;
        }

        // Exportar deliberações como JSON
        function exportarJSON() {
            if (selectedIndex < 0 || !pdfs[selectedIndex]) return;

            fetch('/api/pdfs/' + selectedIndex)
                .then(res => res.json())
                .then(pdf => {
                    if (pdf.analise && pdf.analise.deliberacoes) {
                        const json = JSON.stringify({ deliberations: pdf.analise.deliberacoes }, null, 2);
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = pdf.nomeArquivo.replace('.pdf', '_deliberacoes.json');
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                });
        }

        function atualizarStatus() {
            const analisados = pdfs.filter(p => p.analisado).length;
            document.getElementById('statusPdfs').textContent = pdfs.length + ' PDFs';
            document.getElementById('statusAnalisados').textContent = analisados + ' Analisados';
        }

        // ==================== UPLOAD DE PDFs ====================

        async function uploadPDFs(files) {
            if (!files || files.length === 0) return;

            const progressDiv = document.getElementById('uploadProgress');
            const progressFill = document.getElementById('progressFill');
            const statusText = document.getElementById('uploadStatus');

            progressDiv.style.display = 'block';
            progressFill.style.width = '0%';

            // Filtra apenas PDFs
            const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
            const totalPDFs = pdfFiles.length;

            if (totalPDFs === 0) {
                statusText.textContent = 'Nenhum PDF selecionado';
                return;
            }

            statusText.textContent = 'Preparando ' + totalPDFs + ' PDFs...';

            // PROCESSA EM LOTES DE 50 PARA NAO SOBRECARREGAR
            const TAMANHO_LOTE = 50;
            const numLotes = Math.ceil(totalPDFs / TAMANHO_LOTE);
            let totalSucesso = 0;
            let totalErros = 0;

            for (let lote = 0; lote < numLotes; lote++) {
                const inicio = lote * TAMANHO_LOTE;
                const fim = Math.min(inicio + TAMANHO_LOTE, totalPDFs);
                const arquivosLote = pdfFiles.slice(inicio, fim);

                statusText.textContent = 'Lote ' + (lote + 1) + '/' + numLotes + ' - Lendo arquivos...';

                // Le arquivos deste lote
                const arquivos = [];
                for (const file of arquivosLote) {
                    const base64 = await lerArquivoBase64(file);
                    arquivos.push({
                        arquivo: base64,
                        nomeArquivo: file.name
                    });
                }

                // Envia lote para o servidor
                statusText.textContent = 'Lote ' + (lote + 1) + '/' + numLotes + ' - Enviando ' + arquivos.length + ' PDFs...';
                progressFill.style.width = ((lote / numLotes) * 80 + 10) + '%';

                try {
                    const res = await fetch('/api/upload-multiplo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ arquivos })
                    });

                    const data = await res.json();

                    if (data.sucesso) {
                        totalSucesso += data.totalSucesso || 0;
                        totalErros += data.totalErros || 0;
                    } else {
                        totalErros += arquivos.length;
                        console.error('Erro no lote:', data.erro);
                    }
                } catch (e) {
                    totalErros += arquivos.length;
                    console.error('Erro ao enviar lote:', e.message);
                }

                // Progresso visual
                progressFill.style.width = (((lote + 1) / numLotes) * 90) + '%';
            }

            // Finaliza
            progressFill.style.width = '100%';
            statusText.textContent = totalSucesso + ' PDFs carregados' + (totalErros > 0 ? ' (' + totalErros + ' erros)' : '');
            await carregarPDFs();

            setTimeout(() => {
                progressDiv.style.display = 'none';
            }, 3000);
        }

        // Funcao auxiliar para ler arquivo como Base64
        function lerArquivoBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
            });
        }

        async function limparPDFs() {
            if (!confirm('Remover todos os PDFs da memoria?')) return;

            try {
                const res = await fetch('/api/limpar-pdfs', { method: 'POST' });
                const data = await res.json();
                alert(data.mensagem);
                await carregarPDFs();
                document.getElementById('textoBox').innerHTML = '<div class="empty-state"><p>Selecione um PDF</p></div>';
                document.getElementById('analysisContent').innerHTML = '<div class="empty-state"><p>Selecione um PDF e analise</p></div>';
                document.getElementById('btnAnalisar').style.display = 'none';
            } catch (e) {
                alert('Erro: ' + e.message);
            }
        }

        // ==================== MONITORAMENTO ====================

        function abrirPainelMonitor() {
            document.getElementById('monitorModal').style.display = 'flex';
            atualizarStatusMonitor();
            carregarNovosDocumentos();
        }

        function fecharPainelMonitor() {
            document.getElementById('monitorModal').style.display = 'none';
        }

        async function atualizarStatusMonitor() {
            try {
                const res = await fetch('/api/monitoramento/status');
                const data = await res.json();

                monitorAtivo = data.ativo;

                const statusEl = document.getElementById('statusMonitor');
                const statusText = document.getElementById('monitorStatusText');
                const btnMonitor = document.getElementById('btnMonitor');

                if (data.ativo) {
                    statusEl.textContent = 'Monitor: ON';
                    statusEl.classList.add('active');
                    if (statusText) statusText.textContent = 'Ativo';
                    if (btnMonitor) btnMonitor.textContent = 'Parar Monitoramento';
                } else {
                    statusEl.textContent = 'Monitor: OFF';
                    statusEl.classList.remove('active');
                    if (statusText) statusText.textContent = 'Inativo';
                    if (btnMonitor) btnMonitor.textContent = 'Iniciar Monitoramento';
                }

                // Atualiza badge de novos documentos
                if (data.novosDocumentos > 0) {
                    statusEl.innerHTML = (data.ativo ? 'Monitor: ON' : 'Monitor: OFF') +
                        '<span class="badge-count">' + data.novosDocumentos + '</span>';
                }

                // Atualiza info no modal
                if (document.getElementById('ultimaVerificacao')) {
                    document.getElementById('ultimaVerificacao').textContent =
                        data.ultimaVerificacao ? new Date(data.ultimaVerificacao).toLocaleString('pt-BR') : '-';
                    document.getElementById('docsConhecidos').textContent = data.documentosConhecidos;
                    document.getElementById('novosNaoLidos').textContent = data.novosDocumentos;
                }

            } catch (e) {
                console.error('Erro ao atualizar status monitor:', e);
            }
        }

        async function toggleMonitoramento() {
            const endpoint = monitorAtivo ? '/api/monitoramento/parar' : '/api/monitoramento/iniciar';

            try {
                const res = await fetch(endpoint, { method: 'POST' });
                const data = await res.json();
                alert(data.mensagem);
                await atualizarStatusMonitor();
            } catch (e) {
                alert('Erro: ' + e.message);
            }
        }

        async function verificarAgora() {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = 'Verificando...';

            try {
                const res = await fetch('/api/monitoramento/verificar-agora', { method: 'POST' });
                const data = await res.json();

                if (data.primeiraExecucao) {
                    alert('Primeira verificacao: ' + data.total + ' documentos registrados como base');
                } else if (data.novos > 0) {
                    alert('NOVOS DOCUMENTOS: ' + data.novos + ' encontrados!');
                } else {
                    alert('Nenhum documento novo encontrado');
                }

                await atualizarStatusMonitor();
                await carregarNovosDocumentos();

            } catch (e) {
                alert('Erro: ' + e.message);
            }

            btn.disabled = false;
            btn.textContent = 'Verificar Agora';
        }

        async function carregarNovosDocumentos() {
            try {
                const res = await fetch('/api/monitoramento/novos');
                const data = await res.json();

                const lista = document.getElementById('listaNovosDocs');
                if (!lista) return;

                if (data.documentos.length === 0) {
                    lista.innerHTML = '<p style="color: #666; text-align: center;">Nenhum documento novo detectado ainda</p>';
                    return;
                }

                lista.innerHTML = '<h4 style="margin-bottom: 10px; color: #4ade80;">Novos Documentos Detectados:</h4>' +
                    data.documentos.map(doc => \`
                        <div class="novo-doc-item">
                            <div class="nome">\${doc.nomeArquivo}</div>
                            <div class="data">Detectado em: \${new Date(doc.descobertoEm).toLocaleString('pt-BR')}</div>
                            <a href="\${doc.url}" target="_blank" style="font-size: 11px; color: #c9a227;">Baixar PDF</a>
                        </div>
                    \`).join('');

            } catch (e) {
                console.error('Erro ao carregar novos documentos:', e);
            }
        }

        // Atualiza status do monitor periodicamente
        setInterval(atualizarStatusMonitor, 60000); // A cada 1 minuto
    </script>
</body>
</html>
    `);
});

// ============================================================================
// PÁGINA DE MÉTRICAS (serve arquivo estático)
// ============================================================================

app.get('/metricas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'metricas.html'));
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
