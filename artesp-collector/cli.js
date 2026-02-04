#!/usr/bin/env node
/**
 * ARTESP PDF Collector - CLI
 * Script de linha de comando para coletar, extrair e enviar PDFs
 *
 * Uso:
 *   node cli.js                          # Coleta incremental
 *   node cli.js --force                  # Coleta completa
 *   node cli.js --send <endpoint>        # Coleta e envia para Lovable
 *   node cli.js --send-only <endpoint>   # Apenas envia (usa cache)
 *   node cli.js --output <arquivo.json>  # Salva resultado em arquivo
 *   node cli.js --help                   # Mostra ajuda
 */

require('dotenv').config();

const { scrapeWithRetry } = require('./src/services/scraper');
const { downloadMultiplePDFs } = require('./src/services/downloader');
const { extractFromMultiple, gerarEstatisticas } = require('./src/services/extractor');
const { sendMultipleToLovable, isValidEndpoint } = require('./src/services/sender');
const syncManager = require('./src/services/sync-manager');
const fs = require('fs').promises;

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

function showHelp() {
    console.log(`
${colors.bright}${colors.cyan}ARTESP PDF Collector - CLI${colors.reset}

${colors.bright}Uso:${colors.reset}
  node cli.js [opcoes]

${colors.bright}Opcoes:${colors.reset}
  --help, -h              Mostra esta ajuda
  --force, -f             Forca coleta completa (ignora historico)
  --send <endpoint>       Envia PDFs para o endpoint da Lovable
  --send-only <endpoint>  Apenas envia ultimo resultado (sem nova coleta)
  --only-new              Envia apenas PDFs novos (com --send)
  --output, -o <arquivo>  Salva resultado em arquivo JSON
  --quiet, -q             Modo silencioso (menos output)
  --status                Mostra status da sincronizacao
  --reset                 Reseta historico de sincronizacao

${colors.bright}Exemplos:${colors.reset}
  ${colors.green}# Coleta incremental (apenas novos)${colors.reset}
  node cli.js

  ${colors.green}# Coleta completa${colors.reset}
  node cli.js --force

  ${colors.green}# Coleta e envia para Lovable${colors.reset}
  node cli.js --send https://seu-endpoint.com/api/pdfs

  ${colors.green}# Coleta, envia apenas novos e salva resultado${colors.reset}
  node cli.js --send https://endpoint.com --only-new --output resultado.json

  ${colors.green}# Verifica status${colors.reset}
  node cli.js --status

${colors.bright}Formato do payload enviado para Lovable:${colors.reset}
  {
    "agencia": "ARTESP",
    "nome_arquivo": "deliberacoes_2025.pdf",
    "texto_pdf": "conteudo extraido...",
    "metadata": {
      "data_coleta": "2025-01-15T10:30:00Z",
      "eh_novo": true,
      "url_original": "https://...",
      "num_paginas": 5,
      "num_caracteres": 12500,
      ...
    }
  }
`);
}

async function showStatus() {
    logSection('Status da Sincronizacao');

    const status = await syncManager.getSyncStatus();
    const summary = await syncManager.getHistorySummary();

    console.log(`\n  Primeira Execucao: ${status.primeiraExecucao ? 'Sim' : 'Nao'}`);
    console.log(`  Modo: ${status.modo}`);
    console.log(`  Ultima Sync: ${status.ultimaSync || 'Nunca'}`);
    console.log(`  PDFs no Historico: ${summary.totalPdfs || 0}`);

    if (summary.porAno) {
        console.log('\n  PDFs por Ano:');
        Object.entries(summary.porAno).forEach(([ano, count]) => {
            console.log(`    ${ano}: ${count}`);
        });
    }

    if (summary.estatisticas) {
        console.log('\n  Estatisticas:');
        console.log(`    Total de Sincronizacoes: ${summary.estatisticas.totalSincronizacoes || 0}`);
        console.log(`    Total PDFs Coletados: ${summary.estatisticas.totalPdfsColetados || 0}`);
    }
}

async function resetHistory() {
    logSection('Resetando Historico');

    const result = await syncManager.resetHistory();

    if (result.success) {
        log('\n  Historico resetado com sucesso!', colors.green);
        if (result.backupFile) {
            log(`  Backup criado: ${result.backupFile}`, colors.yellow);
        }
    } else {
        log('\n  Erro ao resetar historico', colors.red);
    }
}

