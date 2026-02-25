/**
 * Pipeline Processor - Processamento Concorrente de PDFs
 *
 * Substitui o fluxo sequencial (download → extração) por um pipeline
 * que baixa e extrai texto em paralelo, em batches configuráveis.
 *
 * Ganho de velocidade: ~10-20x vs sequencial
 * Custo: R$ 0,00 (tudo local, sem APIs pagas)
 *
 * Fluxo por PDF: GET → Buffer → pdf-parse → texto → libera buffer
 * Concorrência padrão: 10 PDFs simultâneos
 */

const crypto = require('crypto');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const { getRandomUserAgent } = require('./scraper');
const { validatePDF, formatBytes } = require('./downloader');
const logger = require('./logger');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── URL base ARTESP ──
const ARTESP_BASE_URL = 'https://www.artesp.sp.gov.br/reunioes-da-diretoria-colegiada/';

/**
 * Download rápido — sem HEAD request prévio, sem delays internos.
 * axios.get já segue redirects automaticamente (maxRedirects: 10).
 */
async function downloadRapido(url, nomeArquivo) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxRedirects: 10,
        maxContentLength: 50 * 1024 * 1024,
        headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'application/pdf,application/octet-stream,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'Referer': ARTESP_BASE_URL,
            'Connection': 'keep-alive'
        },
        validateStatus: (status) => status >= 200 && status < 400
    });

    const buffer = Buffer.from(response.data);
    const validacao = validatePDF(buffer);
    if (!validacao.valido) {
        throw new Error(`PDF invalido: ${validacao.motivo}`);
    }
    return buffer;
}

/**
 * Download com retry simples (2 tentativas)
 */
async function downloadComRetry(url, nomeArquivo) {
    try {
        return await downloadRapido(url, nomeArquivo);
    } catch (err1) {
        // Uma retry após 1s
        await sleep(1000);
        try {
            return await downloadRapido(url, nomeArquivo);
        } catch (err2) {
            throw new Error(`Falha após 2 tentativas: ${err2.message}`);
        }
    }
}

/**
 * Extrai texto de um buffer PDF (local, custo zero)
 */
