#!/usr/bin/env node
/**
 * Script de análise do site ARTESP
 *
 * Analisa a página de reuniões e mostra todos os PDFs disponíveis
 * agrupados por ano e tipo (Pauta, Ata, Deliberações)
 *
 * Uso: node analyze-site.js
 */

require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

const REUNIOES_URL = 'https://www.artesp.sp.gov.br/artesp/transparencia/reunioes-diretoria';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Cores
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(msg, color = '') {
    console.log(`${color}${msg}${colors.reset}`);
}

async function analyzeSite() {
    log('\n' + '='.repeat(70), colors.cyan);
    log('  ANÁLISE DO SITE ARTESP - Reuniões da Diretoria', colors.bright + colors.cyan);
    log('='.repeat(70), colors.cyan);

    log(`\nURL: ${REUNIOES_URL}`, colors.blue);
    log('Carregando página...', colors.yellow);

    try {
        const response = await axios.get(REUNIOES_URL, {
            timeout: 30000,
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        log(`Página carregada com sucesso (${response.status})`, colors.green);

        const $ = cheerio.load(response.data);

        // Estruturas para armazenar dados
        const todosPDFs = [];
        const porAno = {};
        const porTipo = { deliberacoes: 0, pauta: 0, ata: 0, outros: 0 };

        // Analisa todos os links
        $('a').each((index, element) => {
            const $link = $(element);
            const texto = $link.text().trim();
            const href = $link.attr('href') || '';

            // Verifica se é link de PDF (binary=true ou .pdf)
            const isPDF = href.includes('binary=true') || href.toLowerCase().endsWith('.pdf');

            if (!isPDF || !texto) return;

            // Determina o tipo baseado no texto
            const textoLower = texto.toLowerCase();
            let tipo = 'outros';

            if (textoLower.includes('delibera')) {
                tipo = 'deliberacoes';
            } else if (textoLower.includes('pauta')) {
                tipo = 'pauta';
            } else if (textoLower.includes('ata')) {
                tipo = 'ata';
            }

            porTipo[tipo]++;

            // Extrai ano do contexto
            let ano = null;

            // Busca em ancestrais
            let $current = $link;
            for (let i = 0; i < 15; i++) {
                $current = $current.parent();
                if (!$current.length) break;

                const contexto = $current.text();

                // Procura data no formato DD/MM/YYYY
                const matchData = contexto.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})/);
                if (matchData) {
                    ano = matchData[3];
                    break;
                }

                // Procura ano isolado (2020-2026)
                const matchAno = contexto.match(/\b(20[2][0-6])\b/);
                if (matchAno) {
                    ano = matchAno[1];
                    break;
                }
            }

            // Tenta extrair ano da URL também
            if (!ano) {
                const urlAnoMatch = href.match(/20[2][0-6]/);
                if (urlAnoMatch) {
                    ano = urlAnoMatch[0];
                }
            }

            ano = ano || 'Desconhecido';

            // Extrai número da reunião
            let numeroReuniao = null;
            let $searchContext = $link;
            for (let i = 0; i < 5; i++) {
                $searchContext = $searchContext.parent();
                if (!$searchContext.length) break;

                const ctx = $searchContext.text();
                const matchReuniao = ctx.match(/(\d{3,4})[ªº]?\s*(?:Reuni[ãa]o|Extraordin[áa]ria)/i);
                if (matchReuniao) {
                    numeroReuniao = matchReuniao[1];
                    break;
                }
            }

            // Adiciona ao array
            todosPDFs.push({
                texto,
                tipo,
                ano,
                numeroReuniao,
                url: href.substring(0, 80) + (href.length > 80 ? '...' : '')
            });

            // Agrupa por ano
            if (!porAno[ano]) {
                porAno[ano] = { deliberacoes: 0, pauta: 0, ata: 0, outros: 0, total: 0 };
            }
            porAno[ano][tipo]++;
            porAno[ano].total++;
        });

        // Exibe resultados
        log('\n' + '='.repeat(70), colors.cyan);
        log('  RESUMO GERAL', colors.bright);
        log('='.repeat(70), colors.cyan);

        log(`\nTotal de PDFs encontrados: ${todosPDFs.length}`, colors.bright + colors.green);
        log(`  - Deliberações: ${porTipo.deliberacoes}`, colors.green);
        log(`  - Pautas: ${porTipo.pauta}`, colors.blue);
        log(`  - Atas: ${porTipo.ata}`, colors.yellow);
        log(`  - Outros: ${porTipo.outros}`, colors.magenta);

        log('\n' + '='.repeat(70), colors.cyan);
        log('  PDFs POR ANO', colors.bright);
        log('='.repeat(70), colors.cyan);

        // Ordena anos do mais recente ao mais antigo
        const anosOrdenados = Object.keys(porAno).sort((a, b) => {
            if (a === 'Desconhecido') return 1;
            if (b === 'Desconhecido') return -1;
            return parseInt(b) - parseInt(a);
        });

        for (const ano of anosOrdenados) {
            const dados = porAno[ano];
            log(`\n${colors.bright}${ano}:${colors.reset} ${dados.total} PDFs total`);
            log(`  Deliberações: ${dados.deliberacoes}`, dados.deliberacoes > 0 ? colors.green : colors.red);
            log(`  Pautas: ${dados.pauta}`, colors.blue);
            log(`  Atas: ${dados.ata}`, colors.yellow);
            if (dados.outros > 0) {
                log(`  Outros: ${dados.outros}`, colors.magenta);
            }
        }

        // Lista detalhada de Deliberações
        log('\n' + '='.repeat(70), colors.cyan);
        log('  LISTA DETALHADA - DELIBERAÇÕES', colors.bright);
        log('='.repeat(70), colors.cyan);

        const deliberacoes = todosPDFs.filter(p => p.tipo === 'deliberacoes');

        // Agrupa por ano
        for (const ano of anosOrdenados) {
            const delibDoAno = deliberacoes.filter(d => d.ano === ano);
            if (delibDoAno.length === 0) continue;

            log(`\n${colors.bright}${colors.yellow}[${ano}]${colors.reset} - ${delibDoAno.length} deliberações:`);

            delibDoAno.forEach((d, i) => {
                const reuniao = d.numeroReuniao ? `Reunião ${d.numeroReuniao}` : '';
                log(`  ${i + 1}. ${reuniao || d.texto}`, colors.green);
            });
        }

        // Verifica anos permitidos no scraper atual
        log('\n' + '='.repeat(70), colors.cyan);
        log('  STATUS DO SCRAPER ATUAL', colors.bright);
        log('='.repeat(70), colors.cyan);

        const anosPermitidos = ['2025', '2026'];
        let totalPermitido = 0;

        log(`\nAnos configurados no scraper: ${anosPermitidos.join(', ')}`);

        for (const ano of anosPermitidos) {
            if (porAno[ano]) {
                totalPermitido += porAno[ano].deliberacoes;
                log(`  ${ano}: ${porAno[ano].deliberacoes} deliberações`, colors.green);
            } else {
                log(`  ${ano}: 0 deliberações`, colors.yellow);
            }
        }

        log(`\nTotal de deliberações que o scraper deveria capturar: ${totalPermitido}`, colors.bright + colors.green);

        // Compara com outros anos
        const anosNaoIncluidos = anosOrdenados.filter(a => !anosPermitidos.includes(a) && a !== 'Desconhecido');
        if (anosNaoIncluidos.length > 0) {
            let totalNaoIncluido = 0;
            log(`\n${colors.yellow}Anos NÃO incluídos no scraper:${colors.reset}`);
            for (const ano of anosNaoIncluidos) {
                if (porAno[ano].deliberacoes > 0) {
                    totalNaoIncluido += porAno[ano].deliberacoes;
                    log(`  ${ano}: ${porAno[ano].deliberacoes} deliberações`, colors.red);
                }
            }
            if (totalNaoIncluido > 0) {
                log(`\n${colors.red}ATENÇÃO: Há ${totalNaoIncluido} deliberações em anos não capturados!${colors.reset}`);
            }
        }

        log('\n' + '='.repeat(70), colors.cyan);
        log('  RECOMENDAÇÕES', colors.bright);
        log('='.repeat(70), colors.cyan);

        if (totalPermitido !== porTipo.deliberacoes) {
            log(`\n${colors.yellow}Para capturar TODAS as deliberações, ajuste ANOS_PERMITIDOS no scraper.${colors.reset}`);
            log(`Exemplo: const ANOS_PERMITIDOS = ${JSON.stringify(anosOrdenados.filter(a => a !== 'Desconhecido'))};`);
        } else {
            log(`\n${colors.green}O scraper está configurado para capturar todas as deliberações disponíveis (${totalPermitido}).${colors.reset}`);
        }

        return {
            total: todosPDFs.length,
            deliberacoes: porTipo.deliberacoes,
            porAno,
            anosDisponiveis: anosOrdenados.filter(a => a !== 'Desconhecido')
        };

    } catch (error) {
        log(`\nErro ao acessar o site: ${error.message}`, colors.red);
        console.error(error);
        process.exit(1);
    }
}

// Executa
analyzeSite().then(result => {
    log(`\n${'='.repeat(70)}`, colors.cyan);
    log('Análise concluída!', colors.bright + colors.green);
}).catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
});
