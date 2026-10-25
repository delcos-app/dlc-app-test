/**
 * Ciclo de visitas A/B/C (v2.408.0): «Este ciclo», «Por producto», «Clasificar», «Equipo», the settings window and the block in
 * the account card. The legacy names pintarCiclo, pintarCobertura, pintarClasificar, pintarCicloEquipo, editorCiclo and cicFicha
 * stay as adapters (the page tabs of legado 079, Configuración and the account card use them).
 */
export { paintClassify, listenToClassButtons } from './classify';
export { paintCoverage } from './coverage';
export { paintCycle } from './current';
export { paintCardCycle } from './card';
export { editCycle } from './settings';
export { paintCycleTeam } from './team';
