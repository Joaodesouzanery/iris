/**
 * News Fetcher - IRIS Core v2.0
 *
 * Busca notícias reais de fontes governamentais públicas
 * LGPD Compliant - Apenas dados públicos oficiais
 *
 * Performance v2:
 * - Todas as fontes em paralelo com Promise.allSettled (não sequencial)
 * - Timeout reduzido para 8s (gov.br responde em < 3s)
 * - Background pre-fetch na inicialização do servidor
 * - Cache com stale-while-revalidate pattern
 * - Abort controller para cancelar requests lentos
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

function classificarTipo(titulo, conteudo = '') {
    const texto = (titulo + ' ' + conteudo).toLowerCase();
    for (const [tipo, palavras] of Object.entries(TIPOS_NOTICIA)) {
        for (const palavra of palavras) {
            if (texto.includes(palavra)) return tipo;
        }
    }
    return 'noticia';
}

// ============================================
// HTTP CLIENT - Performance optimized
// ============================================
const FETCH_TIMEOUT = 8000; // 8s (gov.br responds in < 3s normally)
const MAX_RETRIES = 1; // 1 retry only (fast fail)

// Keep-alive agent for connection reuse
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 20, timeout: 10000 });
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 10, timeout: 10000 });

function fetchUrl(url, timeout = FETCH_TIMEOUT, maxRetries = MAX_RETRIES) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        function attempt() {
            attempts++;
            const isHttps = url.startsWith('https');
            const protocol = isHttps ? https : http;

            const req = protocol.get(url, {
                agent: isHttps ? httpsAgent : httpAgent,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; IRIS-Platform/1.0; +https://github.com/iris-platform)',
                    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'identity',
                    'Connection': 'keep-alive'
                },
                timeout: timeout
            }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    let redirectUrl = res.headers.location;
                    if (redirectUrl.startsWith('/')) {
                        const urlObj = new URL(url);
                        redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
                    }
                    res.resume(); // Drain response
                    return fetchUrl(redirectUrl, timeout, 0).then(resolve).catch(reject);
                }

                if (res.statusCode !== 200) {
                    res.resume();
                    if (attempts <= maxRetries) {
                        setTimeout(attempt, attempts * 800);
                        return;
                    }
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }

                const chunks = [];
                let totalSize = 0;
                const MAX_SIZE = 2 * 1024 * 1024; // 2MB limit

                res.on('data', chunk => {
                    totalSize += chunk.length;
                    if (totalSize > MAX_SIZE) {
                        req.destroy();
                        reject(new Error('Response too large'));
                        return;
                    }
                    chunks.push(chunk);
                });
                res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            });

            req.on('error', (err) => {
                if (attempts <= maxRetries) {
                    setTimeout(attempt, attempts * 800);
                    return;
                }
                reject(err);
            });
            req.on('timeout', () => {
                req.destroy();
                if (attempts <= maxRetries) {
                    setTimeout(attempt, attempts * 800);
                    return;
                }
                reject(new Error('Timeout'));
            });
        }

        attempt();
    });
}

// ============================================
// XML / HTML PARSERS
// ============================================
function extractTag(xml, tagName) {
    const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<${escapedTag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${escapedTag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
}

function extractLinkAttr(xml) {
    const match = xml.match(/<link[^>]+href="([^"]+)"[^>]*\/?>/i);
    return match ? match[1] : '';
}

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

function formatarData(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
        return date.toISOString().split('T')[0];
    } catch (e) {
        return new Date().toISOString().split('T')[0];
    }
}

function parseRSS(xml, agencia, config) {
    const noticias = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1];
        const titulo = extractTag(item, 'title');
        if (!titulo) continue;
        const link = extractTag(item, 'link') || extractLinkAttr(item);
        const descricao = extractTag(item, 'description');
        const pubDate = extractTag(item, 'pubDate') || extractTag(item, 'dc:date');
        noticias.push({
            agencia, tipo: classificarTipo(titulo, descricao),
            titulo: limparHTML(titulo), resumo: limparHTML(descricao).substring(0, 300),
            link, data: formatarData(pubDate),
            esfera: config.esfera || 'federal', fonte: config.nome, cor: config.cor || '#FFEF4D'
        });
    }
    return noticias;
}

function parseAtom(xml, agencia, config) {
    const noticias = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];
        const titulo = extractTag(entry, 'title');
        if (!titulo) continue;
        const link = extractLinkAttr(entry) || extractTag(entry, 'link');
        const descricao = extractTag(entry, 'summary') || extractTag(entry, 'content');
        const pubDate = extractTag(entry, 'updated') || extractTag(entry, 'published');
        noticias.push({
            agencia, tipo: classificarTipo(titulo, descricao),
            titulo: limparHTML(titulo), resumo: limparHTML(descricao).substring(0, 300),
            link, data: formatarData(pubDate),
            esfera: config.esfera || 'federal', fonte: config.nome, cor: config.cor || '#FFEF4D'
        });
    }
    return noticias;
}

function autoParseXML(xml, agencia, config) {
    if (xml.includes('<item>') || xml.includes('<item ')) {
        const results = parseRSS(xml, agencia, config);
        if (results.length > 0) return results;
    }
    if (xml.includes('<entry>') || xml.includes('<entry ')) {
        const results = parseAtom(xml, agencia, config);
        if (results.length > 0) return results;
    }
    const rssResults = parseRSS(xml, agencia, config);
    if (rssResults.length > 0) return rssResults;
    return parseAtom(xml, agencia, config);
}

function scrapeARSESP(html, config) {
    const noticias = [];
    const linkRegex = /<a[^>]+href="([^"]*noticias[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const link = match[1];
        const titulo = limparHTML(match[2]).trim();
        if (!titulo || titulo.length < 10) continue;
        noticias.push({
            agencia: 'ARSESP', tipo: classificarTipo(titulo),
            titulo, resumo: '',
            link: link.startsWith('http') ? link : `https://www.arsesp.sp.gov.br${link}`,
            data: new Date().toISOString().split('T')[0],
            esfera: config.esfera || 'estadual', fonte: config.nome, cor: config.cor || '#38BDF8'
        });
    }
    return noticias;
}

// ============================================
// STATUS + PER-SOURCE CACHE
// ============================================
const fontesStatus = {};
const perSourceCache = {}; // Per-source cache for partial results

async function fetchAgenciaNoticias(agencia) {
    const config = FONTES_RSS[agencia];
    if (!config) return [];

    const startTime = Date.now();

    try {
        let noticias;
        if (config.tipo === 'scrape') {
            const html = await fetchUrl(config.url, FETCH_TIMEOUT, 1);
            noticias = scrapeARSESP(html, config);
        } else {
            const xml = await fetchUrl(config.url, FETCH_TIMEOUT, MAX_RETRIES);
            noticias = autoParseXML(xml, agencia, config);
        }

        const ms = Date.now() - startTime;
        fontesStatus[agencia] = { status: 'online', count: noticias.length, lastFetch: Date.now(), ms };

        // Cache per source (5 min)
        if (noticias.length > 0) {
            perSourceCache[agencia] = { data: noticias, time: Date.now() };
        }

        return noticias;
    } catch (error) {
        const ms = Date.now() - startTime;
        console.error(`[NewsFetcher] ${agencia} falhou (${ms}ms): ${error.message}`);
        fontesStatus[agencia] = { status: 'offline', error: error.message, lastFetch: Date.now(), ms };

        // Return stale per-source cache if available (< 30 min old)
        const cached = perSourceCache[agencia];
        if (cached && (Date.now() - cached.time) < 30 * 60 * 1000) {
            console.log(`[NewsFetcher] ${agencia}: usando cache stale (${cached.data.length} notícias)`);
            return cached.data;
        }

        return [];
    }
}

// ============================================
// MAIN FETCH - ALL SOURCES IN PARALLEL
// ============================================
async function fetchTodasNoticias(limite = 100) {
    const agencias = Object.keys(FONTES_RSS);
    const startAll = Date.now();

    // ALL sources in parallel with Promise.allSettled (no batching)
    const results = await Promise.allSettled(
        agencias.map(ag => fetchAgenciaNoticias(ag))
    );

    const todasNoticias = [];
    let fontesSucesso = 0;
    let fontesErro = 0;

    results.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
            fontesSucesso++;
            todasNoticias.push(...result.value);
        } else {
            fontesErro++;
        }
    });

    const totalMs = Date.now() - startAll;
    console.log(`[NewsFetcher] ${todasNoticias.length} notícias de ${fontesSucesso}/${agencias.length} fontes em ${totalMs}ms`);

    // Sort by date (newest first)
    todasNoticias.sort((a, b) => new Date(b.data) - new Date(a.data));

    // Deduplicate by title similarity
    const seen = new Set();
    const unique = todasNoticias.filter(n => {
        const key = n.titulo.toLowerCase().substring(0, 60);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return unique.slice(0, limite);
}

async function fetchNoticiasPorSetor(setor, limite = 20) {
    const agenciasFiltradas = Object.entries(FONTES_RSS)
        .filter(([_, config]) => config.setor === setor)
        .map(([sigla]) => sigla);

    const results = await Promise.allSettled(
        agenciasFiltradas.map(ag => fetchAgenciaNoticias(ag))
    );

    const noticias = [];
    results.forEach(r => {
        if (r.status === 'fulfilled') noticias.push(...r.value);
    });

    noticias.sort((a, b) => new Date(b.data) - new Date(a.data));
    return noticias.slice(0, limite);
}

async function fetchNoticiasPorEsfera(esfera, limite = 20) {
    const agenciasFiltradas = Object.entries(FONTES_RSS)
        .filter(([_, config]) => config.esfera === esfera)
        .map(([sigla]) => sigla);

    const results = await Promise.allSettled(
        agenciasFiltradas.map(ag => fetchAgenciaNoticias(ag))
    );

    const noticias = [];
    results.forEach(r => {
        if (r.status === 'fulfilled') noticias.push(...r.value);
    });

    noticias.sort((a, b) => new Date(b.data) - new Date(a.data));
    return noticias.slice(0, limite);
}

// ============================================
// CACHE - Stale-While-Revalidate pattern
// ============================================
let cacheNoticias = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let _revalidating = false;

async function fetchNoticiasComCache(forceRefresh = false) {
    const agora = Date.now();
    const cacheValid = cacheNoticias && cacheNoticias.length > 0 && (agora - cacheTimestamp) < CACHE_DURATION;

    // Return cache immediately if valid
    if (!forceRefresh && cacheValid) {
        return cacheNoticias;
    }

    // Stale-while-revalidate: return stale cache but refresh in background
    if (!forceRefresh && cacheNoticias && cacheNoticias.length > 0 && !_revalidating) {
        _revalidating = true;
        fetchTodasNoticias(100).then(noticias => {
            if (noticias.length > 0) {
                cacheNoticias = noticias;
                cacheTimestamp = Date.now();
            }
            _revalidating = false;
        }).catch(() => { _revalidating = false; });
        return cacheNoticias; // Return stale immediately
    }

    // No cache at all — must wait
    const noticias = await fetchTodasNoticias(100);
    if (noticias.length > 0) {
        cacheNoticias = noticias;
        cacheTimestamp = agora;
    }
    return noticias;
}

// ============================================
// BACKGROUND PRE-FETCH on module load
// ============================================
let _prefetchDone = false;

function startBackgroundPrefetch() {
    if (_prefetchDone) return;
    _prefetchDone = true;

    // Pre-fetch after 3 seconds (let server start first)
    setTimeout(() => {
        console.log('[NewsFetcher] Iniciando pre-fetch em background...');
        fetchTodasNoticias(100).then(noticias => {
            if (noticias.length > 0) {
                cacheNoticias = noticias;
                cacheTimestamp = Date.now();
                console.log(`[NewsFetcher] Pre-fetch concluído: ${noticias.length} notícias em cache`);
            }
        }).catch(err => {
            console.warn('[NewsFetcher] Pre-fetch falhou:', err.message);
        });
    }, 3000);

    // Auto-refresh every 10 minutes
    setInterval(() => {
        fetchTodasNoticias(100).then(noticias => {
            if (noticias.length > 0) {
                cacheNoticias = noticias;
                cacheTimestamp = Date.now();
            }
        }).catch(() => {});
    }, CACHE_DURATION);
}

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
    getStatusFontes,
    startBackgroundPrefetch
};
