/**
 * News Fetcher - IRIS Core
 *
 * Busca notícias reais de fontes governamentais públicas
 * LGPD Compliant - Apenas dados públicos oficiais
 *
 * Melhorias:
 * - Retry com backoff exponencial
 * - Suporte a Atom (gov.br) e RSS
 * - Scraper dedicado para ARSESP
 * - Cache inteligente (não cacheia resultados vazios)
 * - Timeout configurável
 * - Logging estruturado
 */

const https = require('https');
const http = require('http');

// ============================================
// FONTES OFICIAIS DE NOTÍCIAS (Públicas)
// ============================================
const FONTES_RSS = {
    // ─── Agências Reguladoras Federais ───
    'DOU': {
        nome: 'Diário Oficial da União',
        url: 'https://www.in.gov.br/rss/dou',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'geral',
        cor: '#A78BFA'
    },
    'ANEEL': {
        nome: 'ANEEL - Energia Elétrica',
        url: 'https://www.gov.br/aneel/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'energia',
        cor: '#FFEF4D'
    },
    'ANATEL': {
        nome: 'ANATEL - Telecomunicações',
        url: 'https://www.gov.br/anatel/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'telecom',
        cor: '#4ADE80'
    },
    'ANP': {
        nome: 'ANP - Petróleo e Gás',
        url: 'https://www.gov.br/anp/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'petroleo',
        cor: '#F472B6'
    },
    'ANVISA': {
        nome: 'ANVISA - Vigilância Sanitária',
        url: 'https://www.gov.br/anvisa/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'saude',
        cor: '#A78BFA'
    },
    'ANS': {
        nome: 'ANS - Saúde Suplementar',
        url: 'https://www.gov.br/ans/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'saude',
        cor: '#F97316'
    },
    'ANTT': {
        nome: 'ANTT - Transportes Terrestres',
        url: 'https://www.gov.br/antt/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'transporte',
        cor: '#14B8A6'
    },
    'ANTAQ': {
        nome: 'ANTAQ - Transportes Aquaviários',
        url: 'https://www.gov.br/antaq/pt-br/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'transporte',
        cor: '#06B6D4'
    },
    'ANAC': {
        nome: 'ANAC - Aviação Civil',
        url: 'https://www.gov.br/anac/pt-br/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'aviacao',
        cor: '#8B5CF6'
    },
    'ANA': {
        nome: 'ANA - Águas e Saneamento',
        url: 'https://www.gov.br/ana/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'saneamento',
        cor: '#60A5FA'
    },
    'ANM': {
        nome: 'ANM - Mineração',
        url: 'https://www.gov.br/anm/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'mineracao',
        cor: '#EF4444'
    },
    'ANCINE': {
        nome: 'ANCINE - Cinema',
        url: 'https://www.gov.br/ancine/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'cultura',
        cor: '#EC4899'
    },
    'CVM': {
        nome: 'CVM - Valores Mobiliários',
        url: 'https://www.gov.br/cvm/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'financeiro',
        cor: '#22D3EE'
    },
    // ─── Órgãos de Controle ───
    'TCU': {
        nome: 'TCU - Tribunal de Contas',
        url: 'https://portal.tcu.gov.br/imprensa/noticias/rss.htm',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'controle',
        cor: '#F59E0B'
    },
    'CGU': {
        nome: 'CGU - Controladoria Geral',
        url: 'https://www.gov.br/cgu/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'controle',
        cor: '#10B981'
    },
    'CADE': {
        nome: 'CADE - Defesa da Concorrência',
        url: 'https://www.gov.br/cade/pt-br/assuntos/noticias/RSS',
        tipo: 'atom',
        esfera: 'federal',
        setor: 'concorrencia',
        cor: '#3B82F6'
    },
    // ─── Agências Estaduais (SP) ───
    'ARTESP': {
        nome: 'ARTESP - Regulação SP',
        url: 'https://www.artesp.sp.gov.br/Style%20Library/Handlers/RSSFeed.ashx',
        tipo: 'rss',
        esfera: 'estadual',
        setor: 'transporte',
        cor: '#FBBF24'
    },
    'ARSESP': {
        nome: 'ARSESP - Saneamento e Energia SP',
        url: 'https://www.arsesp.sp.gov.br/SitePages/noticias.aspx',
        tipo: 'scrape',
        esfera: 'estadual',
        setor: 'saneamento',
        cor: '#38BDF8'
    },
    // ─── Portais de Notícias Regulatórias ───
    'SENADO': {
        nome: 'Senado Federal - Notícias',
        url: 'https://www12.senado.leg.br/noticias/feed',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'legislativo',
        cor: '#34D399'
    },
    'CAMARA': {
        nome: 'Câmara dos Deputados - Notícias',
        url: 'https://www.camara.leg.br/noticias/rss/ultimas',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'legislativo',
        cor: '#A3E635'
    }
};

