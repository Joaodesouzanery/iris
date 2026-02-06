/**
 * IRIS Platform - Plataforma Unificada
 *
 * Combina coleta de PDFs (ARTESP) + Análise de Deliberações
 * Tudo em uma única interface
 *
 * Acesse: http://localhost:3000
 */

require('dotenv').config();

const express = require('express');
const path = require('path');

// Importa serviços do coletor
const { scrapeWithRetry } = require('./src/services/scraper');
const { downloadMultiplePDFs } = require('./src/services/downloader');
const { extractFromMultiple, gerarEstatisticas } = require('./src/services/extractor');
const syncManager = require('./src/services/sync-manager');

// Importa serviços do IRIS Core
const irisCore = require('../iris-core/processador');

const app = express();
const PORT = process.env.PORT || 3000;

// Armazena PDFs processados em memória
let pdfsProcessados = [];
let ultimaColeta = null;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// API - COLETA DE PDFs
// ============================================================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'IRIS Platform',
        pdfsEmMemoria: pdfsProcessados.length,
        ultimaColeta
    });
});

app.post('/api/scrape-and-extract', async (req, res) => {
    try {
        const forceComplete = req.query.force === 'true';

        console.log('\n[IRIS] Iniciando coleta de PDFs...');

        // 1. Scraping
        const links = await scrapeWithRetry(3);

        if (links.length === 0) {
            return res.json({
                sucesso: true,
                mensagem: 'Nenhum PDF encontrado',
                pdfs: []
            });
        }

        // 2. Comparar com histórico
        let pdfsParaProcessar;
        if (forceComplete) {
            pdfsParaProcessar = links.map(pdf => ({ ...pdf, ehNovo: true }));
        } else {
            const comparacao = await syncManager.compareWithHistory(links);
            pdfsParaProcessar = comparacao.novos;
        }

        if (pdfsParaProcessar.length === 0) {
            return res.json({
                sucesso: true,
                mensagem: 'Todos os PDFs já foram coletados anteriormente',
                pdfs: []
            });
        }

        // 3. Download
        const pdfsComBuffer = await downloadMultiplePDFs(pdfsParaProcessar);

        // 4. Extração
        const pdfsExtraidos = await extractFromMultiple(pdfsComBuffer);

        // 5. Atualiza histórico
        await syncManager.updateHistory(pdfsExtraidos, forceComplete);

        // Armazena em memória
        pdfsProcessados = pdfsExtraidos.filter(p => p.statusExtracao === 'sucesso');
        ultimaColeta = new Date().toISOString();

        const stats = gerarEstatisticas(pdfsExtraidos);

        res.json({
            sucesso: true,
            mensagem: `${stats.pdfsSucesso} PDFs processados com sucesso`,
            estatisticas: stats,
            pdfs: pdfsProcessados.map(p => ({
                nomeArquivo: p.nomeArquivo,
                data: p.data,
                reuniao: p.reuniao,
                numPaginas: p.numPaginas,
                numCaracteres: p.numCaracteres,
                textoPreview: p.texto?.substring(0, 300) + '...'
            }))
        });

    } catch (error) {
        console.error('[IRIS] Erro:', error);
        res.status(500).json({ erro: error.message });
    }
});

app.get('/api/pdfs', (req, res) => {
    res.json({
        total: pdfsProcessados.length,
        ultimaColeta,
        pdfs: pdfsProcessados.map((p, i) => ({
            index: i,
            nomeArquivo: p.nomeArquivo,
            data: p.data,
            reuniao: p.reuniao,
            numPaginas: p.numPaginas,
            numCaracteres: p.numCaracteres,
            analisado: p.analise ? true : false
        }))
    });
});

app.get('/api/pdfs/:index', (req, res) => {
    const index = parseInt(req.params.index);

    if (index < 0 || index >= pdfsProcessados.length) {
        return res.status(404).json({ erro: 'PDF não encontrado' });
    }

    const pdf = pdfsProcessados[index];
    res.json({
        nomeArquivo: pdf.nomeArquivo,
        data: pdf.data,
        reuniao: pdf.reuniao,
        url: pdf.url,
        numPaginas: pdf.numPaginas,
        numCaracteres: pdf.numCaracteres,
        texto: pdf.texto,
        analise: pdf.analise || null
    });
});

