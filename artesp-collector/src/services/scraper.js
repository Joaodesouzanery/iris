/**
 * Serviço de Web Scraping para ARTESP
 * Responsável por encontrar links de deliberações no site da ARTESP
 */

const axios = require('axios');
const cheerio = require('cheerio');

// URL da página de reuniões da diretoria
const REUNIOES_URL = 'https://www.artesp.sp.gov.br/artesp/transparencia/reunioes-diretoria';

// Anos que queremos filtrar
const ANOS_PERMITIDOS = ['2025', '2026'];

// Delay entre requisições para respeitar o servidor
const REQUEST_DELAY = parseInt(process.env.REQUEST_DELAY) || 1000;

/**
 * Função auxiliar para aguardar um tempo
 * @param {number} ms - Milissegundos para aguardar
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Faz scraping da página de reuniões da ARTESP
 * @returns {Promise<Array>} Lista de objetos com informações dos PDFs
 */
async function scrapePDFLinks() {
    console.log('[Scraper] Iniciando scraping da página de reuniões...');
    console.log(`[Scraper] URL: ${REUNIOES_URL}`);

    try {
        // Faz requisição à página principal
        const response = await axios.get(REUNIOES_URL, {
            timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        console.log(`[Scraper] Página carregada com sucesso (Status: ${response.status})`);

        // Carrega HTML no Cheerio para parsing
        const $ = cheerio.load(response.data);

        // Array para armazenar os PDFs encontrados
        const pdfsEncontrados = [];

        // Procura todos os links que contenham "Deliberações" no texto
        // e "binary=true" na URL (padrão de download de PDF da ARTESP)
        $('a').each((index, element) => {
            const $link = $(element);
            const texto = $link.text().trim();
            const href = $link.attr('href');

            // Verifica se o link atende aos critérios
            if (texto && href) {
                const textoLower = texto.toLowerCase();

                // Verifica se contém "delibera" (deliberações, deliberação)
                const isDeliberacao = textoLower.includes('delibera');

                // Verifica se é um link de download (binary=true)
                const isBinaryDownload = href.includes('binary=true');

                if (isDeliberacao && isBinaryDownload) {
                    // Extrai informações adicionais do contexto
                    const dataInfo = extrairDataDoContexto($, element);

                    // Filtra por anos permitidos
                    if (dataInfo.ano && ANOS_PERMITIDOS.includes(dataInfo.ano)) {
                        // Monta URL completa
                        const urlCompleta = href.startsWith('http')
                            ? href
                            : `https://www.artesp.sp.gov.br${href.startsWith('/') ? '' : '/'}${href}`;

                        // Gera nome do arquivo baseado nas informações
                        const nomeArquivo = gerarNomeArquivo(texto, dataInfo);

                        pdfsEncontrados.push({
                            url: urlCompleta,
                            textoLink: texto,
                            nomeArquivo: nomeArquivo,
                            data: dataInfo.dataCompleta || 'Data não identificada',
                            ano: dataInfo.ano,
                            reuniao: dataInfo.reuniao || 'Reunião não identificada'
                        });

                        console.log(`[Scraper] PDF encontrado: ${nomeArquivo}`);
                    }
                }
            }
        });

        // Remove duplicatas baseado na URL
        const pdfsUnicos = pdfsEncontrados.filter((pdf, index, self) =>
            index === self.findIndex((p) => p.url === pdf.url)
        );

        console.log(`[Scraper] Total de PDFs encontrados (2025-2026): ${pdfsUnicos.length}`);

        return pdfsUnicos;

    } catch (error) {
        console.error('[Scraper] Erro ao fazer scraping:', error.message);
        throw new Error(`Falha no scraping: ${error.message}`);
    }
}

/**
 * Extrai informações de data do contexto do elemento
 * @param {CheerioStatic} $ - Instância do Cheerio
 * @param {Element} element - Elemento do link
 * @returns {Object} Objeto com informações de data
 */
function extrairDataDoContexto($, element) {
    const resultado = {
        ano: null,
        dataCompleta: null,
        reuniao: null
    };

    try {
        // Procura no elemento pai ou irmãos por informações de data
        const $parent = $(element).parent();
        const $row = $(element).closest('tr, div, li');

        // Texto do contexto para análise
        const contexto = $row.text() + ' ' + $parent.text();

        // Regex para encontrar datas no formato DD/MM/YYYY ou DD/MM/YY
        const regexData = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
        const matchData = contexto.match(regexData);

        if (matchData) {
            const dia = matchData[1].padStart(2, '0');
            const mes = matchData[2].padStart(2, '0');
            let ano = matchData[3];

            // Converte ano de 2 dígitos para 4
            if (ano.length === 2) {
                ano = parseInt(ano) > 50 ? `19${ano}` : `20${ano}`;
            }

            resultado.dataCompleta = `${dia}/${mes}/${ano}`;
            resultado.ano = ano;
        }

        // Regex para encontrar número da reunião
        const regexReuniao = /(\d+)[ªº]?\s*reuni[aã]o|reuni[aã]o\s*n?[°º]?\s*(\d+)/i;
        const matchReuniao = contexto.match(regexReuniao);

        if (matchReuniao) {
            const numReuniao = matchReuniao[1] || matchReuniao[2];
            resultado.reuniao = `Reunião ${numReuniao}`;
        }

        // Se não encontrou ano no formato de data, procura ano isolado
        if (!resultado.ano) {
            const regexAno = /(2025|2026)/;
            const matchAno = contexto.match(regexAno);
            if (matchAno) {
                resultado.ano = matchAno[1];
            }
        }

    } catch (error) {
        console.warn('[Scraper] Erro ao extrair data do contexto:', error.message);
    }

    return resultado;
}

/**
 * Gera nome de arquivo baseado nas informações do PDF
 * @param {string} textoLink - Texto do link
 * @param {Object} dataInfo - Informações de data
 * @returns {string} Nome do arquivo
 */
function gerarNomeArquivo(textoLink, dataInfo) {
    let nome = 'deliberacoes';

    // Adiciona data se disponível
    if (dataInfo.dataCompleta) {
        const dataFormatada = dataInfo.dataCompleta.replace(/\//g, '-');
        nome += `_${dataFormatada}`;
    } else if (dataInfo.ano) {
        nome += `_${dataInfo.ano}`;
    }

    // Adiciona número da reunião se disponível
    if (dataInfo.reuniao) {
        const numReuniao = dataInfo.reuniao.match(/\d+/);
        if (numReuniao) {
            nome += `_reuniao-${numReuniao[0]}`;
        }
    }

    return `${nome}.pdf`;
}

/**
 * Faz scraping com retry em caso de falha
 * @param {number} maxRetries - Número máximo de tentativas
 * @returns {Promise<Array>} Lista de PDFs encontrados
 */
async function scrapeWithRetry(maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Scraper] Tentativa ${attempt} de ${maxRetries}...`);
            const result = await scrapePDFLinks();
            return result;
        } catch (error) {
            lastError = error;
            console.warn(`[Scraper] Tentativa ${attempt} falhou: ${error.message}`);

            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`[Scraper] Aguardando ${delay}ms antes da próxima tentativa...`);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}

module.exports = {
    scrapePDFLinks,
    scrapeWithRetry
};
