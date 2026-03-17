/**
 * IRIS Core - Serviços Centrais de Processamento de Deliberações
 *
 * Exporta todos os serviços para uso externo
 */

const processador = require('./processador');

// Re-exporta tudo do processador
module.exports = {
    // Funções principais
    processarDeliberacao: processador.processarDeliberacao,
    processarLote: processador.processarLote,
    processarTexto: processador.processarTexto,
    analisarTexto: processador.analisarTexto,
    extrairDeliberacoesEstruturadas: processador.extrairDeliberacoesEstruturadas,

    // Serviços individuais
    classificador: processador.classificador,
    extratorVotos: processador.extratorVotos,
    detectorDuplicidade: processador.detectorDuplicidade,
    persistencia: processador.persistencia,
    logger: processador.logger
};
