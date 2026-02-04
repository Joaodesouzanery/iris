/**
 * Serviço de Extração de Texto de PDFs
 * Responsável por extrair texto de buffers de PDF usando pdf-parse
 *
 * Inclui:
 * - Tratamento robusto de erros
 * - Logging detalhado
 * - Preservação de metadados
 */

const pdfParse = require('pdf-parse');
const logger = require('./logger');

/**
 * Extrai texto de um buffer de PDF
 * @param {Buffer} pdfBuffer - Buffer do PDF
 * @param {string} nomeArquivo - Nome do arquivo para logging
 * @returns {Promise<Object>} Objeto com texto extraído e metadados
 */
async function extractText(pdfBuffer, nomeArquivo = 'arquivo.pdf') {
    const startTime = Date.now();
    console.log(`[Extractor] Iniciando extração de texto: ${nomeArquivo}`);

    if (!pdfBuffer || pdfBuffer.length === 0) {
        const erro = new Error('Buffer do PDF está vazio');
        await logger.logError(logger.OPERATION_TYPES.EXTRACT, erro, {
            arquivo: nomeArquivo
        });
        throw erro;
    }

    try {
        // Opções para o pdf-parse
        const options = {
            // Preserva quebras de linha para manter estrutura
            preserveFormFeed: true,
            // Máximo de páginas a processar (0 = todas)
            max: 0
        };

        const data = await pdfParse(pdfBuffer, options);

        // Limpa e formata o texto
        const textoLimpo = limparTexto(data.text);

        // Detecta se o PDF tem texto selecionável ou é escaneado
        const ehEscaneado = detectarPDFEscaneado(textoLimpo, data.numpages);

        const duracao = ((Date.now() - startTime) / 1000).toFixed(2);

        const resultado = {
            texto: textoLimpo,
            numPaginas: data.numpages,
            numCaracteres: textoLimpo.length,
            numPalavras: contarPalavras(textoLimpo),
            ehEscaneado: ehEscaneado,
            info: {
                titulo: data.info?.Title || null,
                autor: data.info?.Author || null,
                assunto: data.info?.Subject || null,
                criador: data.info?.Creator || null,
                produtor: data.info?.Producer || null,
                dataCriacao: data.info?.CreationDate || null,
                dataModificacao: data.info?.ModDate || null
            },
            duracao: `${duracao}s`
        };

        console.log(`[Extractor] Extração concluída: ${nomeArquivo}`);
        console.log(`[Extractor] - Páginas: ${resultado.numPaginas}`);
        console.log(`[Extractor] - Caracteres: ${resultado.numCaracteres}`);
        console.log(`[Extractor] - Palavras: ${resultado.numPalavras}`);
        console.log(`[Extractor] - PDF escaneado: ${ehEscaneado ? 'Sim (pode ter pouco texto)' : 'Não'}`);
        console.log(`[Extractor] - Duração: ${duracao}s`);

        await logger.logSuccess(logger.OPERATION_TYPES.EXTRACT, {
            arquivo: nomeArquivo,
            paginas: resultado.numPaginas,
            caracteres: resultado.numCaracteres,
            palavras: resultado.numPalavras,
            ehEscaneado,
            duracao: `${duracao}s`
        });

        return resultado;

    } catch (error) {
        const duracao = ((Date.now() - startTime) / 1000).toFixed(2);

        await logger.logError(logger.OPERATION_TYPES.EXTRACT, error, {
            arquivo: nomeArquivo,
            tamanhoBuffer: pdfBuffer.length,
            duracao: `${duracao}s`
        });

        console.error(`[Extractor] Erro ao extrair texto de ${nomeArquivo}:`, error.message);
        throw new Error(`Falha na extração de texto de ${nomeArquivo}: ${error.message}`);
    }
}

/**
 * Detecta se um PDF é provavelmente escaneado (imagem)
 * @param {string} texto - Texto extraído
 * @param {number} numPaginas - Número de páginas
 * @returns {boolean} true se parecer ser escaneado
 */
