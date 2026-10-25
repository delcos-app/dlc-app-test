/**
 * The company's words the content catalogs use, resolved when a catalog is built (at its place in the load order, like the legacy TT()).
 * Generated with the catalogs (v2.427.0).
 */
import { term } from '../legacy/bridge';
import { contentLegacy } from '../legacy/content-bridge';
import { orFallback } from '../services/values';

export function contentWords(): Record<string, string> {
  return {
    allConsultations: contentLegacy.allOf('consulta').toLowerCase(),
    aPatient: term('paciente', { article: 'un' }),
    aProfessional: term('medico', { article: 'un' }),
    aProfessionalCap: term('medico', { article: 'un', capital: 'C' }),
    aProfessionalDetCap: term('medico', { article: 'un', articleCapital: 'C' }),
    aVisit: term('visita', { article: 'un' }),
    consultationsCap: term('consulta', { number: 'p', capital: 'C' }),
    firstGuideline: term('pauta', { article: 'primer' }),
    firstVisit: term('visita', { article: 'primer' }),
    guideline: term('pauta'),
    lastVisit: term('visita', { article: 'ultimo' }),
    lastVisitsDetCap: term('visita', { number: 'p', article: 'ultimo', articleCapital: 'C' }),
    noVisit: term('visita', { article: 'ningun' }),
    ofTheProfessional: term('medico', { article: 'del' }),
    ofTheProfessionalsDetCap: term('medico', { number: 'p', article: 'del', articleCapital: 'C' }),
    patient: term('paciente'),
    patients: term('paciente', { number: 'p' }),
    patientsCap: term('paciente', { number: 'p', capital: 'C' }),
    patientsCapNuevo: term('paciente', { number: 'p', capital: 'C', adjective: 'nuevo' }),
    professional: term('medico'),
    professionals: term('medico', { number: 'p' }),
    professionalsCap: term('medico', { number: 'p', capital: 'C' }),
    professionalsCapDistinto: term('medico', { number: 'p', capital: 'C', adjective: 'distinto' }),
    professionalsCapInteresado: term('medico', { number: 'p', capital: 'C', adjective: 'interesado' }),
    professionalsCapMarcado: term('medico', { number: 'p', capital: 'C', adjective: 'marcado' }),
    professionalsInteresado: term('medico', { number: 'p', adjective: 'interesado' }),
    professionalsNuevo: term('medico', { number: 'p', adjective: 'nuevo' }),
    speciality: term('especialidad'),
    stateInteres: orFallback(contentLegacy.stateOf('interes'), 'interés'),
    statePositivo: orFallback(contentLegacy.stateOf('positivo'), 'positivo'),
    theProfessionalDetCap: term('medico', { article: 'el', articleCapital: 'C' }),
    theProfessionals: term('medico', { number: 'p', article: 'el' }),
    theProfessionalsDetCap: term('medico', { number: 'p', article: 'el', articleCapital: 'C' }),
    theProfessionalsNuevo: term('medico', { number: 'p', article: 'el', adjective: 'nuevo' }),
    theVisit: term('visita', { article: 'el' }),
    theVisits: term('visita', { number: 'p', article: 'el' }),
    theVisitsDetCapRegistrado: term('visita', { number: 'p', article: 'el', articleCapital: 'C', adjective: 'registrado' }),
    toTheProfessionalIndicado: term('medico', { article: 'al', adjective: 'indicado' }),
    visit: term('visita'),
    visits: term('visita', { number: 'p' }),
    visitsCap: term('visita', { number: 'p', capital: 'C' }),
    visitsCapRegistrado: term('visita', { number: 'p', capital: 'C', adjective: 'registrado' }),
  };
}
