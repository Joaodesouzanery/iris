/**
 * Serviço de Download de PDFs
 * Responsável por baixar PDFs em memória (sem salvar em disco)
 */

const axios = require('axios');

// Timeout para download
const DOWNLOAD_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 30000;

// Magic number do PDF (primeiros bytes)
const PDF_MAGIC_NUMBER = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

/**
 * Função auxiliar para aguardar um tempo
 * @param {number} ms - Milissegundos para aguardar
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Valida se o buffer é um PDF válido
 * @param {Buffer} buffer - Buffer para validar
 * @returns {boolean} true se é um PDF válido
 */
function isValidPDF(buffer) {
    if (!buffer || buffer.length < 4) {
        return false;
    }

    // Verifica se começa com %PDF
    const header = buffer.slice(0, 4);
    return header.equals(PDF_MAGIC_NUMBER);
}

/**
 * Baixa um PDF da URL fornecida
 * @param {string} url - URL do PDF
 * @param {string} nomeArquivo - Nome do arquivo para logging
 * @returns {Promise<Buffer>} Buffer do PDF
 */
async function downloadPDF(url, nomeArquivo = 'arquivo.pdf') {
    console.log(`[Downloader] Iniciando download: ${nomeArquivo}`);
    console.log(`[Downloader] URL: ${url}`);

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: DOWNLOAD_TIMEOUT,
            maxContentLength: 50 * 1024 * 1024, // Max 50MB
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/pdf,*/*',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        const buffer = Buffer.from(response.data);
        console.log(`[Downloader] Download concluído: ${nomeArquivo} (${formatBytes(buffer.length)})`);

        // Valida se é um PDF válido
        if (!isValidPDF(buffer)) {
            throw new Error('O arquivo baixado não é um PDF válido');
        }

        console.log(`[Downloader] PDF validado com sucesso: ${nomeArquivo}`);
        return buffer;

    } catch (error) {
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

            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
                console.log(`[Downloader] Aguardando ${delay}ms antes da próxima tentativa...`);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}

/**
 * Baixa múltiplos PDFs com delay entre downloads
 * @param {Array} pdfList - Lista de objetos com url e nomeArquivo
 * @param {number} delayMs - Delay entre downloads em ms
 * @returns {Promise<Array>} Array de objetos com buffer e metadados
 */
async function downloadMultiplePDFs(pdfList, delayMs = 1000) {
    console.log(`[Downloader] Iniciando download de ${pdfList.length} PDFs...`);
    const resultados = [];

    for (let i = 0; i < pdfList.length; i++) {
        const pdf = pdfList[i];
        console.log(`[Downloader] Processando ${i + 1}/${pdfList.length}: ${pdf.nomeArquivo}`);

        try {
            const buffer = await downloadWithRetry(pdf.url, pdf.nomeArquivo);
            resultados.push({
                ...pdf,
                buffer: buffer,
                tamanho: buffer.length,
                tamanhoFormatado: formatBytes(buffer.length),
                status: 'sucesso',
                erro: null
            });
        } catch (error) {
            console.error(`[Downloader] Falha ao baixar ${pdf.nomeArquivo}:`, error.message);
            resultados.push({
                ...pdf,
                buffer: null,
                tamanho: 0,
                tamanhoFormatado: '0 B',
                status: 'erro',
                erro: error.message
            });
        }

        // Aguarda delay entre downloads (exceto no último)
        if (i < pdfList.length - 1) {
            console.log(`[Downloader] Aguardando ${delayMs}ms antes do próximo download...`);
            await sleep(delayMs);
        }
    }

    const sucessos = resultados.filter(r => r.status === 'sucesso').length;
    const erros = resultados.filter(r => r.status === 'erro').length;
    console.log(`[Downloader] Download concluído: ${sucessos} sucesso(s), ${erros} erro(s)`);

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
    formatBytes
};
