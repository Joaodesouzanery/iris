/**
 * Serviço de Download de PDFs
 * Responsável por baixar PDFs em memória (sem salvar em disco)
 *
 * Inclui proteções contra bloqueio:
 * - User-Agent rotation
 * - Delays aleatórios entre downloads
 * - Retry com exponential backoff
 */

const axios = require('axios');
const { getRandomUserAgent, getDelay } = require('./scraper');
const logger = require('./logger');

// Timeout para download
const DOWNLOAD_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 30000;

// Magic number do PDF (primeiros bytes)
const PDF_MAGIC_NUMBER = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

// Tamanho máximo de PDF (50MB)
const MAX_PDF_SIZE = 50 * 1024 * 1024;

/**
 * Função auxiliar para aguardar um tempo
 * @param {number} ms - Milissegundos para aguardar
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Valida se o buffer é um PDF válido
 * @param {Buffer} buffer - Buffer para validar
 * @returns {Object} Resultado da validação
 */
function validatePDF(buffer) {
    const resultado = {
        valido: false,
        motivo: null,
        tamanho: 0
    };

    if (!buffer) {
        resultado.motivo = 'Buffer vazio ou nulo';
        return resultado;
    }

    resultado.tamanho = buffer.length;

    if (buffer.length < 4) {
        resultado.motivo = 'Arquivo muito pequeno para ser um PDF';
        return resultado;
    }

    if (buffer.length > MAX_PDF_SIZE) {
        resultado.motivo = `Arquivo muito grande (${formatBytes(buffer.length)} > ${formatBytes(MAX_PDF_SIZE)})`;
        return resultado;
    }

    // Verifica se começa com %PDF
    const header = buffer.slice(0, 4);
    const headerStr = header.toString('utf8');

    // DEBUG: Mostra primeiros bytes do arquivo
    const primeiros100 = buffer.slice(0, 100).toString('utf8').replace(/[^\x20-\x7E]/g, '.');
    console.log(`[Downloader] [DEBUG] Primeiros 100 bytes: "${primeiros100}"`);

    if (!header.equals(PDF_MAGIC_NUMBER)) {
        // Verifica se é HTML (página de erro ou login)
        if (primeiros100.toLowerCase().includes('<!doctype') || primeiros100.toLowerCase().includes('<html')) {
            resultado.motivo = 'Servidor retornou HTML ao invés de PDF (possível página de login ou erro)';
        } else if (primeiros100.includes('PK')) {
            resultado.motivo = 'Arquivo parece ser um ZIP, não um PDF';
        } else {
            resultado.motivo = `Cabeçalho inválido: esperado "%PDF", recebido "${headerStr}"`;
        }
        return resultado;
    }

    // Verifica se contém %%EOF no final (característica de PDF válido)
    const tail = buffer.slice(-1024).toString('latin1');
    if (!tail.includes('%%EOF')) {
        // Pode ser um PDF incompleto, mas vamos aceitar
        console.warn('[Downloader] PDF pode estar truncado (sem %%EOF)');
    }

    resultado.valido = true;
    return resultado;
}

/**
 * Mantida para compatibilidade
 */
function isValidPDF(buffer) {
    return validatePDF(buffer).valido;
}

/**
 * Baixa um PDF da URL fornecida
 * @param {string} url - URL do PDF
 * @param {string} nomeArquivo - Nome do arquivo para logging
 * @returns {Promise<Buffer>} Buffer do PDF
 */
async function downloadPDF(url, nomeArquivo = 'arquivo.pdf') {
    const startTime = Date.now();
    const userAgent = getRandomUserAgent();

    console.log(`[Downloader] Iniciando download: ${nomeArquivo}`);
    console.log(`[Downloader] URL: ${url.substring(0, 80)}...`);

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: DOWNLOAD_TIMEOUT,
            maxContentLength: MAX_PDF_SIZE,
            maxBodyLength: MAX_PDF_SIZE,
            headers: {
                'User-Agent': userAgent,
                'Accept': 'application/pdf,application/octet-stream,*/*',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate'
            },
            // Segue redirects
            maxRedirects: 5,
            // Valida status
            validateStatus: (status) => status >= 200 && status < 400
        });

        const buffer = Buffer.from(response.data);
        const duracao = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`[Downloader] Download concluído: ${nomeArquivo} (${formatBytes(buffer.length)}) em ${duracao}s`);

        // Valida se é um PDF válido
        const validacao = validatePDF(buffer);
        if (!validacao.valido) {
            throw new Error(`PDF inválido: ${validacao.motivo}`);
        }

        console.log(`[Downloader] PDF validado com sucesso: ${nomeArquivo}`);

        await logger.logSuccess(logger.OPERATION_TYPES.DOWNLOAD, {
            arquivo: nomeArquivo,
            tamanho: formatBytes(buffer.length),
            duracao: `${duracao}s`
        });

        return buffer;

    } catch (error) {
        const duracao = ((Date.now() - startTime) / 1000).toFixed(2);

        await logger.logError(logger.OPERATION_TYPES.DOWNLOAD, error, {
            arquivo: nomeArquivo,
            url: url.substring(0, 80),
            duracao: `${duracao}s`
        });

        console.error(`[Downloader] Erro ao baixar ${nomeArquivo}:`, error.message);
        throw new Error(`Falha no download de ${nomeArquivo}: ${error.message}`);
    }
}

