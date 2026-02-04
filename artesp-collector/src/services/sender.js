/**
 * Serviço de Envio para Lovable
 * Responsável por enviar os dados extraídos para o endpoint da Lovable
 *
 * Inclui:
 * - Metadata adicional nos payloads
 * - Logging detalhado
 * - Retry com exponential backoff
 */

const axios = require('axios');
const logger = require('./logger');
const { getDelay } = require('./scraper');

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
    const startTime = Date.now();
    console.log(`[Sender] Enviando para Lovable: ${pdf.nomeArquivo}`);

    if (!endpoint) {
        const erro = new Error('Endpoint da Lovable não configurado');
        await logger.logError(logger.OPERATION_TYPES.SEND, erro, {
            arquivo: pdf.nomeArquivo
        });
        throw erro;
    }

    if (!pdf.texto) {
        const erro = new Error('PDF não possui texto extraído');
        await logger.logError(logger.OPERATION_TYPES.SEND, erro, {
            arquivo: pdf.nomeArquivo
        });
        throw erro;
    }

    // Monta payload no formato esperado pela Lovable com metadata adicional
    const payload = {
        agencia: 'ARTESP',
        nome_arquivo: pdf.nomeArquivo,
        texto_pdf: pdf.texto,
        metadata: {
            data_coleta: pdf.extractedAt || new Date().toISOString(),
            eh_novo: pdf.ehNovo === true,
            url_original: pdf.url,
            data_documento: pdf.data || null,
            ano: pdf.ano || null,
            reuniao: pdf.reuniao || null,
            num_paginas: pdf.numPaginas || 0,
            num_caracteres: pdf.numCaracteres || 0,
            num_palavras: pdf.numPalavras || 0,
            tamanho_arquivo: pdf.tamanhoFormatado || '0 B',
            eh_escaneado: pdf.ehEscaneado || false,
            hash: pdf.hash || null
        }
    };

    try {
        const response = await axios.post(endpoint, payload, {
            timeout: 60000, // 60 segundos
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Source': 'artesp-collector',
                'X-Timestamp': new Date().toISOString()
            },
            maxContentLength: 50 * 1024 * 1024, // 50MB
            maxBodyLength: 50 * 1024 * 1024
        });

        const duracao = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`[Sender] Envio bem-sucedido: ${pdf.nomeArquivo} (Status: ${response.status}) em ${duracao}s`);

        await logger.logSuccess(logger.OPERATION_TYPES.SEND, {
            arquivo: pdf.nomeArquivo,
            statusCode: response.status,
            duracao: `${duracao}s`,
            ehNovo: pdf.ehNovo
        });

        return {
            nomeArquivo: pdf.nomeArquivo,
            status: 'sucesso',
            statusCode: response.status,
            resposta: response.data,
            erro: null,
            duracao: `${duracao}s`
        };

    } catch (error) {
        const duracao = ((Date.now() - startTime) / 1000).toFixed(2);
        const statusCode = error.response?.status || null;
        const mensagemErro = error.response?.data?.message || error.message;

        await logger.logError(logger.OPERATION_TYPES.SEND, error, {
            arquivo: pdf.nomeArquivo,
            statusCode,
            duracao: `${duracao}s`
        });

        console.error(`[Sender] Erro ao enviar ${pdf.nomeArquivo}:`, mensagemErro);

        return {
            nomeArquivo: pdf.nomeArquivo,
            status: 'erro',
            statusCode: statusCode,
            resposta: null,
            erro: mensagemErro,
            duracao: `${duracao}s`
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

            await logger.logWarning(logger.OPERATION_TYPES.SEND,
                `Erro não recuperável: ${result.erro}`, {
                arquivo: pdf.nomeArquivo,
                statusCode: result.statusCode
            });

            return result;
        }

        if (attempt < maxRetries) {
            // Exponential backoff com jitter
            const baseDelay = Math.pow(2, attempt) * 1000;
            const jitter = Math.random() * 1000;
            const delay = baseDelay + jitter;

            console.log(`[Sender] Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);

            await logger.logWarning(logger.OPERATION_TYPES.SEND,
                `Tentativa ${attempt} falhou, aguardando retry`, {
                arquivo: pdf.nomeArquivo,
                tentativa: attempt,
                proximaTentativaEm: `${Math.round(delay)}ms`
            });

            await sleep(delay);
        }
    }

    return lastResult;
}

/**
 * Envia múltiplos PDFs para a Lovable
 * @param {Array} pdfs - Array de objetos com dados dos PDFs
 * @param {string} endpoint - URL do endpoint da Lovable
 * @param {Function} onProgress - Callback de progresso (opcional)
 * @returns {Promise<Object>} Resultado geral do envio
 */
async function sendMultipleToLovable(pdfs, endpoint, onProgress = null) {
    console.log(`[Sender] Iniciando envio de ${pdfs.length} PDFs para Lovable...`);
    console.log(`[Sender] Endpoint: ${endpoint}`);

    await logger.logStart(logger.OPERATION_TYPES.SEND, {
        totalPdfs: pdfs.length,
        endpoint: endpoint.substring(0, 50)
    });

    if (!endpoint) {
        throw new Error('Endpoint da Lovable não configurado');
    }

    // Filtra apenas PDFs com texto extraído
    const pdfsComTexto = pdfs.filter(pdf => pdf.texto && pdf.statusExtracao === 'sucesso');

    if (pdfsComTexto.length === 0) {
        console.warn('[Sender] Nenhum PDF com texto disponível para envio');

        await logger.logWarning(logger.OPERATION_TYPES.SEND,
            'Nenhum PDF com texto disponível', {
            totalRecebido: pdfs.length
        });

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
    const startTime = Date.now();

    for (let i = 0; i < pdfsComTexto.length; i++) {
        const pdf = pdfsComTexto[i];
        console.log(`[Sender] Enviando ${i + 1}/${pdfsComTexto.length}: ${pdf.nomeArquivo}`);

        // Callback de progresso
        if (onProgress) {
            onProgress({
                atual: i + 1,
                total: pdfsComTexto.length,
                arquivo: pdf.nomeArquivo,
                percentual: Math.round(((i + 1) / pdfsComTexto.length) * 100)
            });
        }

        const resultado = await sendWithRetry(pdf, endpoint);
        resultados.push(resultado);

        // Aguarda delay aleatório entre envios (exceto no último)
        if (i < pdfsComTexto.length - 1) {
            const delay = getDelay();
            console.log(`[Sender] Aguardando ${delay}ms antes do próximo envio...`);
            await sleep(delay);
        }
    }

    const duracao = ((Date.now() - startTime) / 1000).toFixed(2);
    const sucessos = resultados.filter(r => r.status === 'sucesso').length;
    const erros = resultados.filter(r => r.status === 'erro').length;
    const pulados = pdfs.length - pdfsComTexto.length;

    console.log(`[Sender] Envio concluído em ${duracao}s:`);
    console.log(`[Sender] - Sucessos: ${sucessos}`);
    console.log(`[Sender] - Erros: ${erros}`);
    console.log(`[Sender] - Pulados (sem texto): ${pulados}`);

    await logger.logSuccess(logger.OPERATION_TYPES.SEND, {
        mensagem: `${sucessos} PDFs enviados com sucesso`,
        sucessos,
        erros,
        pulados,
        duracao: `${duracao}s`
    });

    return {
        total: pdfs.length,
        enviados: pdfsComTexto.length,
        sucessos,
        erros,
        pulados,
        resultados,
        duracao: `${duracao}s`
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

        await logger.log(logger.OPERATION_TYPES.SEND, logger.STATUS.INFO, {
            mensagem: 'Teste de conexão realizado',
            endpoint: endpoint.substring(0, 50),
            statusCode: response.status
        });

        return {
            success: true,
            statusCode: response.status,
            message: `Conexão estabelecida (Status: ${response.status})`
        };

    } catch (error) {
        console.error(`[Sender] Falha no teste de conexão:`, error.message);

        await logger.logError(logger.OPERATION_TYPES.SEND, error, {
            mensagem: 'Falha no teste de conexão',
            endpoint: endpoint.substring(0, 50)
        });

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
