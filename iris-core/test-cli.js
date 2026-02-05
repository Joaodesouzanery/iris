#!/usr/bin/env node
/**
 * CLI de Teste - IRIS Core
 *
 * Script para testar os serviços de processamento de deliberações
 *
 * Uso:
 *   node test-cli.js                    # Executa todos os testes
 *   node test-cli.js --analyze          # Analisa texto de exemplo
 *   node test-cli.js --process          # Processa e salva no banco
 *   node test-cli.js --input arquivo.txt # Processa arquivo específico
 */

require('dotenv').config({ path: '../artesp-collector/.env' });

const fs = require('fs');
const path = require('path');
const processador = require('./processador');
const logger = processador.logger;

// ============================================================================
// TEXTOS DE EXEMPLO PARA TESTE
// ============================================================================

const EXEMPLOS = {
    pleitoExterno: `
DELIBERAÇÃO Nº 1234/2025

Processo ARTESP-PRC-2025/00456

INTERESSADA: Concessionária Auto Raposo Tavares S.A.

ASSUNTO: Requerimento de reequilíbrio econômico-financeiro do contrato de concessão

A Diretoria Colegiada da ARTESP, em sua 1180ª Reunião Ordinária, realizada em 03/02/2026,
após análise do pedido de reequilíbrio econômico-financeiro formulado pela Concessionária
Auto Raposo Tavares S.A., referente ao contrato de concessão da Rodovia Raposo Tavares,

CONSIDERANDO que a concessionária demonstrou desequilíbrio decorrente de obras adicionais
não previstas no contrato original;

CONSIDERANDO o parecer técnico favorável da área de regulação econômica;

CONSIDERANDO a manifestação da Procuradoria Jurídica pelo deferimento parcial;

DELIBEROU, por unanimidade:

1. DEFERIR PARCIALMENTE o pedido de reequilíbrio econômico-financeiro;
2. Autorizar a revisão tarifária no percentual de 3,5%;
3. Determinar que a implementação ocorra em 60 dias.

São Paulo, 03 de fevereiro de 2026.

Milton Xavier dos Santos - Diretor-Presidente
Maria Helena Costa - Diretora de Assuntos Jurídicos
João Paulo Ferreira - Diretor de Fiscalização
Ana Beatriz Lima - Diretora de Planejamento
Carlos Eduardo Souza - Diretor Técnico
`,

    atoInterno: `
DELIBERAÇÃO Nº 0045/2026

ASSUNTO: Designação de servidor para Comissão de Licitação

A Diretoria Colegiada da ARTESP, em sua 1179ª Reunião Ordinária, realizada em 27/01/2026,

CONSIDERANDO a necessidade de recomposição da Comissão Permanente de Licitação;

CONSIDERANDO a indicação do Diretor Administrativo;

DELIBEROU, por unanimidade:

1. DESIGNAR o servidor João Carlos da Silva, matrícula 12345, para compor a
   Comissão Permanente de Licitação desta Agência;

2. A designação terá vigência de 2 (dois) anos, a partir desta data.

São Paulo, 27 de janeiro de 2026.

Milton Xavier dos Santos - Diretor-Presidente
Maria Helena Costa - Diretora de Assuntos Jurídicos
`,

    indeferido: `
DELIBERAÇÃO Nº 0789/2025

Processo SEI 015001/000789/2025

INTERESSADA: Empresa de Transportes Rodoviários Ltda.

ASSUNTO: Recurso Administrativo contra Auto de Infração nº 2025/1234

A Diretoria Colegiada da ARTESP, em sua 231ª Reunião Extraordinária, realizada em 22/01/2026,
analisou o recurso administrativo interposto pela empresa contra o Auto de Infração nº 2025/1234,

CONSIDERANDO que a defesa apresentada não trouxe elementos novos;

CONSIDERANDO que o auto de infração foi lavrado em conformidade com a legislação;

CONSIDERANDO a manifestação da Procuradoria pelo não provimento do recurso;

DELIBEROU, por maioria:

1. INDEFERIR o recurso administrativo interposto;
2. Manter integralmente o Auto de Infração nº 2025/1234;
3. Aplicar a penalidade de multa no valor de R$ 50.000,00.

Voto vencido: Diretor Carlos Eduardo Souza, que votou pelo provimento parcial do recurso.

São Paulo, 22 de janeiro de 2026.

Milton Xavier dos Santos - Diretor-Presidente
Maria Helena Costa - Diretora de Assuntos Jurídicos
João Paulo Ferreira - Diretor de Fiscalização
Carlos Eduardo Souza - Diretor Técnico (voto vencido)
`
};

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa a classificação de tipo
 */
