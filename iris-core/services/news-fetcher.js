/**
 * News Fetcher - IRIS Core
 *
 * Busca notícias reais de fontes governamentais públicas
 * LGPD Compliant - Apenas dados públicos oficiais
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
        url: 'https://www.in.gov.br/web/dou/-/rss',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'geral'
    },
    'ANEEL': {
        nome: 'ANEEL - Energia Elétrica',
        url: 'https://www.gov.br/aneel/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'energia',
        cor: '#FFEF4D'
    },
    'ANATEL': {
        nome: 'ANATEL - Telecomunicações',
        url: 'https://www.gov.br/anatel/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'telecom',
        cor: '#4ADE80'
    },
    'ANP': {
        nome: 'ANP - Petróleo e Gás',
        url: 'https://www.gov.br/anp/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'petroleo',
        cor: '#F472B6'
    },
    'ANVISA': {
        nome: 'ANVISA - Vigilância Sanitária',
        url: 'https://www.gov.br/anvisa/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'saude',
        cor: '#A78BFA'
    },
    'ANS': {
        nome: 'ANS - Saúde Suplementar',
        url: 'https://www.gov.br/ans/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'saude',
        cor: '#F97316'
    },
    'ANTT': {
        nome: 'ANTT - Transportes Terrestres',
        url: 'https://www.gov.br/antt/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'transporte',
        cor: '#14B8A6'
    },
    'ANTAQ': {
        nome: 'ANTAQ - Transportes Aquaviários',
        url: 'https://www.gov.br/antaq/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'transporte',
        cor: '#06B6D4'
    },
    'ANAC': {
        nome: 'ANAC - Aviação Civil',
        url: 'https://www.gov.br/anac/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'aviacao',
        cor: '#8B5CF6'
    },
    'ANA': {
        nome: 'ANA - Águas e Saneamento',
        url: 'https://www.gov.br/ana/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'saneamento',
        cor: '#60A5FA'
    },
    'ANM': {
        nome: 'ANM - Mineração',
        url: 'https://www.gov.br/anm/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'mineracao',
        cor: '#EF4444'
    },
    'ANCINE': {
        nome: 'ANCINE - Cinema',
        url: 'https://www.gov.br/ancine/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'cultura',
        cor: '#EC4899'
    },
    'CVM': {
        nome: 'CVM - Valores Mobiliários',
        url: 'https://www.gov.br/cvm/pt-br/assuntos/noticias/RSS',
        tipo: 'rss',
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
        url: 'https://www.gov.br/cgu/pt-br/noticias/RSS',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'controle',
        cor: '#10B981'
    },
    'CADE': {
        nome: 'CADE - Defesa da Concorrência',
        url: 'https://www.gov.br/cade/pt-br/assuntos/noticias/RSS',
        tipo: 'rss',
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
    'JOTA': {
        nome: 'JOTA - Regulação e Poder',
        url: 'https://www.jota.info/feed/regulacao',
        tipo: 'rss',
        esfera: 'federal',
        setor: 'juridico',
        cor: '#FB923C'
    },
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
 * Faz requisição HTTP/HTTPS
 */
function fetchUrl(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.get(url, {
            headers: {
                'User-Agent': 'IRIS-Platform/1.0 (Regulatory Intelligence Monitor)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            },
            timeout: timeout
        }, (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location, timeout)
                    .then(resolve)
                    .catch(reject);
            }

            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

/**
 * Parse simples de RSS XML
 */
function parseRSS(xml, agencia, config) {
    const noticias = [];

    // Extrai itens do RSS
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1];

        // Extrai campos
        const titulo = extractTag(item, 'title');
        const link = extractTag(item, 'link');
        const descricao = extractTag(item, 'description');
        const pubDate = extractTag(item, 'pubDate');

        if (!titulo) continue;

        // Formata data
        let data = formatarData(pubDate);

        // Classifica tipo
        const tipo = classificarTipo(titulo, descricao);

        // Limpa descrição HTML
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
 * Extrai conteúdo de uma tag XML
 */
function extractTag(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
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

/**
 * Busca notícias de uma agência específica
 */
async function fetchAgenciaNoticias(agencia) {
    const config = FONTES_RSS[agencia];
    if (!config) {
        return [];
    }

    try {
        const xml = await fetchUrl(config.url);
        return parseRSS(xml, agencia, config);
    } catch (error) {
        console.error(`[NewsFetcher] Erro ao buscar ${agencia}: ${error.message}`);
        return [];
    }
}

/**
 * Busca notícias de todas as agências
 */
async function fetchTodasNoticias(limite = 50) {
    const agencias = Object.keys(FONTES_RSS);
    const todasNoticias = [];

    // Busca em paralelo com limite de concorrência
    const batchSize = 5;
    for (let i = 0; i < agencias.length; i += batchSize) {
        const batch = agencias.slice(i, i + batchSize);
        const resultados = await Promise.all(
            batch.map(ag => fetchAgenciaNoticias(ag).catch(() => []))
        );

        for (const noticias of resultados) {
            todasNoticias.push(...noticias);
        }
    }

    // Ordena por data (mais recentes primeiro)
    todasNoticias.sort((a, b) => new Date(b.data) - new Date(a.data));

    // Limita quantidade
    return todasNoticias.slice(0, limite);
}

/**
 * Busca notícias por setor
 */
async function fetchNoticiasPorSetor(setor, limite = 20) {
    const agenciasFiltradas = Object.entries(FONTES_RSS)
        .filter(([_, config]) => config.setor === setor)
        .map(([sigla, _]) => sigla);

    const noticias = [];

    for (const agencia of agenciasFiltradas) {
        const resultado = await fetchAgenciaNoticias(agencia).catch(() => []);
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

    for (const agencia of agenciasFiltradas) {
        const resultado = await fetchAgenciaNoticias(agencia).catch(() => []);
        noticias.push(...resultado);
    }

    noticias.sort((a, b) => new Date(b.data) - new Date(a.data));
    return noticias.slice(0, limite);
}

/**
 * Cache simples em memória
 */
let cacheNoticias = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

async function fetchNoticiasComCache(forceRefresh = false) {
    const agora = Date.now();

    if (!forceRefresh && cacheNoticias && (agora - cacheTimestamp) < CACHE_DURATION) {
        return cacheNoticias;
    }

    cacheNoticias = await fetchTodasNoticias(100);
    cacheTimestamp = agora;

    return cacheNoticias;
}

module.exports = {
    FONTES_RSS,
    fetchAgenciaNoticias,
    fetchTodasNoticias,
    fetchNoticiasPorSetor,
    fetchNoticiasPorEsfera,
    fetchNoticiasComCache,
    classificarTipo
};