function detectarPDFEscaneado(texto, numPaginas) {
    if (!texto || numPaginas === 0) return true;

    // Média de caracteres por página
    const mediaCaracteresPorPagina = texto.length / numPaginas;

    // PDFs escaneados geralmente têm muito pouco texto
    // Uma página típica com texto tem pelo menos 500-1000 caracteres
    return mediaCaracteresPorPagina < 100;
}

/**
 * Limpa e formata o texto extraído
 * @param {string} texto - Texto bruto
 * @returns {string} Texto limpo
 */
function limparTexto(texto) {
    if (!texto) return '';

    return texto
        // Remove caracteres de controle exceto quebras de linha e tabs
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normaliza diferentes tipos de quebra de linha
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Normaliza múltiplas quebras de linha para no máximo duas
        .replace(/\n{3,}/g, '\n\n')
        // Remove espaços em excesso no início/fim de cada linha
        .split('\n')
        .map(linha => linha.trim())
        .join('\n')
        // Remove espaços múltiplos
        .replace(/[ \t]{2,}/g, ' ')
        // Remove linhas vazias no início e fim
        .trim();
}

/**
 * Conta palavras no texto
 * @param {string} texto - Texto para contar
 * @returns {number} Número de palavras
 */
function contarPalavras(texto) {
    if (!texto) return 0;
    return texto.split(/\s+/).filter(palavra => palavra.length > 0).length;
}

/**
 * Extrai texto de múltiplos PDFs
 * @param {Array} pdfsComBuffer - Array de objetos com buffer e metadados
 * @param {Function} onProgress - Callback de progresso (opcional)
 * @returns {Promise<Array>} Array de objetos com texto extraído
 */