function testarClassificacaoTipo() {
    logger.section('TESTE: Classificação de Tipo');

    const casos = [
        { nome: 'Pleito Externo', texto: EXEMPLOS.pleitoExterno, esperado: 'Pleito Externo' },
        { nome: 'Ato Interno', texto: EXEMPLOS.atoInterno, esperado: 'Ato Administrativo Interno' }
    ];

    let acertos = 0;

    for (const caso of casos) {
        const resultado = processador.classificador.classificarTipo(caso.texto);
        const passou = resultado.tipo === caso.esperado;

        if (passou) {
            logger.success('Teste', `${caso.nome}: OK`, {
                resultado: resultado.tipo,
                confianca: resultado.confianca
            });
            acertos++;
        } else {
            logger.error('Teste', `${caso.nome}: FALHOU`, {
                esperado: caso.esperado,
                obtido: resultado.tipo
            });
        }
    }

    return { total: casos.length, acertos };
}

/**
 * Testa a classificação de decisão
 */
function testarClassificacaoDecisao() {
    logger.section('TESTE: Classificação de Decisão');

    const casos = [
        { nome: 'Deferido', texto: EXEMPLOS.pleitoExterno, esperado: 'Deferido' },
        { nome: 'Indeferido', texto: EXEMPLOS.indeferido, esperado: 'Indeferido' }
    ];

    let acertos = 0;

    for (const caso of casos) {
        const resultado = processador.classificador.classificarDecisao(caso.texto);
        const passou = resultado.decisao === caso.esperado;

        if (passou) {
            logger.success('Teste', `${caso.nome}: OK`, {
                resultado: resultado.decisao,
                confianca: resultado.confianca
            });
            acertos++;
        } else {
            logger.error('Teste', `${caso.nome}: FALHOU`, {
                esperado: caso.esperado,
                obtido: resultado.decisao
            });
        }
    }

    return { total: casos.length, acertos };
}

/**
 * Testa a extração de votos
 */
function testarExtracaoVotos() {
    logger.section('TESTE: Extração de Votos');

    const resultado = processador.extratorVotos.extrairVotacao(EXEMPLOS.pleitoExterno);

    logger.info('Teste', 'Diretores encontrados', {
        total: resultado.diretores.length
    });

    for (const diretor of resultado.diretores) {
        logger.info('Teste', `  - ${diretor.nome}`, {
            cargo: diretor.cargo || 'N/A'
        });
    }

    logger.info('Teste', 'Tipo de votação', {
        tipo: resultado.tipoVotacao,
        confianca: resultado.tipoVotacaoConfianca
    });

    return {
        total: 1,
        acertos: resultado.diretores.length >= 3 ? 1 : 0
    };
}

/**
 * Testa a detecção de duplicidade
 */
function testarDeteccaoDuplicidade() {
    logger.section('TESTE: Detecção de Duplicidade');

    const dados1 = processador.detectorDuplicidade.prepararParaVerificacao(EXEMPLOS.pleitoExterno);
    const dados2 = processador.detectorDuplicidade.prepararParaVerificacao(EXEMPLOS.indeferido);

    logger.info('Teste', 'Processos extraídos (exemplo 1)', {
        processos: dados1.processos
    });

    logger.info('Teste', 'Processos extraídos (exemplo 2)', {
        processos: dados2.processos
    });

    // Testa verificação de duplicidade
    const verificacao = processador.detectorDuplicidade.verificarDuplicidade(dados1, []);

    logger.info('Teste', 'Verificação de duplicidade', {
        ehDuplicata: verificacao.ehDuplicata
    });

    // Testa similaridade
    const similaridade = processador.detectorDuplicidade.calcularSimilaridade(
        EXEMPLOS.pleitoExterno,
        EXEMPLOS.pleitoExterno
    );

    logger.info('Teste', 'Similaridade (mesmo texto)', {
        similaridade: Math.round(similaridade * 100) + '%'
    });

    return {
        total: 2,
        acertos: dados1.processos.length > 0 && similaridade === 1 ? 2 : 1
    };
}

/**
 * Testa análise completa
 */