// ============================================
// CLASSIFICAÇÃO DE TIPOS DE NOTÍCIA
// ============================================
const TIPOS_NOTICIA = {
    'resolucao': ['resolução', 'resolucao', 'rdc', 'normativa', 'regulamento'],
    'deliberacao': ['deliberação', 'deliberacao', 'ata', 'reunião ordinária'],
    'consulta': ['consulta pública', 'consulta publica', 'audiência pública'],
    'decreto': ['decreto', 'portaria', 'instrução normativa'],
    'auditoria': ['auditoria', 'fiscalização', 'fiscalizacao', 'irregularidade'],
    'noticia': [] // Default
};

/**
 * Classifica o tipo de notícia pelo título/conteúdo
 */
function classificarTipo(titulo, conteudo = '') {
    const texto = (titulo + ' ' + conteudo).toLowerCase();

    for (const [tipo, palavras] of Object.entries(TIPOS_NOTICIA)) {
        for (const palavra of palavras) {
            if (texto.includes(palavra)) {
                return tipo;
            }
        }
    }

    return 'noticia';
}

/**
 * Faz requisição HTTP/HTTPS com retry e backoff exponencial
 */
function fetchUrl(url, timeout = 15000, maxRetries = 2) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        function attempt() {
            attempts++;
            const protocol = url.startsWith('https') ? https : http;

            const req = protocol.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; IRIS-Platform/1.0; +https://github.com/iris-platform)',
                    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'identity'
                },
                timeout: timeout
            }, (res) => {
                // Handle redirects (up to 5 hops)
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    let redirectUrl = res.headers.location;
                    // Handle relative redirects
                    if (redirectUrl.startsWith('/')) {
                        const urlObj = new URL(url);
                        redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
                    }
                    return fetchUrl(redirectUrl, timeout, 0)
                        .then(resolve)
                        .catch(reject);
                }

                if (res.statusCode !== 200) {
                    if (attempts <= maxRetries) {
                        setTimeout(attempt, attempts * 1000);
                        return;
                    }
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }

                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => {
                    const data = Buffer.concat(chunks).toString('utf-8');
                    resolve(data);
                });
            });

            req.on('error', (err) => {
                if (attempts <= maxRetries) {
                    setTimeout(attempt, attempts * 1000);
                    return;
                }
                reject(err);
            });
            req.on('timeout', () => {
                req.destroy();
                if (attempts <= maxRetries) {
                    setTimeout(attempt, attempts * 1000);
                    return;
                }
                reject(new Error('Timeout'));
            });
        }

        attempt();
    });
}

/**
 * Parse RSS XML (formato RSS 2.0 clássico)
 */
function parseRSS(xml, agencia, config) {
    const noticias = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1];

        const titulo = extractTag(item, 'title');
        const link = extractTag(item, 'link') || extractLinkAttr(item);
        const descricao = extractTag(item, 'description');
        const pubDate = extractTag(item, 'pubDate') || extractTag(item, 'dc:date');

        if (!titulo) continue;

        const data = formatarData(pubDate);
        const tipo = classificarTipo(titulo, descricao);
        const resumo = limparHTML(descricao).substring(0, 300);

        noticias.push({
            agencia: agencia,
            tipo: tipo,
            titulo: limparHTML(titulo),
            resumo: resumo,
            link: link,
            data: data,
            esfera: config.esfera || 'federal',
            fonte: config.nome,
            cor: config.cor || '#FFEF4D'
        });
    }

    return noticias;
}

/**
 * Parse Atom XML (formato usado pelo gov.br)
 */