async function extrairTexto(buffer, nomeArquivo) {
    const data = await pdfParse(buffer, { max: 0 });

    let texto = data.text || '';
    texto = texto
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .split('\n').map(l => l.trim()).join('\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();

    const mediaCharPorPag = data.numpages > 0 ? texto.length / data.numpages : 0;

    return {
        texto,
        numPaginas: data.numpages,
        numCaracteres: texto.length,
        numPalavras: texto.split(/\s+/).filter(p => p.length > 0).length,
        ehEscaneado: mediaCharPorPag < 100,
        info: {
            titulo: data.info?.Title || null,
            autor: data.info?.Author || null,
            dataCriacao: data.info?.CreationDate || null
        }
    };
}

/**
 * Processa um único PDF: download → hash → extração → libera buffer
 */
async function processarUmPDF(pdf) {
    const start = Date.now();

    try {
        const buffer = await downloadComRetry(pdf.url, pdf.nomeArquivo);
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');
        const extracao = await extrairTexto(buffer, pdf.nomeArquivo);
        // buffer sai de escopo aqui → GC libera memória

        return {
            url: pdf.url,
            textoLink: pdf.textoLink,
            nomeArquivo: pdf.nomeArquivo,
            data: pdf.data,
            ano: pdf.ano,
            reuniao: pdf.reuniao,
            tamanho: buffer.length,
            tamanhoFormatado: formatBytes(buffer.length),
            status: 'sucesso',
            erro: null,
            ehNovo: pdf.ehNovo !== undefined ? pdf.ehNovo : true,
            hash,
            downloadedAt: new Date().toISOString(),
            texto: extracao.texto,
            numPaginas: extracao.numPaginas,
            numCaracteres: extracao.numCaracteres,
            numPalavras: extracao.numPalavras,
            ehEscaneado: extracao.ehEscaneado,
            info: extracao.info,
            statusExtracao: 'sucesso',
            erroExtracao: null,
            extractedAt: new Date().toISOString(),
            duracaoMs: Date.now() - start
        };
    } catch (error) {
        return {
            url: pdf.url,
            textoLink: pdf.textoLink,
            nomeArquivo: pdf.nomeArquivo,
            data: pdf.data,
            ano: pdf.ano,
            reuniao: pdf.reuniao,
            tamanho: 0,
            tamanhoFormatado: '0 B',
            status: 'erro',
            erro: error.message,
            ehNovo: pdf.ehNovo !== undefined ? pdf.ehNovo : true,
            hash: null,
            downloadedAt: null,
            texto: null,
            numPaginas: 0,
            numCaracteres: 0,
            numPalavras: 0,
            ehEscaneado: false,
            info: null,
            statusExtracao: 'erro',
            erroExtracao: error.message,
            extractedAt: null,
            duracaoMs: Date.now() - start
        };
    }
}

/**
 * Pipeline principal — processa PDFs em batches concorrentes.
 *
 * @param {Array} pdfList - Lista de PDFs do scraper
 * @param {Object} [opcoes]
 * @param {number} [opcoes.concurrency=10] - Downloads paralelos por batch
 * @param {number} [opcoes.staggerMs=200] - Delay entre inícios no batch (anti-bloqueio)
 * @param {number} [opcoes.batchPauseMs=1000] - Pausa entre batches
 * @param {Function} [opcoes.onProgress] - Callback de progresso
 * @returns {Promise<Array>} Resultados processados
 */
async function processarPipeline(pdfList, opcoes = {}) {
    const concurrency = opcoes.concurrency || 10;
    const staggerMs = opcoes.staggerMs || 200;
    const batchPauseMs = opcoes.batchPauseMs || 1000;
    const onProgress = opcoes.onProgress || null;

    const total = pdfList.length;
    const resultados = [];
    let sucessos = 0;
    let erros = 0;
    const startTime = Date.now();
    const totalBatches = Math.ceil(total / concurrency);

    console.log('');
    console.log('[Pipeline] ════════════════════════════════════════════════');
    console.log(`[Pipeline] PROCESSAMENTO RAPIDO: ${total} PDFs`);
    console.log(`[Pipeline] Concorrencia: ${concurrency} | Stagger: ${staggerMs}ms`);
    console.log(`[Pipeline] Batches: ${totalBatches} | Pausa: ${batchPauseMs}ms`);
    console.log('[Pipeline] Custo: R$ 0,00 (pdf-parse + regex, 100% local)');
    console.log('[Pipeline] ════════════════════════════════════════════════');
    console.log('');

    for (let i = 0; i < total; i += concurrency) {
        const chunk = pdfList.slice(i, i + concurrency);
        const batchNum = Math.floor(i / concurrency) + 1;

        // Launch chunk with staggered starts
        const promises = chunk.map((pdf, idx) => {
            return new Promise(async (resolve) => {
                // Stagger: avoid 10 requests hitting the server at the exact same ms
                if (idx > 0) {
                    await sleep(staggerMs * idx);
                }
                const result = await processarUmPDF(pdf);
                resolve(result);
            });
        });

        const chunkResults = await Promise.all(promises);

        for (const r of chunkResults) {
            resultados.push(r);
            if (r.statusExtracao === 'sucesso') {
                sucessos++;
            } else {
                erros++;
            }
        }

        // Progress
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
        const pct = Math.round((resultados.length / total) * 100);
        const rate = resultados.length / (Number(elapsedSec) || 1);
        const remaining = total - resultados.length;
        const eta = rate > 0 ? Math.round(remaining / rate) : '?';

        console.log(
            `[Pipeline] Batch ${batchNum}/${totalBatches} | ` +
            `${resultados.length}/${total} (${pct}%) | ` +
            `${sucessos} OK, ${erros} erros | ` +
            `${elapsedSec}s | ETA: ~${eta}s`
        );

        if (onProgress) {
            onProgress({
                batch: batchNum,
                totalBatches,
                processados: resultados.length,
                total,
                percentual: pct,
                sucessos,
                erros,
                tempoDecorrido: `${elapsedSec}s`,
                etaSegundos: eta
            });
        }

        // Pause between batches (except last)
        if (i + concurrency < total) {
            await sleep(batchPauseMs);
        }
    }

    const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalCaracteres = resultados.reduce((sum, r) => sum + (r.numCaracteres || 0), 0);
    const totalBytes = resultados.reduce((sum, r) => sum + (r.tamanho || 0), 0);

    console.log('');
    console.log('[Pipeline] ════════════════════════════════════════════════');
    console.log(`[Pipeline] CONCLUIDO em ${totalTimeSec}s`);
    console.log(`[Pipeline] ${sucessos} PDFs OK | ${erros} erros`);
    console.log(`[Pipeline] ${formatBytes(totalBytes)} baixados`);
    console.log(`[Pipeline] ${totalCaracteres.toLocaleString()} caracteres extraidos`);
    console.log(`[Pipeline] Velocidade: ${(resultados.length / (Number(totalTimeSec) || 1)).toFixed(1)} PDFs/s`);
    console.log('[Pipeline] ════════════════════════════════════════════════');
    console.log('');

    return resultados;
}

module.exports = { processarPipeline, downloadRapido, extrairTexto };
