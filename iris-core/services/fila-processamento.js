/**
 * Fila de Processamento de PDFs - IRIS
 *
 * Processa PDFs em fila com controle de concorrência,
 * progresso em tempo real e persistência automática.
 *
 * Fluxo unificado: Upload -> Extração -> Análise -> Métricas -> Persistência
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

// ── Configuração ──
const CONFIG = {
    maxConcurrent: 5,          // PDFs simultâneos (respeita quota Gemini 60/h)
    delayEntreLotes: 500,      // ms entre lotes
    delayEntreItens: 200,      // ms entre itens no lote
    maxRetries: 2,             // tentativas por PDF
    timeoutPorPdf: 120000      // 2 min timeout por PDF
};

// ── Estado da Fila ──
const filaState = {
    items: [],                 // Itens na fila
    processando: false,        // Flag de processamento ativo
    resultados: new Map(),     // Resultados por jobId
    estatisticas: {
        totalProcessados: 0,
        totalErros: 0,
        totalDeliberacoes: 0,
        tempoMedioMs: 0,
        ultimoProcessamento: null
    }
};

/**
 * Gera ID único para job
 */
function gerarJobId() {
    return `job-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Gera hash SHA-256 do texto do PDF
 */
function gerarHashTexto(texto) {
    return crypto.createHash('sha256').update(texto).digest('hex');
}

/**
 * Adiciona PDFs à fila de processamento
 * @param {Array} pdfs - Array de { buffer, nomeArquivo, url? }
 * @param {Object} opcoes - { agencia?, forcarReprocessamento? }
 * @returns {Object} { jobId, totalNaFila }
 */
function adicionarNaFila(pdfs, opcoes = {}) {
    const jobId = gerarJobId();

    const itens = pdfs.map((pdf, idx) => ({
        id: `${jobId}-${idx}`,
        jobId,
        nomeArquivo: pdf.nomeArquivo || `pdf_${Date.now()}_${idx}.pdf`,
        buffer: pdf.buffer,
        url: pdf.url || null,
        agencia: opcoes.agencia || null,
        forcarReprocessamento: opcoes.forcarReprocessamento || false,
        status: 'pendente',      // pendente, processando, concluido, erro
        tentativas: 0,
        resultado: null,
        erro: null,
        criadoEm: Date.now()
    }));

    filaState.items.push(...itens);

    // Inicializa resultado do job
    filaState.resultados.set(jobId, {
        jobId,
        totalPdfs: itens.length,
        processados: 0,
        erros: 0,
        deliberacoesExtraidas: 0,
        status: 'na_fila',
        criadoEm: new Date().toISOString(),
        iniciadoEm: null,
        concluidoEm: null,
        resultadosPorPdf: [],
        metricas: null
    });

    logger.info('FilaProcessamento', `Job ${jobId} adicionado: ${itens.length} PDFs na fila`);

    return { jobId, totalNaFila: filaState.items.length };
}

/**
 * Processa a fila de PDFs
 * @param {Object} deps - Dependências injetadas { pdfParse, geminiAnalyzer, irisCore, persistencia, metricasEngine, detectarEmpresas }
 */
async function processarFila(deps) {
    if (filaState.processando) {
        logger.warn('FilaProcessamento', 'Fila já está sendo processada');
        return;
    }

    const pendentes = filaState.items.filter(i => i.status === 'pendente');
    if (pendentes.length === 0) {
        logger.info('FilaProcessamento', 'Fila vazia, nada para processar');
        return;
    }

    filaState.processando = true;

    try {
        // Processa em lotes de CONFIG.maxConcurrent
        const lotes = [];
        for (let i = 0; i < pendentes.length; i += CONFIG.maxConcurrent) {
            lotes.push(pendentes.slice(i, i + CONFIG.maxConcurrent));
        }

        logger.info('FilaProcessamento', `Processando ${pendentes.length} PDFs em ${lotes.length} lotes`);

        for (let loteIdx = 0; loteIdx < lotes.length; loteIdx++) {
            const lote = lotes[loteIdx];
            logger.info('FilaProcessamento', `Lote ${loteIdx + 1}/${lotes.length}: ${lote.length} PDFs`);

            // Processa lote em paralelo
            const promessas = lote.map((item, idx) => {
                return new Promise(resolve => {
                    // Stagger start
                    setTimeout(async () => {
                        const resultado = await processarItem(item, deps);
                        resolve(resultado);
                    }, idx * CONFIG.delayEntreItens);
                });
            });

            const resultadosLote = await Promise.allSettled(promessas);

            // Atualiza resultados do job
            for (const res of resultadosLote) {
                const resultado = res.status === 'fulfilled' ? res.value : { status: 'erro', erro: res.reason?.message };
                if (resultado && resultado.jobId) {
                    atualizarResultadoJob(resultado);
                }
            }

            // Pausa entre lotes
            if (loteIdx < lotes.length - 1) {
                await sleep(CONFIG.delayEntreLotes);
            }

            // GC entre lotes se disponível
            if (global.gc) global.gc();
        }

    } finally {
        filaState.processando = false;

        // Marca jobs concluídos
        for (const [jobId, job] of filaState.resultados) {
            const itensPendentes = filaState.items.filter(i => i.jobId === jobId && i.status === 'pendente');
            if (itensPendentes.length === 0 && job.status !== 'concluido') {
                job.status = 'concluido';
                job.concluidoEm = new Date().toISOString();
            }
        }

        // Limpa itens processados da fila (mantém últimos 100 para consulta)
        filaState.items = filaState.items.filter(i => i.status === 'pendente').concat(
            filaState.items.filter(i => i.status !== 'pendente').slice(-100)
        );

        logger.info('FilaProcessamento', 'Processamento da fila concluído');
    }
}

/**
 * Processa um único item da fila (fluxo completo)
 */
async function processarItem(item, deps) {
    const { pdfParse, geminiAnalyzer, irisCore, persistencia, detectarEmpresas } = deps;
    const inicio = Date.now();

    item.status = 'processando';
    item.tentativas++;

    // Atualiza status do job
    const job = filaState.resultados.get(item.jobId);
    if (job && job.status === 'na_fila') {
        job.status = 'processando';
        job.iniciadoEm = new Date().toISOString();
    }

    try {
        // ── PASSO 1: Extrair texto do PDF ──
        let textoExtraido = '';
        let metadatasPdf = {};

        if (item.buffer) {
            const pdfData = await pdfParse(item.buffer);
            textoExtraido = pdfData.text || '';
            metadatasPdf = {
                numPaginas: pdfData.numpages,
                numCaracteres: textoExtraido.length,
                info: pdfData.info || {}
            };
            // Libera buffer da memória
            item.buffer = null;
        }

        if (!textoExtraido || textoExtraido.length < 50) {
            throw new Error('Texto extraído muito curto ou vazio - pode necessitar OCR');
        }

        const hashTexto = gerarHashTexto(textoExtraido);

        // ── PASSO 2: Detectar agência ──
        const agenciasConhecidas = ['ARTESP', 'ANEEL', 'ANATEL', 'ANP', 'ANTT', 'ANTAQ', 'ANS', 'ANVISA', 'ANA', 'ANAC', 'ANM', 'ANCINE'];
        const textoUpper = textoExtraido.substring(0, 3000).toUpperCase();
        const agenciaDetectada = item.agencia || agenciasConhecidas.find(a => textoUpper.includes(a)) || 'ARTESP';

        // ── PASSO 3: Extrair deliberações (Gemini + Regex) ──
        let deliberacoesFinais = [];
        let fonteExtracao = 'regex';

        // Tenta Gemini (IA) se disponível
        if (geminiAnalyzer.isGeminiAvailable()) {
            try {
                const deliberacoesGemini = await geminiAnalyzer.analisarMultiplasDeliberacoes(textoExtraido);
                if (deliberacoesGemini && deliberacoesGemini.length > 0) {
                    deliberacoesFinais = deliberacoesGemini;
                    fonteExtracao = 'gemini';
                }
            } catch (geminiErr) {
                logger.warn('FilaProcessamento', `Gemini falhou para ${item.nomeArquivo}: ${geminiErr.message}`);
            }
        }

        // Fallback regex se Gemini não retornou resultados
        if (deliberacoesFinais.length === 0) {
            const extracao = irisCore.extrairDeliberacoesEstruturadas(textoExtraido);
            deliberacoesFinais = extracao.deliberations || [];
        }

        // ── PASSO 4: Enriquecer dados ──
        const empresasDetectadas = detectarEmpresas ? detectarEmpresas(textoExtraido) : [];
        const analiseTradicional = irisCore.analisarTexto(textoExtraido);

        // Normaliza cada deliberação com todos os campos necessários
        deliberacoesFinais = deliberacoesFinais.map(delib => ({
            numero_deliberacao: delib.numero_deliberacao || delib.numero_reuniao || '',
            reuniao_ordinaria: delib.reuniao_ordinaria || delib.numero_reuniao || '',
            data_reuniao: delib.data_reuniao || '',
            agencia: agenciaDetectada,
            interessado: delib.interessado || '',
            processo: delib.processo || '',
            classificacao: delib.pauta_interna ? 'Pauta Interna da Agência' : (delib.classificacao || 'Pleito Externo'),
            microtema: delib.microtema || analiseTradicional.microtema || '',
            resultado: delib.decisao || delib.resultado || analiseTradicional.decisao || '',
            votos_a_favor: delib.votos_a_favor || [],
            votos_contra: delib.votos_contra || [],
            resumo_pleito: delib.resumo_pleito || '',
            fundamento_decisao: delib.fundamento_decisao || '',
            fonte: fonteExtracao,
            confianca: delib.confianca || analiseTradicional.confiancaGeral || 0,
            hash_texto: hashTexto,
            arquivo_origem: item.nomeArquivo
        }));

        // ── PASSO 5: Persistir deliberações ──
        let persistidas = 0;
        const errosPersistencia = [];

        for (const delib of deliberacoesFinais) {
            try {
                await persistencia.salvarDeliberacao({
                    agencia: agenciaDetectada,
                    numeroReuniao: delib.reuniao_ordinaria,
                    dataReuniao: delib.data_reuniao,
                    processo: delib.processo,
                    interessado: delib.interessado,
                    tipo: delib.classificacao === 'Pauta Interna da Agência' ? 'Ato Administrativo Interno' : 'Pleito Externo',
                    microtema: delib.microtema,
                    decisao: delib.resultado,
                    resumoPleito: delib.resumo_pleito,
                    fundamentoDecisao: delib.fundamento_decisao,
                    votosFavoraveis: delib.votos_a_favor,
                    votosContrarios: delib.votos_contra,
                    linkPdf: item.url || '',
                    confiancaGeral: delib.confianca,
                    hashTexto: hashTexto
                });

                // Salva votos individuais
                const votos = [];
                (delib.votos_a_favor || []).forEach(d => votos.push({ diretor: d, voto: 'Favorável', confianca: 70 }));
                (delib.votos_contra || []).forEach(d => votos.push({ diretor: d, voto: 'Contrário', confianca: 70 }));
                if (votos.length > 0) {
                    await persistencia.salvarVotos(null, votos).catch(() => {});
                }

                persistidas++;
            } catch (err) {
                const isDuplicate = err.message && err.message.includes('duplicate');
                if (!isDuplicate) {
                    errosPersistencia.push(err.message);
                }
            }
        }

        // ── PASSO 6: Montar resultado ──
        const duracao = Date.now() - inicio;

        const resultadoItem = {
            id: item.id,
            jobId: item.jobId,
            nomeArquivo: item.nomeArquivo,
            status: 'concluido',
            agenciaDetectada,
            fonteExtracao,
            metadatas: metadatasPdf,
            deliberacoes: deliberacoesFinais,
            totalDeliberacoes: deliberacoesFinais.length,
            persistidas,
            empresasDetectadas,
            hashTexto,
            duracaoMs: duracao,
            errosPersistencia
        };

        item.status = 'concluido';
        item.resultado = resultadoItem;

        // Atualiza estatísticas globais
        filaState.estatisticas.totalProcessados++;
        filaState.estatisticas.totalDeliberacoes += deliberacoesFinais.length;
        filaState.estatisticas.tempoMedioMs = Math.round(
            (filaState.estatisticas.tempoMedioMs * (filaState.estatisticas.totalProcessados - 1) + duracao) /
            filaState.estatisticas.totalProcessados
        );
        filaState.estatisticas.ultimoProcessamento = new Date().toISOString();

        logger.info('FilaProcessamento', `PDF processado: ${item.nomeArquivo} (${deliberacoesFinais.length} delibs, ${duracao}ms, fonte: ${fonteExtracao})`);

        return resultadoItem;

    } catch (error) {
        const duracao = Date.now() - inicio;

        // Retry se possível
        if (item.tentativas < CONFIG.maxRetries) {
            item.status = 'pendente';
            logger.warn('FilaProcessamento', `Retry ${item.tentativas}/${CONFIG.maxRetries} para ${item.nomeArquivo}: ${error.message}`);
            return { id: item.id, jobId: item.jobId, status: 'retry', erro: error.message };
        }

        item.status = 'erro';
        item.erro = error.message;

        filaState.estatisticas.totalErros++;

        const resultadoErro = {
            id: item.id,
            jobId: item.jobId,
            nomeArquivo: item.nomeArquivo,
            status: 'erro',
            erro: error.message,
            duracaoMs: duracao
        };

        item.resultado = resultadoErro;

        logger.error('FilaProcessamento', `Erro no PDF ${item.nomeArquivo}: ${error.message}`);

        return resultadoErro;
    }
}

/**
 * Atualiza resultado agregado do job
 */
function atualizarResultadoJob(resultado) {
    const job = filaState.resultados.get(resultado.jobId);
    if (!job) return;

    if (resultado.status === 'concluido') {
        job.processados++;
        job.deliberacoesExtraidas += resultado.totalDeliberacoes || 0;
        job.resultadosPorPdf.push({
            nomeArquivo: resultado.nomeArquivo,
            status: 'concluido',
            deliberacoes: resultado.totalDeliberacoes || 0,
            persistidas: resultado.persistidas || 0,
            fonteExtracao: resultado.fonteExtracao,
            agencia: resultado.agenciaDetectada,
            duracaoMs: resultado.duracaoMs
        });
    } else if (resultado.status === 'erro') {
        job.erros++;
        job.resultadosPorPdf.push({
            nomeArquivo: resultado.nomeArquivo,
            status: 'erro',
            erro: resultado.erro,
            duracaoMs: resultado.duracaoMs
        });
    }
}

/**
 * Consulta status de um job
 */
function consultarJob(jobId) {
    const job = filaState.resultados.get(jobId);
    if (!job) return null;

    const progresso = job.totalPdfs > 0
        ? Math.round(((job.processados + job.erros) / job.totalPdfs) * 100)
        : 0;

    return {
        ...job,
        progresso,
        emAndamento: job.status === 'processando'
    };
}

/**
 * Consulta status geral da fila
 */
function statusFila() {
    const pendentes = filaState.items.filter(i => i.status === 'pendente').length;
    const processando = filaState.items.filter(i => i.status === 'processando').length;
    const concluidos = filaState.items.filter(i => i.status === 'concluido').length;
    const erros = filaState.items.filter(i => i.status === 'erro').length;

    return {
        processandoAtivo: filaState.processando,
        fila: { pendentes, processando, concluidos, erros, total: filaState.items.length },
        estatisticas: filaState.estatisticas,
        jobsAtivos: [...filaState.resultados.entries()]
            .filter(([, j]) => j.status === 'processando')
            .map(([id, j]) => ({ jobId: id, progresso: j.totalPdfs > 0 ? Math.round(((j.processados + j.erros) / j.totalPdfs) * 100) : 0 }))
    };
}

/**
 * Limpa resultados antigos (mantém últimos N jobs)
 */
function limparHistorico(manterUltimos = 20) {
    const entries = [...filaState.resultados.entries()]
        .sort((a, b) => new Date(b[1].criadoEm) - new Date(a[1].criadoEm));

    if (entries.length > manterUltimos) {
        const paraRemover = entries.slice(manterUltimos);
        for (const [key] of paraRemover) {
            filaState.resultados.delete(key);
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    adicionarNaFila,
    processarFila,
    consultarJob,
    statusFila,
    limparHistorico,
    CONFIG
};
