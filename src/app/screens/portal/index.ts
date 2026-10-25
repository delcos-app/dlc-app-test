/**
 * Portal del profesional y del centro (v2.413.0): «Mi informe» (Resumen, Mi ficha, Material y dudas), the centre portal (Resumen,
 * Pedir reposición, Mi centro, Material y dudas) and its settings in Configuración. The legacy names cargarInforme, portalMedico,
 * centroPintar, pmTab, pmRepintarConsultas and pintarCfgPortal stay as adapters, and PM reads `portalState` (the screen table of
 * legado 001, live updates, Configuración and the tests use them).
 */
export { paintCentre } from './centre';
export { listenToCentreDocs } from './centre-docs';
export { listenToForm, repaintPlaces } from './form';
export { paintMaterial } from './material';
export { failureText, messageThread, portalState } from './model';
export { loadReport } from './report';
export { paintPortalSettings } from './settings';
export { formatText } from './summary';
export { showTab } from './tabs';
