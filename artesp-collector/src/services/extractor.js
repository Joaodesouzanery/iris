/**
 * Serviço de Extração de Texto de PDFs
 * Responsável por extrair texto de buffers de PDF usando pdf-parse
 */

const pdfParse = require('pdf-parse');

/**
 * Extrai texto de um buffer de PDF
 * @param {Buffer} pdfBuffer - Buffer do PDF
 * @param {string} nomeArquivo - Nome do arquivo para logging
 * @returns {Promise<Object>} Objeto com texto extraído e metadados
 */
async function extractText(pdfBuffer, nomeArquivo = 'arquivo.pdf') {
    console.log(`[Extractor] Iniciando extração de texto: ${nomeArquivo}`);

    if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Buffer do PDF está vazio');
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

        const resultado = {
            texto: textoLimpo,
            numPaginas: data.numpages,
            numCaracteres: textoLimpo.length,
            numPalavras: contarPalavras(textoLimpo),
            info: {
                titulo: data.info?.Title || null,
                autor: data.info?.Author || null,
                assunto: data.info?.Subject || null,
                criador: data.info?.Creator || null,
                produtor: data.info?.Producer || null,
                dataCriacao: data.info?.CreationDate || null,
                dataModificacao: data.info?.ModDate || null
            }
        };

        console.log(`[Extractor] Extração concluída: ${nomeArquivo}`);
        console.log(`[Extractor] - Páginas: ${resultado.numPaginas}`);
        console.log(`[Extractor] - Caracteres: ${resultado.numCaracteres}`);
        console.log(`[Extractor] - Palavras: ${resultado.numPalavras}`);

        return resultado;

    } catch (error) {
        console.error(`[Extractor] Erro ao extrair texto de ${nomeArquivo}:`, error.message);
        throw new Error(`Falha na extração de texto de ${nomeArquivo}: ${error.message}`);
    }
}

/**
 * Limpa e formata o texto extraído
 * @param {string} texto - Texto bruto
 * @returns {string} Texto limpo
 */
function limparTexto(texto) {
    if (!texto) return '';

    return texto
        // Remove caracteres de controle exceto quebras de linha
        .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
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
 * @returns {Promise<Array>} Array de objetos com texto extraído
 */
async function extractFromMultiple(pdfsComBuffer) {
    console.log(`[Extractor] Iniciando extração de ${pdfsComBuffer.length} PDFs...`);
    const resultados = [];

    for (let i = 0; i < pdfsComBuffer.length; i++) {
        const pdf = pdfsComBuffer[i];
        console.log(`[Extractor] Processando ${i + 1}/${pdfsComBuffer.length}: ${pdf.nomeArquivo}`);

        // Se o PDF teve erro no download, pula
        if (pdf.status === 'erro' || !pdf.buffer) {
            console.warn(`[Extractor] Pulando ${pdf.nomeArquivo} - PDF com erro no download`);
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
                // Dados da extração
                texto: extracao.texto,
                numPaginas: extracao.numPaginas,
                numCaracteres: extracao.numCaracteres,
                numPalavras: extracao.numPalavras,
                info: extracao.info,
                statusExtracao: 'sucesso',
                erroExtracao: null
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
                // Dados da extração (erro)
                texto: null,
                numPaginas: 0,
                numCaracteres: 0,
                numPalavras: 0,
                info: null,
                statusExtracao: 'erro',
                erroExtracao: error.message
            });
        }
    }

    const sucessos = resultados.filter(r => r.statusExtracao === 'sucesso').length;
    const erros = resultados.filter(r => r.statusExtracao === 'erro').length;
    console.log(`[Extractor] Extração concluída: ${sucessos} sucesso(s), ${erros} erro(s)`);

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

    const totalPaginas = pdfsSucesso.reduce((sum, p) => sum + (p.numPaginas || 0), 0);
    const totalCaracteres = pdfsSucesso.reduce((sum, p) => sum + (p.numCaracteres || 0), 0);
    const totalPalavras = pdfsSucesso.reduce((sum, p) => sum + (p.numPalavras || 0), 0);
    const totalBytes = pdfsSucesso.reduce((sum, p) => sum + (p.tamanho || 0), 0);

    return {
        totalPDFs,
        pdfsSucesso: pdfsSucesso.length,
        pdfsErro: pdfsErro.length,
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
    gerarEstatisticas
};
