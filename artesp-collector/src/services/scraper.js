/**
 * Serviço de Web Scraping para ARTESP
 * Responsável por encontrar links de deliberações no site da ARTESP
 *
 * Inclui proteções contra bloqueio:
 * - User-Agent rotation
 * - Delays aleatórios
 * - Retry com exponential backoff
 */

const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('./logger');

// URL da página de reuniões da diretoria
const REUNIOES_URL = 'https://www.artesp.sp.gov.br/artesp/transparencia/reunioes-diretoria';

// Anos que queremos filtrar
const ANOS_PERMITIDOS = ['2025', '2026'];

// Delays configuráveis
const MIN_DELAY = parseInt(process.env.MIN_DELAY) || 2000;
const MAX_DELAY = parseInt(process.env.MAX_DELAY) || 5000;

// Lista de User-Agents para rotação (simula diferentes navegadores)
const USER_AGENTS = [
    // Chrome Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    // Chrome Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // Firefox Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    // Firefox Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    // Safari Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    // Edge Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    // Chrome Linux
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

/**
 * Seleciona um User-Agent aleatório
 * @returns {string} User-Agent
 */
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Gera delay aleatório entre min e max
 * @param {number} min - Delay mínimo em ms
 * @param {number} max - Delay máximo em ms
 * @returns {number} Delay em ms
 */
function getRandomDelay(min = MIN_DELAY, max = MAX_DELAY) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Função auxiliar para aguardar um tempo
 * @param {number} ms - Milissegundos para aguardar
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Valida se uma URL é válida
 * @param {string} url - URL para validar
 * @returns {boolean} true se válida
 */
function isValidUrl(url) {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch {
        // Pode ser URL relativa
        return url.startsWith('/') || url.includes('artesp');
    }
}

/**
 * Normaliza URL (converte relativa para absoluta)
 * @param {string} href - URL do link
 * @returns {string} URL normalizada
 */
function normalizeUrl(href) {
    if (!href) return null;

    // Já é URL absoluta
    if (href.startsWith('http://') || href.startsWith('https://')) {
        return href;
    }

    // URL relativa
    const base = 'https://www.artesp.sp.gov.br';
    if (href.startsWith('/')) {
        return `${base}${href}`;
    }

    return `${base}/${href}`;
}

/**
 * Faz scraping da página de reuniões da ARTESP
 * @returns {Promise<Array>} Lista de objetos com informações dos PDFs
 */
async function scrapePDFLinks() {
    const startTime = Date.now();
    const userAgent = getRandomUserAgent();

    console.log('[Scraper] Iniciando scraping da página de reuniões...');
    console.log(`[Scraper] URL: ${REUNIOES_URL}`);
    console.log(`[Scraper] User-Agent: ${userAgent.substring(0, 50)}...`);

    await logger.logStart(logger.OPERATION_TYPES.SCRAPE, {
        url: REUNIOES_URL,
        userAgent: userAgent.substring(0, 50)
    });

    try {
        // Faz requisição à página principal
        const response = await axios.get(REUNIOES_URL, {
            timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            }
        });

        console.log(`[Scraper] Página carregada com sucesso (Status: ${response.status})`);

        // Carrega HTML no Cheerio para parsing
        const $ = cheerio.load(response.data);

        // Array para armazenar os PDFs encontrados
        const pdfsEncontrados = [];
        let linksAnalisados = 0;
        let linksIgnorados = 0;

        // Procura todos os links
        $('a').each((index, element) => {
            linksAnalisados++;
            const $link = $(element);
            const texto = $link.text().trim();
            const href = $link.attr('href');

            // Pula se não tem href
            if (!href) {
                linksIgnorados++;
                return;
            }

            // Valida URL
            if (!isValidUrl(href)) {
                linksIgnorados++;
                return;
            }

            // Verifica se o link atende aos critérios
            if (texto) {
                const textoLower = texto.toLowerCase();

                // Verifica se contém "delibera" (deliberações, deliberação)
                const isDeliberacao = textoLower.includes('delibera') ||
                                      textoLower.includes('deliberação') ||
                                      textoLower.includes('deliberacoes');

                // Verifica se é um link de download (binary=true ou .pdf)
                const isBinaryDownload = href.includes('binary=true') ||
                                         href.toLowerCase().endsWith('.pdf');

                if (isDeliberacao && isBinaryDownload) {
                    // Extrai informações adicionais do contexto
                    const dataInfo = extrairDataDoContexto($, element);

                    // Filtra por anos permitidos
                    if (dataInfo.ano && ANOS_PERMITIDOS.includes(dataInfo.ano)) {
                        // Normaliza URL
                        const urlCompleta = normalizeUrl(href);

                        if (!urlCompleta) {
                            console.warn(`[Scraper] URL inválida ignorada: ${href}`);
                            return;
                        }

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

        const duracao = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`[Scraper] Análise concluída:`);
        console.log(`[Scraper] - Links analisados: ${linksAnalisados}`);
        console.log(`[Scraper] - Links ignorados: ${linksIgnorados}`);
        console.log(`[Scraper] - PDFs encontrados (2025-2026): ${pdfsUnicos.length}`);
        console.log(`[Scraper] - Duração: ${duracao}s`);

        await logger.logSuccess(logger.OPERATION_TYPES.SCRAPE, {
            mensagem: `${pdfsUnicos.length} PDFs encontrados`,
            linksAnalisados,
            linksIgnorados,
            pdfsEncontrados: pdfsUnicos.length,
            duracao: `${duracao}s`
        });

        return pdfsUnicos;

    } catch (error) {
        const duracao = ((Date.now() - startTime) / 1000).toFixed(2);

        await logger.logError(logger.OPERATION_TYPES.SCRAPE, error, {
            url: REUNIOES_URL,
            duracao: `${duracao}s`
        });

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
        const $row = $(element).closest('tr, div, li, article, section');
        const $container = $(element).closest('.item, .document, .file, [class*="delibera"]');

        // Texto do contexto para análise (múltiplas fontes)
        const contexto = [
            $row.text(),
            $parent.text(),
            $container.text(),
            $(element).attr('title') || '',
            $(element).attr('data-date') || ''
        ].join(' ');

        // Regex para encontrar datas no formato DD/MM/YYYY ou DD/MM/YY
        const regexData = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/;
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

        // Regex para encontrar número da reunião (múltiplos formatos)
        const regexReuniao = /(\d+)[ªº]?\s*reuni[aã]o|reuni[aã]o\s*(?:n[°º.]?\s*)?(\d+)|RD\s*(\d+)|(\d+)[ªº]\s*RD/i;
        const matchReuniao = contexto.match(regexReuniao);

        if (matchReuniao) {
            const numReuniao = matchReuniao[1] || matchReuniao[2] || matchReuniao[3] || matchReuniao[4];
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

    // Adiciona timestamp para garantir unicidade
    const timestamp = Date.now().toString(36);
    nome += `_${timestamp}`;

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

            await logger.logWarning(logger.OPERATION_TYPES.SCRAPE, `Tentativa ${attempt} falhou`, {
                tentativa: attempt,
                maxTentativas: maxRetries,
                erro: error.message
            });

            if (attempt < maxRetries) {
                // Exponential backoff com jitter
                const baseDelay = Math.pow(2, attempt) * 1000;
                const jitter = Math.random() * 1000;
                const delay = baseDelay + jitter;

                console.log(`[Scraper] Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}

/**
 * Obtém delay aleatório para usar entre requisições
 * @returns {number} Delay em ms
 */
function getDelay() {
    return getRandomDelay();
}

module.exports = {
    scrapePDFLinks,
    scrapeWithRetry,
    getRandomUserAgent,
    getDelay,
    normalizeUrl,
    isValidUrl
};