function parseAtom(xml, agencia, config) {
    const noticias = [];

    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];

        const titulo = extractTag(entry, 'title');
        const link = extractLinkAttr(entry) || extractTag(entry, 'link');
        const descricao = extractTag(entry, 'summary') || extractTag(entry, 'content');
        const pubDate = extractTag(entry, 'updated') || extractTag(entry, 'published');

        if (!titulo) continue;

        const data = formatarData(pubDate);
        const tipo = classificarTipo(titulo, descricao);
        const resumo = limparHTML(descricao).substring(0, 300);

        noticias.push({
            agencia: agencia,
            tipo: tipo,
            titulo: limparHTML(titulo),
            resumo: resumo,
            link: link,
            data: data,
            esfera: config.esfera || 'federal',
            fonte: config.nome,
            cor: config.cor || '#FFEF4D'
        });
    }

    return noticias;
}

/**
 * Auto-detect and parse XML (tries RSS, then Atom, then fallback)
 */
function autoParseXML(xml, agencia, config) {
    // Try RSS first (<item> tags)
    if (xml.includes('<item>') || xml.includes('<item ')) {
        const results = parseRSS(xml, agencia, config);
        if (results.length > 0) return results;
    }

    // Try Atom (<entry> tags)
    if (xml.includes('<entry>') || xml.includes('<entry ')) {
        const results = parseAtom(xml, agencia, config);
        if (results.length > 0) return results;
    }

    // Try both anyway as fallback
    const rssResults = parseRSS(xml, agencia, config);
    if (rssResults.length > 0) return rssResults;

    return parseAtom(xml, agencia, config);
}

/**
 * Scraper para ARSESP (HTML, não RSS)
 */
function scrapeARSESP(html, config) {
    const noticias = [];

    // ARSESP publica notícias em HTML com links para detalhes
    // Tenta extrair padrões de notícias da página
    const linkRegex = /<a[^>]+href="([^"]*noticias[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
        const link = match[1];
        const titulo = limparHTML(match[2]).trim();

        if (!titulo || titulo.length < 10) continue;

        noticias.push({
            agencia: 'ARSESP',
            tipo: classificarTipo(titulo),
            titulo: titulo,
            resumo: '',
            link: link.startsWith('http') ? link : `https://www.arsesp.sp.gov.br${link}`,
            data: new Date().toISOString().split('T')[0],
            esfera: config.esfera || 'estadual',
            fonte: config.nome,
            cor: config.cor || '#38BDF8'
        });
    }

    return noticias;
}

/**
 * Extrai conteúdo de uma tag XML
 */
function extractTag(xml, tagName) {
    // Handle namespaced tags (dc:date, etc)
    const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<${escapedTag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${escapedTag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
}

/**
 * Extrai href de tag <link> com atributo (Atom style)
 */
function extractLinkAttr(xml) {
    const match = xml.match(/<link[^>]+href="([^"]+)"[^>]*\/?>/i);
    return match ? match[1] : '';
}

/**
 * Limpa tags HTML do texto
 */
function limparHTML(texto) {
    if (!texto) return '';
    return texto
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#\d+;/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Formata data do RSS para YYYY-MM-DD
 */
function formatarData(dateStr) {
    if (!dateStr) {
        return new Date().toISOString().split('T')[0];
    }

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return new Date().toISOString().split('T')[0];
        }
        return date.toISOString().split('T')[0];
    } catch (e) {
        return new Date().toISOString().split('T')[0];
    }
}

// ============================================
// STATUS DE CADA FONTE (para o frontend)
// ============================================
const fontesStatus = {};

/**
 * Busca notícias de uma agência específica
 */
async function fetchAgenciaNoticias(agencia) {
    const config = FONTES_RSS[agencia];
    if (!config) {
        return [];
    }

    const startTime = Date.now();

    try {
        if (config.tipo === 'scrape') {
            // Fonte do tipo scrape: buscar HTML e extrair
            const html = await fetchUrl(config.url, 15000, 1);
            const noticias = scrapeARSESP(html, config);
            fontesStatus[agencia] = { status: 'online', count: noticias.length, lastFetch: Date.now(), ms: Date.now() - startTime };
            return noticias;
        }

        // Fonte RSS/Atom: buscar e parsear XML
        const xml = await fetchUrl(config.url, 15000, 2);
        const noticias = autoParseXML(xml, agencia, config);
        fontesStatus[agencia] = { status: 'online', count: noticias.length, lastFetch: Date.now(), ms: Date.now() - startTime };
        return noticias;
    } catch (error) {
        console.error(`[NewsFetcher] Erro ao buscar ${agencia}: ${error.message}`);
        fontesStatus[agencia] = { status: 'offline', error: error.message, lastFetch: Date.now(), ms: Date.now() - startTime };
        return [];
    }
}

