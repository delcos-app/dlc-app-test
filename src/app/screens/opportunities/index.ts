/**
 * Oportunidades (v2.410.0): the Ventas tab (call backs, indicators, charts and list), the opportunity window and the «Registro de
 * llamada» of the new client window. The legacy names pintarLlamadas, editorOportunidad and llamadaAltaHTML/Activar/Leer/Guardar
 * stay as adapters (Pedidos, Clientes and the tests use them); hayOportunidades and LLAMADA_PEND stay in legacy.
 */
export { activateCallRecord, callRecordHtml, readCallRecord, saveCallRecord } from './call-record';
export { editOpportunity, registerFollowUp } from './editor';
/** v2.464.0 (PED-5): the call values by their role in the lists. */
export { followUpReason, isOrderDone, orderDoneResult, orderDoneResults, ourCallOrigin } from './model';
export { paintOpportunities } from './list';
