#!/usr/bin/env node
/**
 * ARTESP PDF Collector - CLI com integração direta ao Supabase
 *
 * Este script coleta PDFs e envia diretamente para o Supabase do IRIS Regulation
 *
 * Configuração necessária no .env:
 *   SUPABASE_URL=https://seu-projeto.supabase.co
 *   SUPABASE_ANON_KEY=sua-anon-key
 *   SUPABASE_SERVICE_KEY=sua-service-key (opcional, para bypass RLS)
 *
 * Uso:
 *   node cli-supabase.js                    # Coleta e envia para Supabase
 *   node cli-supabase.js --force            # Coleta completa
 *   node cli-supabase.js --dry-run          # Simula sem enviar
 *   node cli-supabase.js --help             # Mostra ajuda
 */

require('dotenv').config();

const { scrapeWithRetry } = require('./src/services/scraper');
const { downloadMultiplePDFs } = require('./src/services/downloader');
const { extractFromMultiple, gerarEstatisticas } = require('./src/services/extractor');
const syncManager = require('./src/services/sync-manager');

// Cores para terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(msg, color = '') {
    console.log(`${color}${msg}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(`  ${title}`, colors.bright + colors.cyan);
    console.log('='.repeat(60));
}

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

function showHelp() {
    console.log(`
${colors.bright}${colors.cyan}ARTESP PDF Collector - Supabase Integration${colors.reset}

${colors.bright}Uso:${colors.reset}
  node cli-supabase.js [opcoes]

${colors.bright}Opcoes:${colors.reset}
  --help, -h         Mostra esta ajuda
  --force, -f        Forca coleta completa (ignora historico)
  --dry-run          Simula sem enviar para Supabase
  --quiet, -q        Modo silencioso
  --status           Mostra status da sincronizacao
  --classify         Dispara classificacao apos inserir

${colors.bright}Configuracao necessaria no .env:${colors.reset}
  SUPABASE_URL=https://seu-projeto.supabase.co
  SUPABASE_ANON_KEY=sua-anon-key
  SUPABASE_SERVICE_KEY=sua-service-key (opcional)

${colors.bright}Exemplos:${colors.reset}
  ${colors.green}# Coleta e envia para Supabase${colors.reset}
  node cli-supabase.js

  ${colors.green}# Coleta completa (ignora historico)${colors.reset}
  node cli-supabase.js --force

  ${colors.green}# Simular sem enviar${colors.reset}
  node cli-supabase.js --dry-run

${colors.bright}Tabelas afetadas no Supabase:${colors.reset}
  - reunioes_monitoradas (cria registro da reuniao)
  - deliberacoes_extraidas (armazena texto extraido)
`);
}

/**
 * Envia dados para o Supabase via REST API
 */
async function sendToSupabase(table, data) {
    const axios = require('axios');

    const response = await axios.post(
        `${SUPABASE_URL}/rest/v1/${table}`,
        data,
        {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        }
    );

    return response.data;
}

/**
 * Busca dados do Supabase via REST API
 */
async function querySupabase(table, query = '') {
    const axios = require('axios');

    const response = await axios.get(
        `${SUPABASE_URL}/rest/v1/${table}${query}`,
        {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data;
}

/**
 * Extrai informações do nome do arquivo
 */
function parseFilename(filename) {
    let numeroReuniao = null;
    let dataReuniao = null;
    let ano = null;

    // Tentar extrair número da reunião
    const reuniaoPatterns = [
        /reuniao[_\s-]*(\d+)/i,
        /RD[_\s-]*\d{4}[_\s-]*(\d+)/i,
        /(\d{3,4})[ª°]?\s*reuniao/i
    ];

    for (const pattern of reuniaoPatterns) {
        const match = filename.match(pattern);
        if (match) {
            numeroReuniao = match[1];
            break;
        }
    }

    // Extrair ano
    const anoMatch = filename.match(/20(2[5-9]|[3-9]\d)/);
    if (anoMatch) {
        ano = `20${anoMatch[1]}`;
    }

    // Tentar extrair data
    const dataMatch = filename.match(/(\d{2})[_-](\d{2})[_-](20\d{2})/);
    if (dataMatch) {
        dataReuniao = `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`;
    }

    return { numeroReuniao, dataReuniao, ano };
}

/**
 * Processa e envia um PDF para o Supabase
 */
async function processPDFToSupabase(pdf, options) {
    const parsed = parseFilename(pdf.nomeArquivo);

    // 1. Verificar se já existe pela URL ou hash
    try {
        const existing = await querySupabase(
            'deliberacoes_extraidas',
            `?raw_data->>hash=eq.${pdf.hash}&select=id`
        );

        if (existing && existing.length > 0) {
            return {
                status: 'skipped',
                reason: 'duplicate',
                id: existing[0].id
            };
        }
    } catch (e) {
        // Continua se não encontrar
    }

    // 2. Criar ou buscar reunião monitorada
    let reuniaoId = null;

    if (pdf.url) {
        try {
            // Verificar se já existe
            const existingReuniao = await querySupabase(
                'reunioes_monitoradas',
                `?url_origem=eq.${encodeURIComponent(pdf.url)}&select=id`
            );

            if (existingReuniao && existingReuniao.length > 0) {
                reuniaoId = existingReuniao[0].id;
            } else {
                // Criar nova reunião
                const novaReuniao = await sendToSupabase('reunioes_monitoradas', {
                    url_origem: pdf.url,
                    link_pdf: pdf.url,
                    numero_reuniao: parsed.numeroReuniao || pdf.reuniao,
                    data_reuniao: parsed.dataReuniao || pdf.data,
                    tipo: 'DELIBERACAO_PADRAO',
                    status: 'processado',
                    progresso: 100
                });

                if (novaReuniao && novaReuniao.length > 0) {
                    reuniaoId = novaReuniao[0].id;
                }
            }
        } catch (e) {
            console.warn(`  Aviso: Não foi possível criar reunião monitorada: ${e.message}`);
        }
    }

    // 3. Inserir deliberação
    const deliberacao = {
        reuniao_id: reuniaoId,
        agencia: 'ARTESP',
        numero_reuniao: parsed.numeroReuniao || pdf.reuniao,
        data_reuniao: parsed.dataReuniao || pdf.data,
        processo: `Deliberações ${parsed.numeroReuniao || pdf.nomeArquivo}`,
        interessado: 'Múltiplos interessados (a classificar)',
        pauta_interna: false,
        microtema: 'A classificar',
        resumo_pleito: pdf.texto ? pdf.texto.substring(0, 500) + '...' : null,
        decisao: 'A classificar',
        link_pdf: pdf.url,
        raw_data: {
            fonte: 'cli-artesp-collector',
            nome_arquivo: pdf.nomeArquivo,
            texto_completo: pdf.texto,
            hash: pdf.hash,
            num_paginas: pdf.numPaginas,
            num_caracteres: pdf.numCaracteres,
            num_palavras: pdf.numPalavras,
            eh_escaneado: pdf.ehEscaneado,
            data_coleta: pdf.extractedAt || new Date().toISOString(),
            eh_novo: pdf.ehNovo
        }
    };

    if (options.dryRun) {
        return {
            status: 'dry-run',
            data: deliberacao
        };
    }

    const inserted = await sendToSupabase('deliberacoes_extraidas', deliberacao);

    return {
        status: 'inserted',
        id: inserted[0]?.id,
        reuniao_id: reuniaoId
    };
}

async function main() {
    const args = process.argv.slice(2);

    // Parse arguments
    const options = {
        force: args.includes('--force') || args.includes('-f'),
        help: args.includes('--help') || args.includes('-h'),
        quiet: args.includes('--quiet') || args.includes('-q'),
        status: args.includes('--status'),
        dryRun: args.includes('--dry-run'),
        classify: args.includes('--classify')
    };

    // Show help
    if (options.help) {
        showHelp();
        return;
    }

    // Validate Supabase config
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        log('\nErro: Configuracao do Supabase nao encontrada!', colors.red);
        log('Configure as variaveis no arquivo .env:', colors.yellow);
        log('  SUPABASE_URL=https://seu-projeto.supabase.co', colors.yellow);
        log('  SUPABASE_ANON_KEY=sua-anon-key', colors.yellow);
        process.exit(1);
    }

    if (options.status) {
        await showStatus();
        return;
    }

    logSection('ARTESP PDF Collector - Supabase Integration');
    log(`\n  Supabase URL: ${SUPABASE_URL.substring(0, 40)}...`, colors.cyan);

    if (options.dryRun) {
        log('  Modo: DRY-RUN (nao envia dados)', colors.yellow);
    }

    const startTime = Date.now();

    try {
        // ===========================================
        // ETAPA 1: SCRAPING
        // ===========================================
        log('\n[1/5] Scraping da pagina da ARTESP...', colors.yellow);

        const linksEncontrados = await scrapeWithRetry(3);

        if (linksEncontrados.length === 0) {
            log('  Nenhum PDF encontrado para 2025-2026', colors.yellow);
            return;
        }

        log(`  ${linksEncontrados.length} links encontrados`, colors.green);

        // ===========================================
        // ETAPA 2: COMPARAR COM HISTORICO
        // ===========================================
        log('\n[2/5] Verificando historico local...', colors.yellow);

        let comparacao;
        if (options.force) {
            comparacao = {
                modo: 'COMPLETO',
                novos: linksEncontrados.map(pdf => ({ ...pdf, ehNovo: true })),
                jaColetados: [],
                totalNovos: linksEncontrados.length,
                totalJaColetados: 0
            };
            log(`  Modo COMPLETO: ${comparacao.totalNovos} PDFs serao processados`, colors.cyan);
        } else {
            comparacao = await syncManager.compareWithHistory(linksEncontrados);
            log(`  Modo ${comparacao.modo}:`, colors.cyan);
            log(`    - Novos: ${comparacao.totalNovos}`, colors.green);
            log(`    - Ja coletados: ${comparacao.totalJaColetados}`, colors.blue);
        }

        if (comparacao.novos.length === 0) {
            log('\n  Nenhum PDF novo para processar!', colors.green);
            return;
        }

        // ===========================================
        // ETAPA 3: DOWNLOAD
        // ===========================================
        log('\n[3/5] Baixando PDFs...', colors.yellow);

        const pdfsComBuffer = await downloadMultiplePDFs(comparacao.novos, (progress) => {
            if (!options.quiet) {
                process.stdout.write(`\r  Baixando ${progress.atual}/${progress.total}...`);
            }
        });
        console.log('');

        const downloadSucessos = pdfsComBuffer.filter(p => p.status === 'sucesso').length;
        log(`  ${downloadSucessos}/${comparacao.novos.length} PDFs baixados`, colors.green);

        // ===========================================
        // ETAPA 4: EXTRACAO
        // ===========================================
        log('\n[4/5] Extraindo texto dos PDFs...', colors.yellow);

        const pdfsProcessados = await extractFromMultiple(pdfsComBuffer, (progress) => {
            if (!options.quiet) {
                process.stdout.write(`\r  Extraindo ${progress.atual}/${progress.total}...`);
            }
        });
        console.log('');

        // Atualiza historico local
        await syncManager.updateHistory(pdfsProcessados, options.force);

        // ===========================================
        // ETAPA 5: ENVIAR PARA SUPABASE
        // ===========================================
        log('\n[5/5] Enviando para Supabase...', colors.yellow);

        const pdfsComTexto = pdfsProcessados.filter(p => p.statusExtracao === 'sucesso' && p.texto);
        let inserted = 0;
        let skipped = 0;
        let errors = 0;

        for (let i = 0; i < pdfsComTexto.length; i++) {
            const pdf = pdfsComTexto[i];

            if (!options.quiet) {
                process.stdout.write(`\r  Enviando ${i + 1}/${pdfsComTexto.length}: ${pdf.nomeArquivo.substring(0, 30)}...`);
            }

            try {
                const result = await processPDFToSupabase(pdf, options);

                if (result.status === 'inserted' || result.status === 'dry-run') {
                    inserted++;
                } else if (result.status === 'skipped') {
                    skipped++;
                }
            } catch (error) {
                errors++;
                if (!options.quiet) {
                    console.log('');
                    log(`  Erro em ${pdf.nomeArquivo}: ${error.message}`, colors.red);
                }
            }

            // Delay entre requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        console.log('');

        // ===========================================
        // RESULTADO FINAL
        // ===========================================
        const stats = gerarEstatisticas(pdfsProcessados);
        const duracao = ((Date.now() - startTime) / 1000).toFixed(2);

        logSection('Resultado');
        console.log(`
  PDFs Processados: ${stats.pdfsSucesso}/${stats.totalPDFs}
  Enviados ao Supabase: ${inserted}
  Duplicados (pulados): ${skipped}
  Erros: ${errors}

  Total de Paginas: ${stats.totalPaginas}
  Total de Caracteres: ${stats.totalCaracteres.toLocaleString()}

  Duracao: ${duracao}s
`);

        if (options.dryRun) {
            log('  (Modo DRY-RUN - nenhum dado foi enviado)', colors.yellow);
        }

        log(`\nProcesso concluido!`, colors.bright + colors.green);

    } catch (error) {
        log(`\nErro: ${error.message}`, colors.red);
        console.error(error.stack);
        process.exit(1);
    }
}

async function showStatus() {
    logSection('Status');

    // Status local
    const localStatus = await syncManager.getSyncStatus();
    const localSummary = await syncManager.getHistorySummary();

    log('\nHistorico Local:', colors.bright);
    console.log(`  Primeira Execucao: ${localStatus.primeiraExecucao ? 'Sim' : 'Nao'}`);
    console.log(`  Modo: ${localStatus.modo}`);
    console.log(`  Ultima Sync: ${localStatus.ultimaSync || 'Nunca'}`);
    console.log(`  PDFs no Historico: ${localSummary.totalPdfs || 0}`);

    // Status Supabase
    if (SUPABASE_URL && SUPABASE_KEY) {
        try {
            log('\nSupabase:', colors.bright);

            const reunioes = await querySupabase('reunioes_monitoradas', '?agencia_id=is.null&select=count');
            const deliberacoes = await querySupabase('deliberacoes_extraidas', '?agencia=eq.ARTESP&select=count');

            console.log(`  URL: ${SUPABASE_URL.substring(0, 40)}...`);
            console.log(`  Reunioes monitoradas: ${reunioes[0]?.count || 'N/A'}`);
            console.log(`  Deliberacoes ARTESP: ${deliberacoes[0]?.count || 'N/A'}`);
        } catch (error) {
            log(`  Erro ao consultar Supabase: ${error.message}`, colors.red);
        }
    }
}

// Executa
main().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
});
