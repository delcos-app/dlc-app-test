/**
 * The help popovers («i») of screens and Inicio indicators (legado 017–024, v2.424.0): the legacy AYUDA and AYUDA_KPI, built once
 * with the company's words at legado 017's place in the load order. They are the final state after the patches of legado 018–024
 * (now in i18n/es/legacy-a-help.ts); the later legado files still add their own entries to the same objects.
 */
import { term } from '../../legacy/bridge';
import { helpLegacy } from '../../legacy/legado-a-bridge';
import { t, type MessageKey } from '../../i18n';
import { orFallback } from '../../services/values';

export type HelpEntry = [string, string, string[]];

/** Legacy key → i18n key, in the order of the legacy object. */
const SCREENS = new Map<string, string>([
  ['inicio', 'inicio'],
  ['ini_agenda', 'iniAgenda'],
  ['ini_acciones', 'iniAcciones'],
  ['ini_urgentes', 'iniUrgentes'],
  ['ini_ultimas', 'iniUltimas'],
  ['ini_recom', 'iniRecom'],
  ['ini_pend', 'iniPend'],
  ['ini_comision', 'iniComision'],
  ['agenda', 'agenda'],
  ['rutas', 'rutas'],
  ['directorio', 'directorio'],
  ['seguimiento', 'seguimiento'],
  ['ventas', 'ventas'],
  ['analitica', 'analitica'],
  ['config', 'config'],
  ['admin', 'admin'],
  ['duplicados', 'duplicados'],
  ['pacientes', 'pacientes'],
  ['productos', 'productos'],
  ['pruebas', 'pruebas'],
]);
const INDICATORS = new Map<string, string>([
  ['citas', 'citas'],
  ['urgentes', 'urgentes'],
  ['visitas_sem', 'visitasSem'],
  ['visitas_mes', 'visitasMes'],
  ['interesados', 'interesados'],
  ['sin_contactar', 'sinContactar'],
  ['cartera', 'cartera'],
  ['dups', 'dups'],
  ['filtro', 'filtro'],
]);

/** The company's words the help texts use. */
function words(): Record<string, string> {
  return {
    professionalsMarkedCap: term('medico', { number: 'p', capital: 'C', adjective: 'marcado' }),
    noVisit: term('visita', { article: 'ningun' }),
    visitsRecordedCap: term('visita', { number: 'p', capital: 'C', adjective: 'registrado' }),
    professionalsCap: term('medico', { number: 'p', capital: 'C' }),
    interestState: orFallback(helpLegacy.stateFor('interes'), 'interés'),
    firstPrescription: term('pauta', { article: 'primer' }),
    theProfessionals: term('medico', { number: 'p', article: 'el' }),
    professionals: term('medico', { number: 'p' }),
    aProfessional: term('medico', { article: 'un' }),
    theVisit: term('visita', { article: 'el' }),
    lastVisit: term('visita', { article: 'ultimo' }),
    professional: term('medico'),
    lastVisitsCap: term('visita', { number: 'p', article: 'ultimo', articleCapital: 'C' }),
    theVisitsRecordedCap: term('visita', { number: 'p', article: 'el', articleCapital: 'C', adjective: 'registrado' }),
    professionalsInterestedCap: term('medico', { number: 'p', capital: 'C', adjective: 'interesado' }),
    visit: term('visita'),
    ofTheProfessional: term('medico', { article: 'del' }),
    allConsultations: helpLegacy.allOf('consulta').toLowerCase(),
    patient: term('paciente'),
    toTheProfessionalIndicated: term('medico', { article: 'al', adjective: 'indicado' }),
    visits: term('visita', { number: 'p' }),
    consultationsCap: term('consulta', { number: 'p', capital: 'C' }),
    patientsCap: term('paciente', { number: 'p', capital: 'C' }),
    theProfessional: term('medico', { article: 'el' }),
  };
}

/** AYUDA: [title, text, items] of each screen or card. */
export function screenHelp(): Record<string, HelpEntry> {
  const params = words(), help: Record<string, HelpEntry> = {};
  for (const [legacyKey, key] of SCREENS) {
    const text = (part: string): string => t(`legacyAHelp.screens.${key}.${part}` as MessageKey, params);
    const items = text('items');
    help[legacyKey] = [text('title'), text('text'), items ? items.split('\n') : []];
  }
  return help;
}

/** AYUDA_KPI: the explanation of each Inicio indicator. */
export function indicatorHelp(): Record<string, string> {
  const params = words(), help: Record<string, string> = {};
  for (const [legacyKey, key] of INDICATORS) help[legacyKey] = t(`legacyAHelp.indicators.${key}` as MessageKey, params);
  return help;
}
