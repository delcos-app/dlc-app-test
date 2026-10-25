// @ts-check
// servicios/vocabulario.js · está en src/app/core/vocabulary.ts (v2.425.0). Las palabras de la empresa (TERMINOS, que carga el arranque y
// cambian las pruebas) se quedan aquí, y estos nombres también. Normas: docs/normas_codigo.md.

/* v2.71.0 · Diccionario de términos. Los textos no escriben «médico», «paciente» ni «visita»: los piden a TT(),
   que los saca del vocabulario de cada cliente (ajuste «terminos») con su plural, su género y el artículo que concuerda.
   TT(término, 's'|'p', determinante, mayúsculas del determinante, mayúsculas del nombre[, adjetivo en masculino singular]) · 'l' minúscula, 'C' inicial, 'U' todo. */
function TT(k, n, det, cd, cn, adj) { return window.delcos.core.vocabulary.wordFor(k, n, { determiner: det, determinerCase: cd, nounCase: cn, adjective: adj }); }
function etiquetaCanal(p, total) { return window.delcos.core.vocabulary.channelLabel(p, total); }
function terminoDe(k) { return window.delcos.core.vocabulary.termOf(k); }
// v2.347.0: «Todos los segmentos» / «Todas las especialidades»
function todosLos(k) { return window.delcos.core.vocabulary.allOf(k); }
// v2.105.0: sin etiqueta propia, el nombre sale del vocabulario de la empresa («Farmacias», «Contactos»…)
function etiquetaContactos() { return window.delcos.core.vocabulary.contactsLabel(); }

// v2.224.0: palabras de partida genéricas (antes «médico» y «paciente»: DLC las tiene como vocabulario propio desde el SQL 133)
const TERM_DEF = window.delcos.core.vocabulary.DEFAULT_TERMS;

const TERMKEY = window.delcos.core.vocabulary.TERMS_KEY;

let TERMINOS = {};

// Nombre sin tratamiento delante («Dr. Gonzalo Serrano» → Gonzalo, iniciales GS)
const TRATAMIENTO = window.delcos.core.vocabulary.TITLE;