/**
 * Baixa um PDF com retry em caso de falha
 * @param {string} url - URL do PDF
 * @param {string} nomeArquivo - Nome do arquivo
 * @param {number} maxRetries - Número máximo de tentativas
 * @returns {Promise<Buffer>} Buffer do PDF
 */
async function downloadWithRetry(url, nomeArquivo = 'arquivo.pdf', maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Downloader] Tentativa ${attempt} de ${maxRetries} para ${nomeArquivo}`);
            const buffer = await downloadPDF(url, nomeArquivo);
            return buffer;
        } catch (error) {
            lastError = error;
            console.warn(`[Downloader] Tentativa ${attempt} falhou para ${nomeArquivo}: ${error.message}`);

            await logger.logWarning(logger.OPERATION_TYPES.DOWNLOAD, `Tentativa ${attempt} falhou`, {
                arquivo: nomeArquivo,
                tentativa: attempt,
                maxTentativas: maxRetries,
                erro: error.message
            });

            if (attempt < maxRetries) {
                // Exponential backoff com jitter
                const baseDelay = Math.pow(2, attempt) * 1000;
                const jitter = Math.random() * 1000;
                const delay = baseDelay + jitter;

                console.log(`[Downloader] Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}

/**
 * Baixa múltiplos PDFs com delay aleatório entre downloads
 * @param {Array} pdfList - Lista de objetos com url e nomeArquivo
 * @param {Function} onProgress - Callback de progresso (opcional)
 * @returns {Promise<Array>} Array de objetos com buffer e metadados
 */
async function downloadMultiplePDFs(pdfList, onProgress = null) {
    console.log(`[Downloader] Iniciando download de ${pdfList.length} PDFs...`);

    await logger.logStart(logger.OPERATION_TYPES.DOWNLOAD, {
        totalPdfs: pdfList.length
    });

    const resultados = [];
    const startTime = Date.now();

    for (let i = 0; i < pdfList.length; i++) {
        const pdf = pdfList[i];
        console.log(`[Downloader] Processando ${i + 1}/${pdfList.length}: ${pdf.nomeArquivo}`);

        // Callback de progresso
        if (onProgress) {
            onProgress({
                atual: i + 1,
                total: pdfList.length,
                arquivo: pdf.nomeArquivo,
                percentual: Math.round(((i + 1) / pdfList.length) * 100)
            });
        }

        try {
            const buffer = await downloadWithRetry(pdf.url, pdf.nomeArquivo);
            resultados.push({
                ...pdf,
                buffer: buffer,
                tamanho: buffer.length,
                tamanhoFormatado: formatBytes(buffer.length),
                status: 'sucesso',
                erro: null,
                downloadedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error(`[Downloader] Falha ao baixar ${pdf.nomeArquivo}:`, error.message);
            resultados.push({
                ...pdf,
                buffer: null,
                tamanho: 0,
                tamanhoFormatado: '0 B',
                status: 'erro',
                erro: error.message,
                downloadedAt: null
            });
        }

        // Aguarda delay aleatório entre downloads (exceto no último)
        if (i < pdfList.length - 1) {
            const delay = getDelay();
            console.log(`[Downloader] Aguardando ${delay}ms antes do próximo download...`);
            await sleep(delay);
        }
    }

    const duracao = ((Date.now() - startTime) / 1000).toFixed(2);
    const sucessos = resultados.filter(r => r.status === 'sucesso').length;
    const erros = resultados.filter(r => r.status === 'erro').length;
    const totalBytes = resultados.reduce((sum, r) => sum + (r.tamanho || 0), 0);

    console.log(`[Downloader] Download concluído em ${duracao}s:`);
    console.log(`[Downloader] - Sucessos: ${sucessos}`);
    console.log(`[Downloader] - Erros: ${erros}`);
    console.log(`[Downloader] - Total baixado: ${formatBytes(totalBytes)}`);

    await logger.logSuccess(logger.OPERATION_TYPES.DOWNLOAD, {
        mensagem: `${sucessos} PDFs baixados com sucesso`,
        sucessos,
        erros,
        totalBytes: formatBytes(totalBytes),
        duracao: `${duracao}s`
    });

    return resultados;
}

/**
 * Formata bytes para string legível
 * @param {number} bytes - Número de bytes
 * @returns {string} String formatada
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
    downloadPDF,
    downloadWithRetry,
    downloadMultiplePDFs,
    isValidPDF,
    validatePDF,
    formatBytes
};