async function extractFromMultiple(pdfsComBuffer, onProgress = null) {
    console.log(`[Extractor] Iniciando extração de ${pdfsComBuffer.length} PDFs...`);

    await logger.logStart(logger.OPERATION_TYPES.EXTRACT, {
        totalPdfs: pdfsComBuffer.length
    });

    const resultados = [];
    const startTime = Date.now();

    for (let i = 0; i < pdfsComBuffer.length; i++) {
        const pdf = pdfsComBuffer[i];
        console.log(`[Extractor] Processando ${i + 1}/${pdfsComBuffer.length}: ${pdf.nomeArquivo}`);

        // Callback de progresso
        if (onProgress) {
            onProgress({
                atual: i + 1,
                total: pdfsComBuffer.length,
                arquivo: pdf.nomeArquivo,
                percentual: Math.round(((i + 1) / pdfsComBuffer.length) * 100)
            });
        }

        // Se o PDF teve erro no download, pula
        if (pdf.status === 'erro' || !pdf.buffer) {
            console.warn(`[Extractor] Pulando ${pdf.nomeArquivo} - PDF com erro no download`);

            await logger.log(logger.OPERATION_TYPES.EXTRACT, logger.STATUS.SKIPPED, {
                arquivo: pdf.nomeArquivo,
                motivo: 'PDF com erro no download'
            });

            resultados.push({
                ...pdf,
                texto: null,
                numPaginas: 0,
                numCaracteres: 0,
                numPalavras: 0,
                info: null,
                statusExtracao: 'erro',
                erroExtracao: pdf.erro || 'PDF não disponível'
            });
            continue;
        }

        try {
            const extracao = await extractText(pdf.buffer, pdf.nomeArquivo);
            resultados.push({
                // Metadados originais (sem o buffer para economizar memória)
                url: pdf.url,
                textoLink: pdf.textoLink,
                nomeArquivo: pdf.nomeArquivo,
                data: pdf.data,
                ano: pdf.ano,
                reuniao: pdf.reuniao,
                tamanho: pdf.tamanho,
                tamanhoFormatado: pdf.tamanhoFormatado,
                status: pdf.status,
                erro: pdf.erro,
                ehNovo: pdf.ehNovo,
                hash: pdf.hash,
                downloadedAt: pdf.downloadedAt,
                // Dados da extração
                texto: extracao.texto,
                numPaginas: extracao.numPaginas,
                numCaracteres: extracao.numCaracteres,
                numPalavras: extracao.numPalavras,
                ehEscaneado: extracao.ehEscaneado,
                info: extracao.info,
                statusExtracao: 'sucesso',
                erroExtracao: null,
                extractedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error(`[Extractor] Falha ao extrair ${pdf.nomeArquivo}:`, error.message);
            resultados.push({
                // Metadados originais
                url: pdf.url,
                textoLink: pdf.textoLink,
                nomeArquivo: pdf.nomeArquivo,
                data: pdf.data,
                ano: pdf.ano,
                reuniao: pdf.reuniao,
                tamanho: pdf.tamanho,
                tamanhoFormatado: pdf.tamanhoFormatado,
                status: pdf.status,
                erro: pdf.erro,
                ehNovo: pdf.ehNovo,
                hash: pdf.hash,
                downloadedAt: pdf.downloadedAt,
                // Dados da extração (erro)
                texto: null,
                numPaginas: 0,
                numCaracteres: 0,
                numPalavras: 0,
                ehEscaneado: false,
                info: null,
                statusExtracao: 'erro',
                erroExtracao: error.message,
                extractedAt: null
            });
        }
    }

    const duracao = ((Date.now() - startTime) / 1000).toFixed(2);
    const sucessos = resultados.filter(r => r.statusExtracao === 'sucesso').length;
    const erros = resultados.filter(r => r.statusExtracao === 'erro').length;
    const totalCaracteres = resultados.reduce((sum, r) => sum + (r.numCaracteres || 0), 0);

    console.log(`[Extractor] Extração concluída em ${duracao}s:`);
    console.log(`[Extractor] - Sucessos: ${sucessos}`);
    console.log(`[Extractor] - Erros: ${erros}`);
    console.log(`[Extractor] - Total de caracteres: ${totalCaracteres}`);

    await logger.logSuccess(logger.OPERATION_TYPES.EXTRACT, {
        mensagem: `${sucessos} PDFs extraídos com sucesso`,
        sucessos,
        erros,
        totalCaracteres,
        duracao: `${duracao}s`
    });

    return resultados;
}

/**
 * Gera estatísticas sobre os PDFs processados
 * @param {Array} pdfsProcessados - Array de PDFs com texto extraído
 * @returns {Object} Estatísticas
 */
function gerarEstatisticas(pdfsProcessados) {
    const totalPDFs = pdfsProcessados.length;
    const pdfsSucesso = pdfsProcessados.filter(p => p.statusExtracao === 'sucesso');
    const pdfsErro = pdfsProcessados.filter(p => p.statusExtracao === 'erro');
    const pdfsNovos = pdfsProcessados.filter(p => p.ehNovo === true);
    const pdfsJaColetados = pdfsProcessados.filter(p => p.ehNovo === false);

    const totalPaginas = pdfsSucesso.reduce((sum, p) => sum + (p.numPaginas || 0), 0);
    const totalCaracteres = pdfsSucesso.reduce((sum, p) => sum + (p.numCaracteres || 0), 0);
    const totalPalavras = pdfsSucesso.reduce((sum, p) => sum + (p.numPalavras || 0), 0);
    const totalBytes = pdfsSucesso.reduce((sum, p) => sum + (p.tamanho || 0), 0);

    return {
        totalPDFs,
        pdfsSucesso: pdfsSucesso.length,
        pdfsErro: pdfsErro.length,
        pdfsNovos: pdfsNovos.length,
        pdfsJaColetados: pdfsJaColetados.length,
        totalPaginas,
        totalCaracteres,
        totalPalavras,
        totalBytes,
        mediaCaracteresPorPDF: pdfsSucesso.length > 0
            ? Math.round(totalCaracteres / pdfsSucesso.length)
            : 0,
        mediaPalavrasPorPDF: pdfsSucesso.length > 0
            ? Math.round(totalPalavras / pdfsSucesso.length)
            : 0,
        mediaPaginasPorPDF: pdfsSucesso.length > 0
            ? Math.round(totalPaginas / pdfsSucesso.length)
            : 0
    };
}

module.exports = {
    extractText,
    extractFromMultiple,
    limparTexto,
    contarPalavras,
    gerarEstatisticas,
    detectarPDFEscaneado
};