// ============================================================================
// API - ANÁLISE IRIS CORE
// ============================================================================

app.post('/api/analisar', (req, res) => {
    try {
        const { texto } = req.body;

        if (!texto || texto.trim().length < 10) {
            return res.status(400).json({ erro: 'Texto muito curto' });
        }

        const analise = irisCore.analisarTexto(texto);
        res.json({ sucesso: true, analise });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.post('/api/analisar-pdf/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);

        if (index < 0 || index >= pdfsProcessados.length) {
            return res.status(404).json({ erro: 'PDF não encontrado' });
        }

        const pdf = pdfsProcessados[index];

        if (!pdf.texto) {
            return res.status(400).json({ erro: 'PDF não possui texto extraído' });
        }

        const analise = irisCore.analisarTexto(pdf.texto);

        // Salva análise no PDF
        pdfsProcessados[index].analise = analise;

        res.json({
            sucesso: true,
            nomeArquivo: pdf.nomeArquivo,
            analise
        });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.post('/api/analisar-todos', async (req, res) => {
    try {
        if (pdfsProcessados.length === 0) {
            return res.status(400).json({ erro: 'Nenhum PDF em memória. Execute a coleta primeiro.' });
        }

        const resultados = [];

        for (let i = 0; i < pdfsProcessados.length; i++) {
            const pdf = pdfsProcessados[i];

            if (pdf.texto) {
                const analise = irisCore.analisarTexto(pdf.texto);
                pdfsProcessados[i].analise = analise;

                resultados.push({
                    index: i,
                    nomeArquivo: pdf.nomeArquivo,
                    tipo: analise.tipo,
                    decisao: analise.decisao,
                    microtema: analise.microtema,
                    confianca: analise.confiancaGeral
                });
            }
        }

        res.json({
            sucesso: true,
            totalAnalisados: resultados.length,
            resultados
        });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.get('/api/estatisticas', (req, res) => {
    const analisados = pdfsProcessados.filter(p => p.analise);

    const stats = {
        totalPdfs: pdfsProcessados.length,
        totalAnalisados: analisados.length,
        porTipo: {
            pleitoExterno: analisados.filter(p => p.analise.tipo === 'Pleito Externo').length,
            atoInterno: analisados.filter(p => p.analise.tipo === 'Ato Administrativo Interno').length,
            naoClassificado: analisados.filter(p => p.analise.tipo === 'Não Classificado').length
        },
        porDecisao: {
            deferido: analisados.filter(p => p.analise.decisao === 'Deferido').length,
            indeferido: analisados.filter(p => p.analise.decisao === 'Indeferido').length,
            naoIdentificado: analisados.filter(p => p.analise.decisao === 'Não Identificada').length
        },
        ultimaColeta
    };

    res.json(stats);
});

// ============================================================================
// INTERFACE WEB UNIFICADA
// ============================================================================

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IRIS Platform - Coleta e Análise de Deliberações</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            color: #e4e4e4;
        }

        .header {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #333;
        }

        .header h1 {
            font-size: 1.8em;
            background: linear-gradient(90deg, #00d4ff, #00ff88);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .header .status {
            display: flex;
            gap: 20px;
            font-size: 14px;
        }

        .header .status span {
            background: rgba(255,255,255,0.1);
            padding: 8px 15px;
            border-radius: 20px;
        }

        .container {
            display: grid;
            grid-template-columns: 350px 1fr 400px;
            height: calc(100vh - 80px);
        }

        .sidebar {
            background: rgba(0, 0, 0, 0.2);
            border-right: 1px solid #333;
            display: flex;
            flex-direction: column;
        }

        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid #333;
        }

        .sidebar-header h2 {
            font-size: 1.1em;
            color: #00d4ff;
            margin-bottom: 15px;
        }

        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            width: 100%;
            transition: all 0.3s;
        }

        .btn-primary {
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            color: #000;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 212, 255, 0.4);
        }

        .btn-secondary {
            background: #2a2a4a;
            color: #fff;
            margin-top: 10px;
        }

        .btn-secondary:hover {
            background: #3a3a5a;
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .pdf-list {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }

        .pdf-item {
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.3s;
            border-left: 3px solid transparent;
        }

        .pdf-item:hover {
            background: rgba(255,255,255,0.1);
        }

        .pdf-item.selected {
            border-left-color: #00d4ff;
            background: rgba(0, 212, 255, 0.1);
        }

        .pdf-item.analisado {
            border-left-color: #4ade80;
        }

        .pdf-item .nome {
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 13px;
        }

        .pdf-item .info {
            font-size: 11px;
            color: #888;
        }

        .pdf-item .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 10px;
            margin-top: 8px;
        }

        .badge-deferido { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
        .badge-indeferido { background: rgba(248, 113, 113, 0.2); color: #f87171; }
        .badge-externo { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
        .badge-interno { background: rgba(192, 132, 252, 0.2); color: #c084fc; }

        .main-content {
            padding: 20px;
            overflow-y: auto;
        }

        .content-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .content-header h2 {
            color: #00d4ff;
        }

        .texto-box {
            background: #0d1117;
            border-radius: 10px;
            padding: 20px;
            height: calc(100% - 80px);
            overflow-y: auto;
            font-family: 'Consolas', monospace;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
            border: 1px solid #333;
        }

        .analysis-panel {
            background: rgba(0, 0, 0, 0.2);
            border-left: 1px solid #333;
            padding: 20px;
            overflow-y: auto;
        }

        .analysis-panel h2 {
            color: #00d4ff;
            margin-bottom: 20px;
            font-size: 1.1em;
        }

        .analysis-card {
            background: #0d1117;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 3px solid #00d4ff;
        }

        .analysis-card h3 {
            font-size: 12px;
            color: #888;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .analysis-value {
            font-size: 1.3em;
            font-weight: 600;
        }

        .analysis-value.deferido { color: #4ade80; }
        .analysis-value.indeferido { color: #f87171; }
        .analysis-value.externo { color: #60a5fa; }
        .analysis-value.interno { color: #c084fc; }

        .confidence-bar {
            height: 4px;
            background: #333;
            border-radius: 2px;
            margin-top: 8px;
        }

        .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, #00d4ff, #4ade80);
            border-radius: 2px;
        }

        .justificativa {
            font-size: 11px;
            color: #666;
            margin-top: 5px;
        }

        .votos-section {
            margin-top: 20px;
        }

        .voto-item {
            background: rgba(255,255,255,0.05);
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .voto-item .nome { font-weight: 600; font-size: 13px; }
        .voto-item .cargo { font-size: 11px; color: #888; }
        .voto-item .voto { font-size: 12px; }
        .voto-item .voto.favoravel { color: #4ade80; }
        .voto-item .voto.contrario { color: #f87171; }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }

        .empty-state p { margin-bottom: 20px; }

        .loading {
            text-align: center;
            padding: 40px;
        }

        .loading::after {
            content: '';
            display: inline-block;
            width: 30px;
            height: 30px;
            border: 3px solid #333;
            border-top-color: #00d4ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .stats-bar {
            display: flex;
            gap: 15px;
            padding: 15px;
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
            margin-bottom: 15px;
        }

        .stat-item {
            text-align: center;
            flex: 1;
        }

        .stat-item .value {
            font-size: 1.5em;
            font-weight: 700;
            color: #00d4ff;
        }

        .stat-item .label {
            font-size: 11px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 IRIS Platform</h1>
        <div class="status">
            <span id="statusPdfs">📄 0 PDFs</span>
            <span id="statusAnalisados">✅ 0 Analisados</span>
        </div>
    </div>

    <div class="container">
        <!-- Sidebar - Lista de PDFs -->
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>📥 Coleta de PDFs</h2>
                <button class="btn btn-primary" onclick="coletarPDFs()" id="btnColetar">
                    🚀 Coletar PDFs da ARTESP
                </button>
                <button class="btn btn-secondary" onclick="analisarTodos()" id="btnAnalisarTodos">
                    🔍 Analisar Todos
                </button>
            </div>
            <div class="pdf-list" id="pdfList">
                <div class="empty-state">
                    <p>Nenhum PDF coletado</p>
                    <p style="font-size: 12px">Clique em "Coletar PDFs" para iniciar</p>
                </div>
            </div>
        </div>

        <!-- Conteúdo Principal - Texto do PDF -->
        <div class="main-content">
            <div class="content-header">
                <h2 id="pdfTitle">Selecione um PDF</h2>
                <button class="btn btn-primary" onclick="analisarSelecionado()" id="btnAnalisar" style="width: auto; display: none;">
                    🔍 Analisar Este PDF
                </button>
            </div>
            <div class="texto-box" id="textoBox">
                <div class="empty-state">
                    <p>Selecione um PDF na lista à esquerda para ver o conteúdo</p>
                </div>
            </div>
        </div>

        <!-- Painel de Análise -->
        <div class="analysis-panel">
            <h2>📊 Análise</h2>

            <div id="analysisContent">
                <div class="empty-state">
                    <p>Selecione um PDF e clique em "Analisar" para ver os resultados</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        let pdfs = [];
        let selectedIndex = -1;

        // Carrega PDFs ao iniciar
        carregarPDFs();

        async function carregarPDFs() {
            try {
                const res = await fetch('/api/pdfs');
                const data = await res.json();
                pdfs = data.pdfs || [];
                renderPdfList();
                atualizarStatus();
            } catch (e) {
                console.error('Erro ao carregar PDFs:', e);
            }
        }

        function renderPdfList() {
            const list = document.getElementById('pdfList');

            if (pdfs.length === 0) {
                list.innerHTML = '<div class="empty-state"><p>Nenhum PDF coletado</p></div>';
                return;
            }

            list.innerHTML = pdfs.map((pdf, i) => {
                const classes = ['pdf-item'];
                if (i === selectedIndex) classes.push('selected');
                if (pdf.analisado) classes.push('analisado');

                let badges = '';
                if (pdf.analisado) {
                    // Precisamos buscar a análise para mostrar os badges
                }

                return \`
                    <div class="\${classes.join(' ')}" onclick="selecionarPDF(\${i})">
                        <div class="nome">\${pdf.nomeArquivo}</div>
                        <div class="info">\${pdf.data || ''} • \${pdf.numPaginas || 0} páginas</div>
                        \${pdf.analisado ? '<span class="badge badge-deferido">✓ Analisado</span>' : ''}
                    </div>
                \`;
            }).join('');
        }

        async function selecionarPDF(index) {
            selectedIndex = index;
            renderPdfList();

            const res = await fetch('/api/pdfs/' + index);
            const pdf = await res.json();

            document.getElementById('pdfTitle').textContent = pdf.nomeArquivo;
            document.getElementById('textoBox').textContent = pdf.texto || 'Sem texto extraído';
            document.getElementById('btnAnalisar').style.display = 'block';

            if (pdf.analise) {
                renderAnalise(pdf.analise);
            } else {
                document.getElementById('analysisContent').innerHTML =
                    '<div class="empty-state"><p>Clique em "Analisar Este PDF"</p></div>';
            }
        }

        async function coletarPDFs() {
            const btn = document.getElementById('btnColetar');
            btn.disabled = true;
            btn.textContent = '⏳ Coletando...';

            document.getElementById('pdfList').innerHTML = '<div class="loading"></div>';

            try {
                const res = await fetch('/api/scrape-and-extract', { method: 'POST' });
                const data = await res.json();

                if (data.erro) {
                    alert('Erro: ' + data.erro);
                } else {
                    alert(data.mensagem);
                    await carregarPDFs();
                }
            } catch (e) {
                alert('Erro na coleta: ' + e.message);
            }

            btn.disabled = false;
            btn.textContent = '🚀 Coletar PDFs da ARTESP';
        }

        async function analisarSelecionado() {
            if (selectedIndex < 0) return;

            const btn = document.getElementById('btnAnalisar');
            btn.disabled = true;
            btn.textContent = '⏳ Analisando...';

            try {
                const res = await fetch('/api/analisar-pdf/' + selectedIndex, { method: 'POST' });
                const data = await res.json();

                if (data.analise) {
                    renderAnalise(data.analise);
                    pdfs[selectedIndex].analisado = true;
                    renderPdfList();
                    atualizarStatus();
                }
            } catch (e) {
                alert('Erro: ' + e.message);
            }

            btn.disabled = false;
            btn.textContent = '🔍 Analisar Este PDF';
        }

        async function analisarTodos() {
            if (pdfs.length === 0) {
                alert('Colete os PDFs primeiro!');
                return;
            }

            const btn = document.getElementById('btnAnalisarTodos');
            btn.disabled = true;
            btn.textContent = '⏳ Analisando...';

            try {
                const res = await fetch('/api/analisar-todos', { method: 'POST' });
                const data = await res.json();

                alert(\`\${data.totalAnalisados} PDFs analisados!\`);
                await carregarPDFs();

                if (selectedIndex >= 0) {
                    selecionarPDF(selectedIndex);
                }
            } catch (e) {
                alert('Erro: ' + e.message);
            }

            btn.disabled = false;
            btn.textContent = '🔍 Analisar Todos';
        }

        function renderAnalise(analise) {
            const tipoClass = analise.tipo === 'Pleito Externo' ? 'externo' : 'interno';
            const decisaoClass = analise.decisao === 'Deferido' ? 'deferido' :
                                 analise.decisao === 'Indeferido' ? 'indeferido' : '';

            let html = '';

            // Tipo
            html += \`
                <div class="analysis-card">
                    <h3>Tipo</h3>
                    <div class="analysis-value \${tipoClass}">\${analise.tipo}</div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: \${analise.tipoConfianca}%"></div>
                    </div>
                    <div class="justificativa">\${analise.tipoJustificativa}</div>
                </div>
            \`;

            // Decisão
            html += \`
                <div class="analysis-card">
                    <h3>Decisão</h3>
                    <div class="analysis-value \${decisaoClass}">\${analise.decisao}</div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: \${analise.decisaoConfianca}%"></div>
                    </div>
                    <div class="justificativa">\${analise.decisaoJustificativa}</div>
                </div>
            \`;

            // Microtema
            html += \`
                <div class="analysis-card">
                    <h3>Microtema</h3>
                    <div class="analysis-value">\${analise.microtema}</div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: \${analise.microtemaConfianca}%"></div>
                    </div>
                </div>
            \`;

            // Confiança Geral
            html += \`
                <div class="analysis-card">
                    <h3>Confiança Geral</h3>
                    <div class="analysis-value" style="color: #00d4ff">\${analise.confiancaGeral}%</div>
                </div>
            \`;

            // Votos
            if (analise.votos && analise.votos.length > 0) {
                html += '<div class="votos-section"><h3 style="color: #888; font-size: 12px; margin-bottom: 10px;">VOTOS</h3>';

                for (const voto of analise.votos) {
                    const votoClass = voto.voto === 'Favorável' ? 'favoravel' :
                                     voto.voto === 'Contrário' ? 'contrario' : '';
                    html += \`
                        <div class="voto-item">
                            <div>
                                <div class="nome">\${voto.diretor}</div>
                                <div class="cargo">\${voto.cargo || ''}</div>
                            </div>
                            <div class="voto \${votoClass}">\${voto.voto}</div>
                        </div>
                    \`;
                }

                html += '</div>';
            }

            // Processos
            if (analise.processos && analise.processos.length > 0) {
                html += '<div class="analysis-card"><h3>Processos</h3>';
                html += analise.processos.map(p =>
                    \`<div style="font-family: monospace; font-size: 12px; margin-top: 5px;">\${p}</div>\`
                ).join('');
                html += '</div>';
            }

            document.getElementById('analysisContent').innerHTML = html;
        }

        function atualizarStatus() {
            const analisados = pdfs.filter(p => p.analisado).length;
            document.getElementById('statusPdfs').textContent = '📄 ' + pdfs.length + ' PDFs';
            document.getElementById('statusAnalisados').textContent = '✅ ' + analisados + ' Analisados';
        }
    </script>
</body>
</html>
    `);
});

// Inicia servidor
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║   🔍 IRIS PLATFORM - Plataforma Unificada                   ║');
    console.log('║                                                              ║');
    console.log('║   Coleta de PDFs + Análise de Deliberações                  ║');
    console.log('║                                                              ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║                                                              ║');
    console.log('║   🌐 Acesse: http://localhost:' + PORT + '                          ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
});