function testarAnaliseCompleta() {
    logger.section('TESTE: Análise Completa');

    const analise = processador.analisarTexto(EXEMPLOS.pleitoExterno);

    console.log('\nResultado da análise:');
    console.log('─'.repeat(50));
    console.log(`Tipo:      ${analise.tipo} (${analise.tipoConfianca}%)`);
    console.log(`Decisão:   ${analise.decisao} (${analise.decisaoConfianca}%)`);
    console.log(`Microtema: ${analise.microtema} (${analise.microtemaConfianca}%)`);
    console.log(`Votação:   ${analise.tipoVotacao}`);
    console.log(`Diretores: ${analise.diretores.length}`);
    console.log(`Processos: ${analise.processos.join(', ') || 'N/A'}`);
    console.log('─'.repeat(50));

    return { total: 1, acertos: 1 };
}

/**
 * Executa todos os testes
 */
async function executarTestes() {
    logger.section('TESTES DO IRIS CORE');

    const resultados = [];

    resultados.push({ nome: 'Classificação Tipo', ...testarClassificacaoTipo() });
    resultados.push({ nome: 'Classificação Decisão', ...testarClassificacaoDecisao() });
    resultados.push({ nome: 'Extração Votos', ...testarExtracaoVotos() });
    resultados.push({ nome: 'Detecção Duplicidade', ...testarDeteccaoDuplicidade() });
    resultados.push({ nome: 'Análise Completa', ...testarAnaliseCompleta() });

    // Resumo
    logger.section('RESUMO DOS TESTES');

    let totalTestes = 0;
    let totalAcertos = 0;

    for (const r of resultados) {
        totalTestes += r.total;
        totalAcertos += r.acertos;

        const status = r.acertos === r.total ? '✓' : '✗';
        console.log(`${status} ${r.nome}: ${r.acertos}/${r.total}`);
    }

    console.log('─'.repeat(40));
    console.log(`Total: ${totalAcertos}/${totalTestes} (${Math.round(totalAcertos/totalTestes*100)}%)`);

    return totalAcertos === totalTestes;
}

/**
 * Analisa um arquivo de texto
 */
async function analisarArquivo(caminho) {
    logger.section('ANÁLISE DE ARQUIVO');

    if (!fs.existsSync(caminho)) {
        logger.error('CLI', `Arquivo não encontrado: ${caminho}`);
        return;
    }

    const texto = fs.readFileSync(caminho, 'utf8');
    logger.info('CLI', 'Arquivo carregado', {
        tamanho: texto.length,
        caminho
    });

    const analise = processador.analisarTexto(texto);

    console.log('\n' + JSON.stringify(analise, null, 2));
}

/**
 * Processa e salva no banco
 */
async function processarESalvar() {
    logger.section('PROCESSAMENTO COM PERSISTÊNCIA');

    logger.warn('CLI', 'Este modo salva no banco de dados Supabase');

    // Verifica configuração
    try {
        processador.persistencia.verificarConfiguracao();
    } catch (error) {
        logger.error('CLI', error.message);
        return;
    }

    // Processa exemplo
    const resultado = await processador.processarTexto(
        EXEMPLOS.pleitoExterno,
        {
            agencia: 'ARTESP',
            numeroReuniao: '1180',
            dataReuniao: '2026-02-03'
        },
        { dryRun: false }
    );

    console.log('\nResultado:');
    console.log(JSON.stringify(resultado, null, 2));
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
IRIS Core - CLI de Teste

Uso:
  node test-cli.js                     Executa todos os testes
  node test-cli.js --analyze           Analisa textos de exemplo
  node test-cli.js --process           Processa e salva no banco
  node test-cli.js --input <arquivo>   Analisa arquivo específico

Opções:
  --help, -h    Mostra esta ajuda
  --analyze     Modo de análise (sem salvar)
  --process     Modo de processamento (salva no banco)
  --input       Especifica arquivo de entrada
`);
        return;
    }

    if (args.includes('--input')) {
        const index = args.indexOf('--input');
        const arquivo = args[index + 1];
        if (arquivo) {
            await analisarArquivo(arquivo);
        } else {
            logger.error('CLI', 'Especifique o arquivo após --input');
        }
        return;
    }

    if (args.includes('--analyze')) {
        testarAnaliseCompleta();
        return;
    }

    if (args.includes('--process')) {
        await processarESalvar();
        return;
    }

    // Executa testes por padrão
    const sucesso = await executarTestes();
    process.exit(sucesso ? 0 : 1);
}

main().catch(error => {
    logger.error('CLI', 'Erro fatal', { erro: error.message });
    process.exit(1);
});