/**
 * Busca notícias de todas as agências
 */
async function fetchTodasNoticias(limite = 100) {
    const agencias = Object.keys(FONTES_RSS);
    const todasNoticias = [];
    let fontesSucesso = 0;
    let fontesErro = 0;

    // Busca em paralelo com limite de concorrência
    const batchSize = 6;
    for (let i = 0; i < agencias.length; i += batchSize) {
        const batch = agencias.slice(i, i + batchSize);
        const resultados = await Promise.all(
            batch.map(ag => fetchAgenciaNoticias(ag).catch(() => []))
        );

        for (const noticias of resultados) {
            if (noticias.length > 0) {
                fontesSucesso++;
                todasNoticias.push(...noticias);
            } else {
                fontesErro++;
            }
        }
    }

    console.log(`[NewsFetcher] Resultado: ${todasNoticias.length} notícias de ${fontesSucesso}/${agencias.length} fontes`);

    // Ordena por data (mais recentes primeiro)
    todasNoticias.sort((a, b) => new Date(b.data) - new Date(a.data));

    // Remove duplicatas por título similar
    const seen = new Set();
    const unique = todasNoticias.filter(n => {
        const key = n.titulo.toLowerCase().substring(0, 60);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return unique.slice(0, limite);
}

/**
 * Busca notícias por setor
 */
async function fetchNoticiasPorSetor(setor, limite = 20) {
    const agenciasFiltradas = Object.entries(FONTES_RSS)
        .filter(([_, config]) => config.setor === setor)
        .map(([sigla, _]) => sigla);

    const noticias = [];

    const resultados = await Promise.all(
        agenciasFiltradas.map(ag => fetchAgenciaNoticias(ag).catch(() => []))
    );

    for (const resultado of resultados) {
        noticias.push(...resultado);
    }

    noticias.sort((a, b) => new Date(b.data) - new Date(a.data));
    return noticias.slice(0, limite);
}

/**
 * Busca notícias por esfera (federal/estadual)
 */
async function fetchNoticiasPorEsfera(esfera, limite = 20) {
    const agenciasFiltradas = Object.entries(FONTES_RSS)
        .filter(([_, config]) => config.esfera === esfera)
        .map(([sigla, _]) => sigla);

    const noticias = [];

    const resultados = await Promise.all(
        agenciasFiltradas.map(ag => fetchAgenciaNoticias(ag).catch(() => []))
    );

    for (const resultado of resultados) {
        noticias.push(...resultado);
    }

    noticias.sort((a, b) => new Date(b.data) - new Date(a.data));
    return noticias.slice(0, limite);
}

/**
 * Cache inteligente em memória (não cacheia resultados vazios)
 */
let cacheNoticias = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

async function fetchNoticiasComCache(forceRefresh = false) {
    const agora = Date.now();

    if (!forceRefresh && cacheNoticias && cacheNoticias.length > 0 && (agora - cacheTimestamp) < CACHE_DURATION) {
        return cacheNoticias;
    }

    const noticias = await fetchTodasNoticias(100);

    // Só cacheia se tiver resultados
    if (noticias.length > 0) {
        cacheNoticias = noticias;
        cacheTimestamp = agora;
    }

    return noticias;
}

/**
 * Retorna status de todas as fontes
 */
function getStatusFontes() {
    return Object.entries(FONTES_RSS).map(([sigla, config]) => ({
        sigla,
        nome: config.nome,
        tipo: config.tipo,
        esfera: config.esfera,
        setor: config.setor,
        status: fontesStatus[sigla] || { status: 'unknown' }
    }));
}

module.exports = {
    FONTES_RSS,
    fetchAgenciaNoticias,
    fetchTodasNoticias,
    fetchNoticiasPorSetor,
    fetchNoticiasPorEsfera,
    fetchNoticiasComCache,
    classificarTipo,
    getStatusFontes
};
