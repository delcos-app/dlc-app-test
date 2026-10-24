// servicios/vocabulario.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function TT(k, n, det, cd, cn, adj) {
  const d = terminoDe(k), nom = casoTermino(n === 'p' ? d.p : d.s, cn);
  // Adjetivo que acompaña al nombre (se escribe en masculino singular): concuerda en género y número
  const ad = adj ? ' ' + (d.g === 'f' ? adj.replace(/o$/, 'a') : adj) + (n === 'p' ? 's' : '') : '';
  if (!det || !TERM_DET[det]) return nom + ad;
  return casoTermino(TERM_DET[det][(d.g === 'f' ? 2 : 0) + (n === 'p' ? 1 : 0)], cd) + ' ' + nom + ad;
}

function etiquetaCanal(p, total) { return sinCargoP(p, total) ? 'Entrega sin cargo' : p.canal === 'centro' ? 'Venta a centro' : `Venta ${TT('paciente', 's', 'al', 'l', 'l')}`; }

/* v2.71.0 · Diccionario de términos. Los textos no escriben «médico», «paciente» ni «visita»: los piden a TT(),
   que los saca del vocabulario de cada cliente (ajuste «terminos») con su plural, su género y el artículo que concuerda.
   TT(término, 's'|'p', determinante, mayúsculas del determinante, mayúsculas del nombre[, adjetivo en masculino singular]) · 'l' minúscula, 'C' inicial, 'U' todo. */
// v2.224.0: palabras de partida genéricas (antes «médico» y «paciente»: DLC las tiene como vocabulario propio desde el SQL 133)
const TERM_DEF = { medico: { s: 'profesional', p: 'profesionales', g: 'm' }, paciente: { s: 'cliente', p: 'clientes', g: 'm' }, visita: { s: 'visita', p: 'visitas', g: 'f' }, pauta: { s: 'solicitud', p: 'solicitudes', g: 'f' },
  consulta: { s: 'ubicación', p: 'ubicaciones', g: 'f' }, especialidad: { s: 'segmento', p: 'segmentos', g: 'm' } };   // v2.347.0

const TERM_DET = { el: ['el', 'los', 'la', 'las'], un: ['un', 'unos', 'una', 'unas'], del: ['del', 'de los', 'de la', 'de las'], al: ['al', 'a los', 'a la', 'a las'],
  este: ['este', 'estos', 'esta', 'estas'], ningun: ['ningún', 'ningunos', 'ninguna', 'ningunas'], otro: ['otro', 'otros', 'otra', 'otras'],
  nuevo: ['nuevo', 'nuevos', 'nueva', 'nuevas'], primer: ['primer', 'primeros', 'primera', 'primeras'], ultimo: ['último', 'últimos', 'última', 'últimas'],
  proximo: ['próximo', 'próximos', 'próxima', 'próximas'] };

const TERMKEY = 'dlc-terminos';

let TERMINOS = {};

const terminoDe = k => { const d = TERM_DEF[k] || { s: k, p: k + 's', g: 'm' }, t = TERMINOS[k] || {};
  return { s: String(t.s || '').trim() || d.s, p: String(t.p || '').trim() || d.p, g: t.g === 'f' || t.g === 'm' ? t.g : d.g }; };

const casoTermino = (t, c) => c === 'U' ? t.toUpperCase() : c === 'C' ? t.charAt(0).toUpperCase() + t.slice(1) : t;

// v2.347.0: «Todos los segmentos» / «Todas las especialidades»
const todosLos = k => (terminoDe(k).g === 'f' ? 'Todas ' : 'Todos ') + TT(k, 'p', 'el', 'l', 'l');

// Nombre sin tratamiento delante («Dr. Gonzalo Serrano» → Gonzalo, iniciales GS)
const TRATAMIENTO = /^(dr|dra|d|dña|dª|sr|sra|srta|prof|profa|lic|ldo|lda)\.?$/i;

// v2.105.0: sin etiqueta propia, el nombre sale del vocabulario de la empresa («Farmacias», «Contactos»…); con el vocabulario por defecto, «Prescriptores»
const etiquetaContactos = () => ((AJUSTES.marca || {}).etiqueta || TT('medico', 'p', '', 'l', 'C'));
