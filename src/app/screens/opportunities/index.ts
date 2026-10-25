/**
 * Oportunidades (v2.410.0): the Ventas tab (call backs, indicators, charts and list), the opportunity window and the «Registro de
 * llamada» of the new client window. The legacy names pintarLlamadas, editorOportunidad and llamadaAltaHTML/Activar/Leer/Guardar
 * stay as adapters (Pedidos, Clientes and the tests use them); hayOportunidades and LLAMADA_PEND stay in legacy.
 */
export { activateCallRecord, callRecordHtml, readCallRecord, saveCallRecord } from './call-record';
export { editOpportunity } from './editor';
export { paintOpportunities } from './list';
