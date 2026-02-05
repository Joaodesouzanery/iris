/**
 * Servidor Web - IRIS Core
 *
 * Interface visual para testar os serviços de processamento
 *
 * Acesse: http://localhost:3001
 */

require('dotenv').config({ path: '../artesp-collector/.env' });

const express = require('express');
const path = require('path');
const processador = require('./processador');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// ROTAS DA API
// ============================================================================

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'IRIS Core',
        timestamp: new Date().toISOString()
    });
});

/**
 * Analisa texto (sem salvar no banco)
 */
app.post('/api/analisar', async (req, res) => {
    try {
        const { texto } = req.body;

        if (!texto || texto.trim().length < 10) {
            return res.status(400).json({
                erro: 'Texto muito curto ou vazio'
            });
        }

        const analise = processador.analisarTexto(texto);

        res.json({
            sucesso: true,
            analise
        });

    } catch (error) {
        res.status(500).json({
            erro: error.message
        });
    }
});

/**
 * Classifica tipo
 */
app.post('/api/classificar/tipo', (req, res) => {
    try {
        const { texto } = req.body;
        const resultado = processador.classificador.classificarTipo(texto);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * Classifica decisão
 */
app.post('/api/classificar/decisao', (req, res) => {
    try {
        const { texto } = req.body;
        const resultado = processador.classificador.classificarDecisao(texto);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * Infere microtema
 */
app.post('/api/classificar/microtema', (req, res) => {
    try {
        const { texto } = req.body;
        const resultado = processador.classificador.inferirMicrotema(texto);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * Extrai votos
 */
app.post('/api/votos', (req, res) => {
    try {
        const { texto } = req.body;
        const resultado = processador.extratorVotos.extrairVotacao(texto);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * Verifica duplicidade
 */
app.post('/api/duplicidade', (req, res) => {
    try {
        const { texto } = req.body;
        const dados = processador.detectorDuplicidade.prepararParaVerificacao(texto);
        res.json({
            processos: dados.processos,
            numeroDeliberacao: dados.numeroDeliberacao,
            hashTexto: dados.hashTexto
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * Processa e salva no banco
 */
app.post('/api/processar', async (req, res) => {
    try {
        const { texto, metadata, dryRun } = req.body;

        if (!texto || texto.trim().length < 50) {
            return res.status(400).json({
                erro: 'Texto muito curto (mínimo 50 caracteres)'
            });
        }

        const resultado = await processador.processarTexto(
            texto,
            metadata || {},
            { dryRun: dryRun !== false }
        );

        res.json(resultado);

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * Retorna textos de exemplo
 */
app.get('/api/exemplos', (req, res) => {
    res.json({
        pleitoExterno: `DELIBERAÇÃO Nº 1234/2025

Processo ARTESP-PRC-2025/00456

INTERESSADA: Concessionária Auto Raposo Tavares S.A.

ASSUNTO: Requerimento de reequilíbrio econômico-financeiro do contrato de concessão

A Diretoria Colegiada da ARTESP, em sua 1180ª Reunião Ordinária, realizada em 03/02/2026,
após análise do pedido de reequilíbrio econômico-financeiro formulado pela Concessionária
Auto Raposo Tavares S.A., referente ao contrato de concessão da Rodovia Raposo Tavares,

CONSIDERANDO que a concessionária demonstrou desequilíbrio decorrente de obras adicionais
não previstas no contrato original;

CONSIDERANDO o parecer técnico favorável da área de regulação econômica;

DELIBEROU, por unanimidade:

1. DEFERIR PARCIALMENTE o pedido de reequilíbrio econômico-financeiro;
2. Autorizar a revisão tarifária no percentual de 3,5%;
3. Determinar que a implementação ocorra em 60 dias.

São Paulo, 03 de fevereiro de 2026.

Milton Xavier dos Santos - Diretor-Presidente
Maria Helena Costa - Diretora de Assuntos Jurídicos
João Paulo Ferreira - Diretor de Fiscalização`,

        atoInterno: `DELIBERAÇÃO Nº 0045/2026

ASSUNTO: Designação de servidor para Comissão de Licitação

A Diretoria Colegiada da ARTESP, em sua 1179ª Reunião Ordinária, realizada em 27/01/2026,

CONSIDERANDO a necessidade de recomposição da Comissão Permanente de Licitação;

DELIBEROU, por unanimidade:

1. DESIGNAR o servidor João Carlos da Silva, matrícula 12345, para compor a
   Comissão Permanente de Licitação desta Agência;

2. A designação terá vigência de 2 (dois) anos, a partir desta data.

São Paulo, 27 de janeiro de 2026.

Milton Xavier dos Santos - Diretor-Presidente
Maria Helena Costa - Diretora de Assuntos Jurídicos`,

        indeferido: `DELIBERAÇÃO Nº 0789/2025

Processo SEI 015001/000789/2025

INTERESSADA: Empresa de Transportes Rodoviários Ltda.

ASSUNTO: Recurso Administrativo contra Auto de Infração nº 2025/1234

A Diretoria Colegiada da ARTESP, em sua 231ª Reunião Extraordinária, realizada em 22/01/2026,
analisou o recurso administrativo interposto pela empresa contra o Auto de Infração,

CONSIDERANDO que a defesa apresentada não trouxe elementos novos;

CONSIDERANDO a manifestação da Procuradoria pelo não provimento do recurso;

DELIBEROU, por maioria:

1. INDEFERIR o recurso administrativo interposto;
2. Manter integralmente o Auto de Infração nº 2025/1234;
3. Aplicar a penalidade de multa no valor de R$ 50.000,00.

Voto vencido: Diretor Carlos Eduardo Souza, que votou pelo provimento parcial.

São Paulo, 22 de janeiro de 2026.

Milton Xavier dos Santos - Diretor-Presidente
Maria Helena Costa - Diretora de Assuntos Jurídicos
Carlos Eduardo Souza - Diretor Técnico (voto vencido)`
    });
});

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IRIS Core - Processador de Deliberações</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            color: #e4e4e4;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            text-align: center;
            padding: 30px 0;
            border-bottom: 1px solid #333;
            margin-bottom: 30px;
        }

        header h1 {
            font-size: 2.5em;
            color: #00d4ff;
            margin-bottom: 10px;
        }

        header p {
            color: #888;
            font-size: 1.1em;
        }

        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }

        .panel {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid #333;
        }

        .panel h2 {
            color: #00d4ff;
            margin-bottom: 20px;
            font-size: 1.3em;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .panel h2::before {
            content: '';
            width: 4px;
            height: 24px;
            background: #00d4ff;
            border-radius: 2px;
        }

        textarea {
            width: 100%;
            height: 300px;
            background: #0d1117;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 15px;
            color: #e4e4e4;
            font-family: 'Consolas', monospace;
            font-size: 13px;
            resize: vertical;
        }

        textarea:focus {
            outline: none;
            border-color: #00d4ff;
        }

        .btn-group {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }

        button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
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
            background: #333;
            color: #fff;
        }

        .btn-secondary:hover {
            background: #444;
        }

        .btn-example {
            background: #1e3a5f;
            color: #fff;
            font-size: 12px;
            padding: 8px 16px;
        }

        .btn-example:hover {
            background: #2a4a6f;
        }

        .results {
            margin-top: 20px;
        }

        .result-card {
            background: #0d1117;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid #00d4ff;
        }

        .result-card h3 {
            color: #00d4ff;
            margin-bottom: 15px;
            font-size: 1.1em;
        }

        .result-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #222;
        }

        .result-item:last-child {
            border-bottom: none;
        }

        .result-label {
            color: #888;
        }

        .result-value {
            font-weight: 600;
        }

        .result-value.deferido {
            color: #4ade80;
        }

        .result-value.indeferido {
            color: #f87171;
        }

        .result-value.externo {
            color: #60a5fa;
        }

        .result-value.interno {
            color: #c084fc;
        }

        .confidence-bar {
            height: 6px;
            background: #333;
            border-radius: 3px;
            margin-top: 5px;
            overflow: hidden;
        }

        .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, #00d4ff, #4ade80);
            border-radius: 3px;
            transition: width 0.5s;
        }

        .votos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }

        .voto-card {
            background: #1a1a2e;
            padding: 12px;
            border-radius: 8px;
            border-left: 3px solid #4ade80;
        }

        .voto-card.contrario {
            border-left-color: #f87171;
        }

        .voto-card .nome {
            font-weight: 600;
            margin-bottom: 5px;
        }

        .voto-card .cargo {
            font-size: 12px;
            color: #888;
        }

        .voto-card .voto {
            font-size: 12px;
            margin-top: 5px;
            color: #4ade80;
        }

        .voto-card.contrario .voto {
            color: #f87171;
        }

        .processos-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }

        .processo-tag {
            background: #1e3a5f;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-family: monospace;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #888;
        }

        .loading::after {
            content: '';
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #333;
            border-top-color: #00d4ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-left: 10px;
            vertical-align: middle;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .error {
            background: rgba(248, 113, 113, 0.1);
            border: 1px solid #f87171;
            border-radius: 10px;
            padding: 15px;
            color: #f87171;
        }

        @media (max-width: 900px) {
            .main-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔍 IRIS Core</h1>
            <p>Processador Inteligente de Deliberações Regulatórias</p>
        </header>

        <div class="main-grid">
            <!-- Painel de Entrada -->
            <div class="panel">
                <h2>Texto da Deliberação</h2>

                <div class="btn-group" style="margin-bottom: 15px;">
                    <button class="btn-example" onclick="carregarExemplo('pleitoExterno')">
                        📄 Exemplo: Pleito Externo
                    </button>
                    <button class="btn-example" onclick="carregarExemplo('atoInterno')">
                        📋 Exemplo: Ato Interno
                    </button>
                    <button class="btn-example" onclick="carregarExemplo('indeferido')">
                        ❌ Exemplo: Indeferido
                    </button>
                </div>

                <textarea id="texto" placeholder="Cole aqui o texto da deliberação para análise..."></textarea>

                <div class="btn-group">
                    <button class="btn-primary" onclick="analisar()">
                        🚀 Analisar Texto
                    </button>
                    <button class="btn-secondary" onclick="limpar()">
                        🗑️ Limpar
                    </button>
                </div>
            </div>

            <!-- Painel de Resultados -->
            <div class="panel">
                <h2>Resultado da Análise</h2>

                <div id="resultados">
                    <p style="color: #666; text-align: center; padding: 50px;">
                        Cole um texto e clique em "Analisar" para ver os resultados
                    </p>
                </div>
            </div>
        </div>
    </div>

    <script>
        let exemplos = {};

        // Carrega exemplos ao iniciar
        fetch('/api/exemplos')
            .then(r => r.json())
            .then(data => exemplos = data);

        function carregarExemplo(tipo) {
            document.getElementById('texto').value = exemplos[tipo] || '';
        }

        function limpar() {
            document.getElementById('texto').value = '';
            document.getElementById('resultados').innerHTML =
                '<p style="color: #666; text-align: center; padding: 50px;">Cole um texto e clique em "Analisar" para ver os resultados</p>';
        }

        async function analisar() {
            const texto = document.getElementById('texto').value;
            const resultados = document.getElementById('resultados');

            if (!texto || texto.trim().length < 10) {
                resultados.innerHTML = '<div class="error">Por favor, insira um texto válido</div>';
                return;
            }

            resultados.innerHTML = '<div class="loading">Analisando</div>';

            try {
                const response = await fetch('/api/analisar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ texto })
                });

                const data = await response.json();

                if (data.erro) {
                    resultados.innerHTML = '<div class="error">' + data.erro + '</div>';
                    return;
                }

                renderResultados(data.analise);

            } catch (error) {
                resultados.innerHTML = '<div class="error">Erro ao analisar: ' + error.message + '</div>';
            }
        }

        function renderResultados(analise) {
            const tipoClass = analise.tipo === 'Pleito Externo' ? 'externo' : 'interno';
            const decisaoClass = analise.decisao === 'Deferido' ? 'deferido' :
                                 analise.decisao === 'Indeferido' ? 'indeferido' : '';

            let html = '';

            // Card de Classificação
            html += '<div class="result-card">';
            html += '<h3>📊 Classificação</h3>';

            html += '<div class="result-item">';
            html += '<span class="result-label">Tipo</span>';
            html += '<span class="result-value ' + tipoClass + '">' + analise.tipo + '</span>';
            html += '</div>';
            html += '<div class="confidence-bar"><div class="confidence-fill" style="width: ' + analise.tipoConfianca + '%"></div></div>';
            html += '<small style="color: #666">' + analise.tipoJustificativa + '</small>';

            html += '<div class="result-item" style="margin-top: 15px">';
            html += '<span class="result-label">Decisão</span>';
            html += '<span class="result-value ' + decisaoClass + '">' + analise.decisao + '</span>';
            html += '</div>';
            html += '<div class="confidence-bar"><div class="confidence-fill" style="width: ' + analise.decisaoConfianca + '%"></div></div>';
            html += '<small style="color: #666">' + analise.decisaoJustificativa + '</small>';

            html += '<div class="result-item" style="margin-top: 15px">';
            html += '<span class="result-label">Microtema</span>';
            html += '<span class="result-value">' + analise.microtema + '</span>';
            html += '</div>';
            html += '<div class="confidence-bar"><div class="confidence-fill" style="width: ' + analise.microtemaConfianca + '%"></div></div>';

            html += '<div class="result-item" style="margin-top: 15px">';
            html += '<span class="result-label">Confiança Geral</span>';
            html += '<span class="result-value" style="color: #00d4ff">' + analise.confiancaGeral + '%</span>';
            html += '</div>';

            html += '</div>';

            // Card de Votação
            html += '<div class="result-card">';
            html += '<h3>🗳️ Votação</h3>';

            html += '<div class="result-item">';
            html += '<span class="result-label">Tipo de Votação</span>';
            html += '<span class="result-value">' + analise.tipoVotacao + '</span>';
            html += '</div>';

            if (analise.votos && analise.votos.length > 0) {
                html += '<div class="votos-grid">';
                for (const voto of analise.votos) {
                    const votoClass = voto.voto === 'Contrário' ? 'contrario' : '';
                    html += '<div class="voto-card ' + votoClass + '">';
                    html += '<div class="nome">' + voto.diretor + '</div>';
                    if (voto.cargo) {
                        html += '<div class="cargo">' + voto.cargo + '</div>';
                    }
                    html += '<div class="voto">' + voto.voto + '</div>';
                    html += '</div>';
                }
                html += '</div>';
            } else {
                html += '<p style="color: #666; margin-top: 10px">Nenhum voto individual identificado</p>';
            }

            html += '</div>';

            // Card de Identificadores
            html += '<div class="result-card">';
            html += '<h3>🔢 Identificadores</h3>';

            if (analise.processos && analise.processos.length > 0) {
                html += '<div class="result-label">Processos encontrados:</div>';
                html += '<div class="processos-list">';
                for (const proc of analise.processos) {
                    html += '<span class="processo-tag">' + proc + '</span>';
                }
                html += '</div>';
            } else {
                html += '<p style="color: #666">Nenhum número de processo identificado</p>';
            }

            if (analise.numeroDeliberacao) {
                html += '<div class="result-item" style="margin-top: 15px">';
                html += '<span class="result-label">Nº Deliberação</span>';
                html += '<span class="result-value">' + analise.numeroDeliberacao + '</span>';
                html += '</div>';
            }

            html += '</div>';

            document.getElementById('resultados').innerHTML = html;
        }
    </script>
</body>
</html>
    `);
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   IRIS Core - Servidor Web Iniciado');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`   🌐 Interface: http://localhost:${PORT}`);
    console.log(`   📡 API:       http://localhost:${PORT}/api`);
    console.log('');
    console.log('   Endpoints disponíveis:');
    console.log('   - POST /api/analisar      Análise completa');
    console.log('   - POST /api/classificar/* Classificação');
    console.log('   - POST /api/votos         Extração de votos');
    console.log('   - GET  /api/exemplos      Textos de exemplo');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
});

module.exports = app;
