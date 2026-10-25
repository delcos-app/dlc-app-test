/**
 * The account editor (v2.419.0): the form, the consultations with their centre and days, the centre and private consultation
 * forms, the salesperson and the centre account. The legacy names abrirEditor, consHTML, dpLeer, pintarCentroSel, cpPoner,
 * listaCentros, centroDesdeUbicacion, marcarUbicado, consultaPrivada and esConsultaPrivada stay as adapters.
 */
export { openEditor } from './editor';
export { centreFromLocation, centreList, markLocated, paintCentrePicker, setCentre } from './centre-picker';
export { consultationHtml } from './consultation';
export { listenToDayPickers, readDays } from './day-picker';
export { hoursText, isPrivateConsultation, newAccountNames, privateConsultation } from './model';
