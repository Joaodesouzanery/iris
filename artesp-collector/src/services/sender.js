/**
 * Serviço de Envio para Lovable
 * Responsável por enviar os dados extraídos para o endpoint da Lovable
 */

const axios = require('axios');

/**
 * Função auxiliar para aguardar um tempo
 * @param {number} ms - Milissegundos para aguardar
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Envia um PDF para o endpoint da Lovable
 * @param {Object} pdf - Objeto com dados do PDF
 * @param {string} endpoint - URL do endpoint da Lovable
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendToLovable(pdf, endpoint) {
    console.log(`[Sender] Enviando para Lovable: ${pdf.nomeArquivo}`);

    if (!endpoint) {
        throw new Error('Endpoint da Lovable não configurado');
    }

    if (!pdf.texto) {
        throw new Error('PDF não possui texto extraído');
    }

    // Monta payload no formato esperado pela Lovable
    const payload = {
        agencia: 'ARTESP',
        nome_arquivo: pdf.nomeArquivo,
        texto_pdf: pdf.texto
    };

    try {
        const response = await axios.post(endpoint, payload, {
            timeout: 60000, // 60 segundos
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log(`[Sender] Envio bem-sucedido: ${pdf.nomeArquivo} (Status: ${response.status})`);

        return {
            nomeArquivo: pdf.nomeArquivo,
            status: 'sucesso',
            statusCode: response.status,
            resposta: response.data,
            erro: null
        };

    } catch (error) {
        const statusCode = error.response?.status || null;
        const mensagemErro = error.response?.data?.message || error.message;

        console.error(`[Sender] Erro ao enviar ${pdf.nomeArquivo}:`, mensagemErro);

        return {
            nomeArquivo: pdf.nomeArquivo,
            status: 'erro',
            statusCode: statusCode,
            resposta: null,
            erro: mensagemErro
        };
    }
}

/**
 * Envia um PDF com retry em caso de falha
 * @param {Object} pdf - Objeto com dados do PDF
 * @param {string} endpoint - URL do endpoint da Lovable
 * @param {number} maxRetries - Número máximo de tentativas
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendWithRetry(pdf, endpoint, maxRetries = 3) {
    let lastResult;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[Sender] Tentativa ${attempt} de ${maxRetries} para ${pdf.nomeArquivo}`);

        const result = await sendToLovable(pdf, endpoint);

        if (result.status === 'sucesso') {
            return result;
        }

        lastResult = result;

        // Verifica se é um erro que vale a pena tentar novamente
        const retryableErrors = [408, 429, 500, 502, 503, 504];
        const shouldRetry = result.statusCode && retryableErrors.includes(result.statusCode);

        if (!shouldRetry) {
            console.warn(`[Sender] Erro não recuperável para ${pdf.nomeArquivo}: ${result.erro}`);
            return result;
        }

        if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`[Sender] Aguardando ${delay}ms antes da próxima tentativa...`);
            await sleep(delay);
        }
    }

    return lastResult;
}

/**
 * Envia múltiplos PDFs para a Lovable
 * @param {Array} pdfs - Array de objetos com dados dos PDFs
 * @param {string} endpoint - URL do endpoint da Lovable
 * @param {number} delayMs - Delay entre envios em ms
 * @returns {Promise<Object>} Resultado geral do envio
 */
async function sendMultipleToLovable(pdfs, endpoint, delayMs = 1000) {
    console.log(`[Sender] Iniciando envio de ${pdfs.length} PDFs para Lovable...`);
    console.log(`[Sender] Endpoint: ${endpoint}`);

    if (!endpoint) {
        throw new Error('Endpoint da Lovable não configurado');
    }

    // Filtra apenas PDFs com texto extraído
    const pdfsComTexto = pdfs.filter(pdf => pdf.texto && pdf.statusExtracao === 'sucesso');

    if (pdfsComTexto.length === 0) {
        console.warn('[Sender] Nenhum PDF com texto disponível para envio');
        return {
            total: pdfs.length,
            enviados: 0,
            sucessos: 0,
            erros: 0,
            pulados: pdfs.length,
            resultados: []
        };
    }

    console.log(`[Sender] ${pdfsComTexto.length} PDFs com texto serão enviados`);

    const resultados = [];

    for (let i = 0; i < pdfsComTexto.length; i++) {
        const pdf = pdfsComTexto[i];
        console.log(`[Sender] Enviando ${i + 1}/${pdfsComTexto.length}: ${pdf.nomeArquivo}`);

        const resultado = await sendWithRetry(pdf, endpoint);
        resultados.push(resultado);

        // Aguarda delay entre envios (exceto no último)
        if (i < pdfsComTexto.length - 1) {
            console.log(`[Sender] Aguardando ${delayMs}ms antes do próximo envio...`);
            await sleep(delayMs);
        }
    }

    const sucessos = resultados.filter(r => r.status === 'sucesso').length;
    const erros = resultados.filter(r => r.status === 'erro').length;
    const pulados = pdfs.length - pdfsComTexto.length;

    console.log(`[Sender] Envio concluído:`);
    console.log(`[Sender] - Sucessos: ${sucessos}`);
    console.log(`[Sender] - Erros: ${erros}`);
    console.log(`[Sender] - Pulados (sem texto): ${pulados}`);

    return {
        total: pdfs.length,
        enviados: pdfsComTexto.length,
        sucessos,
        erros,
        pulados,
        resultados
    };
}

/**
 * Valida se um endpoint é uma URL válida
 * @param {string} endpoint - URL para validar
 * @returns {boolean} true se é uma URL válida
 */
function isValidEndpoint(endpoint) {
    if (!endpoint) return false;

    try {
        const url = new URL(endpoint);
        return ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
}

/**
 * Testa conexão com o endpoint da Lovable
 * @param {string} endpoint - URL do endpoint
 * @returns {Promise<Object>} Resultado do teste
 */
async function testConnection(endpoint) {
    console.log(`[Sender] Testando conexão com: ${endpoint}`);

    if (!isValidEndpoint(endpoint)) {
        return {
            success: false,
            message: 'Endpoint inválido. Deve ser uma URL HTTP/HTTPS válida.'
        };
    }

    try {
        // Tenta uma requisição OPTIONS ou HEAD para verificar conexão
        const response = await axios.head(endpoint, {
            timeout: 10000,
            validateStatus: () => true // Aceita qualquer status
        });

        console.log(`[Sender] Conexão testada: Status ${response.status}`);

        return {
            success: true,
            statusCode: response.status,
            message: `Conexão estabelecida (Status: ${response.status})`
        };

    } catch (error) {
        console.error(`[Sender] Falha no teste de conexão:`, error.message);

        return {
            success: false,
            message: `Falha na conexão: ${error.message}`
        };
    }
}

module.exports = {
    sendToLovable,
    sendWithRetry,
    sendMultipleToLovable,
    isValidEndpoint,
    testConnection
};