async function main() {
    const args = process.argv.slice(2);

    // Parse arguments
    const options = {
        force: args.includes('--force') || args.includes('-f'),
        help: args.includes('--help') || args.includes('-h'),
        quiet: args.includes('--quiet') || args.includes('-q'),
        status: args.includes('--status'),
        reset: args.includes('--reset'),
        onlyNew: args.includes('--only-new'),
        send: null,
        sendOnly: null,
        output: null
    };

    // Get endpoint for --send
    const sendIndex = args.indexOf('--send');
    if (sendIndex !== -1 && args[sendIndex + 1]) {
        options.send = args[sendIndex + 1];
    }

    // Get endpoint for --send-only
    const sendOnlyIndex = args.indexOf('--send-only');
    if (sendOnlyIndex !== -1 && args[sendOnlyIndex + 1]) {
        options.sendOnly = args[sendOnlyIndex + 1];
    }

    // Get output file
    const outputIndex = args.indexOf('--output') !== -1 ? args.indexOf('--output') : args.indexOf('-o');
    if (outputIndex !== -1 && args[outputIndex + 1]) {
        options.output = args[outputIndex + 1];
    }

    // Show help
    if (options.help) {
        showHelp();
        return;
    }

    // Show status
    if (options.status) {
        await showStatus();
        return;
    }

    // Reset history
    if (options.reset) {
        await resetHistory();
        return;
    }

    // Validate send endpoint
    if (options.send && !isValidEndpoint(options.send)) {
        log('\nErro: Endpoint invalido. Deve ser uma URL HTTP/HTTPS valida.', colors.red);
        process.exit(1);
    }

    if (options.sendOnly && !isValidEndpoint(options.sendOnly)) {
        log('\nErro: Endpoint invalido. Deve ser uma URL HTTP/HTTPS valida.', colors.red);
        process.exit(1);
    }

    logSection('ARTESP PDF Collector - CLI');

    const startTime = Date.now();
    let pdfsProcessados = [];

    try {
        // ===========================================
        // ETAPA 1: SCRAPING
        // ===========================================
        if (!options.sendOnly) {
            log('\n[1/4] Scraping da pagina da ARTESP...', colors.yellow);

            const linksEncontrados = await scrapeWithRetry(3);

            if (linksEncontrados.length === 0) {
                log('  Nenhum PDF encontrado para 2025-2026', colors.yellow);
                return;
            }

            log(`  ${linksEncontrados.length} links encontrados`, colors.green);

            // ===========================================
            // ETAPA 2: COMPARAR COM HISTORICO
            // ===========================================
            log('\n[2/4] Verificando historico...', colors.yellow);

            let comparacao;
            if (options.force) {
                comparacao = {
                    modo: 'COMPLETO',
                    novos: linksEncontrados.map(pdf => ({ ...pdf, ehNovo: true })),
                    jaColetados: [],
                    totalNovos: linksEncontrados.length,
                    totalJaColetados: 0
                };
                log(`  Modo COMPLETO: ${comparacao.totalNovos} PDFs serao coletados`, colors.cyan);
            } else {
                comparacao = await syncManager.compareWithHistory(linksEncontrados);
                log(`  Modo ${comparacao.modo}:`, colors.cyan);
                log(`    - Novos: ${comparacao.totalNovos}`, colors.green);
                log(`    - Ja coletados: ${comparacao.totalJaColetados}`, colors.blue);
            }

            if (comparacao.novos.length === 0) {
                log('\n  Nenhum PDF novo para coletar!', colors.green);
                log('  Use --force para forcar coleta completa.', colors.yellow);
                return;
            }

            // ===========================================
            // ETAPA 3: DOWNLOAD
            // ===========================================
            log('\n[3/4] Baixando PDFs...', colors.yellow);

            const onDownloadProgress = (progress) => {
                if (!options.quiet) {
                    process.stdout.write(`\r  Baixando ${progress.atual}/${progress.total}: ${progress.arquivo.substring(0, 40)}...`);
                }
            };

            const pdfsComBuffer = await downloadMultiplePDFs(comparacao.novos, onDownloadProgress);
            console.log(''); // Nova linha apos progress

            const downloadSucessos = pdfsComBuffer.filter(p => p.status === 'sucesso').length;
            log(`  ${downloadSucessos}/${comparacao.novos.length} PDFs baixados`, colors.green);

            // ===========================================
            // ETAPA 4: EXTRACAO
            // ===========================================
            log('\n[4/4] Extraindo texto dos PDFs...', colors.yellow);

            const onExtractProgress = (progress) => {
                if (!options.quiet) {
                    process.stdout.write(`\r  Extraindo ${progress.atual}/${progress.total}: ${progress.arquivo.substring(0, 40)}...`);
                }
            };

            pdfsProcessados = await extractFromMultiple(pdfsComBuffer, onExtractProgress);
            console.log(''); // Nova linha apos progress

            // Atualiza historico
            await syncManager.updateHistory(pdfsProcessados, options.force);

            // Estatisticas
            const stats = gerarEstatisticas(pdfsProcessados);

            logSection('Resultado da Extracao');
            console.log(`
  PDFs Processados: ${stats.pdfsSucesso}/${stats.totalPDFs}
  PDFs Novos: ${stats.pdfsNovos}
  Total de Paginas: ${stats.totalPaginas}
  Total de Caracteres: ${stats.totalCaracteres.toLocaleString()}
  Total de Palavras: ${stats.totalPalavras.toLocaleString()}
  Media Caracteres/PDF: ${stats.mediaCaracteresPorPDF.toLocaleString()}
`);
        }

        // ===========================================
        // ETAPA 5: ENVIAR PARA LOVABLE (opcional)
        // ===========================================
        const endpoint = options.send || options.sendOnly;

        if (endpoint) {
            logSection('Enviando para Lovable');
            log(`\n  Endpoint: ${endpoint}`, colors.cyan);

            let pdfsParaEnviar = pdfsProcessados;

            if (options.onlyNew) {
                pdfsParaEnviar = pdfsProcessados.filter(p => p.ehNovo);
                log(`  Enviando apenas novos: ${pdfsParaEnviar.length} PDF(s)`, colors.yellow);
            }

            if (pdfsParaEnviar.length === 0) {
                log('\n  Nenhum PDF para enviar!', colors.yellow);
            } else {
                const onSendProgress = (progress) => {
                    if (!options.quiet) {
                        process.stdout.write(`\r  Enviando ${progress.atual}/${progress.total}: ${progress.arquivo.substring(0, 40)}...`);
                    }
                };

                const resultado = await sendMultipleToLovable(pdfsParaEnviar, endpoint, onSendProgress);
                console.log('');

                log(`\n  Resultado do Envio:`, colors.bright);
                log(`    Sucessos: ${resultado.sucessos}`, colors.green);
                log(`    Erros: ${resultado.erros}`, resultado.erros > 0 ? colors.red : colors.green);
                log(`    Pulados: ${resultado.pulados}`, colors.yellow);
                log(`    Duracao: ${resultado.duracao}`, colors.cyan);

                // Mostra erros detalhados
                if (resultado.erros > 0) {
                    log('\n  Detalhes dos erros:', colors.red);
                    resultado.resultados
                        .filter(r => r.status === 'erro')
                        .forEach(r => {
                            log(`    - ${r.nomeArquivo}: ${r.erro}`, colors.red);
                        });
                }
            }
        }

        // ===========================================
        // SALVAR OUTPUT (opcional)
        // ===========================================
        if (options.output && pdfsProcessados.length > 0) {
            logSection('Salvando Resultado');

            const output = {
                timestamp: new Date().toISOString(),
                estatisticas: gerarEstatisticas(pdfsProcessados),
                pdfs: pdfsProcessados.map(pdf => ({
                    nomeArquivo: pdf.nomeArquivo,
                    url: pdf.url,
                    data: pdf.data,
                    ano: pdf.ano,
                    reuniao: pdf.reuniao,
                    numPaginas: pdf.numPaginas,
                    numCaracteres: pdf.numCaracteres,
                    numPalavras: pdf.numPalavras,
                    ehNovo: pdf.ehNovo,
                    texto: pdf.texto
                }))
            };

            await fs.writeFile(options.output, JSON.stringify(output, null, 2), 'utf8');
            log(`\n  Resultado salvo em: ${options.output}`, colors.green);
        }

        // Tempo total
        const duracao = ((Date.now() - startTime) / 1000).toFixed(2);
        log(`\nProcesso concluido em ${duracao}s`, colors.bright + colors.green);

    } catch (error) {
        log(`\nErro: ${error.message}`, colors.red);
        if (!options.quiet) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Executa
main().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
});
