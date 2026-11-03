/**
 * Configuración, second part (v2.415.0): portfolio rules, backups, undoing changes, commercial states, visit material, accesses
 * and last connections, the audit log in words, classifiers, roles and brand. The legacy names (editorReglasCartera, pintarCopias,
 * deshacerUno, cajaDeshacerPersona, pintarEstadosPapel, matMejorar, conexionTxt, pintarAccesos, facccon, textoValor,
 * resumenDetalle, abrirClasificador, pintarRoles and pintarMarca) stay as adapters: the rest of
 * Configuración, the page tabs, the bridges and the tests call them.
 */
export { connectionText, fillConnection, paintAccesses } from './access-log';
export { detailSummary, valueText } from './audit-text';
export { paintBackups } from './backups';
export { paintBrand } from './brand';
export { openClassifier } from './classifier-window';
export { paintCommercialStates } from './commercial-states';
export { editPortfolioRules } from './portfolio-rules';
export { paintRoles } from './roles';
export { paintPersonUndo, undoChange } from './undo';
export { improveMaterial } from './visit-material';
