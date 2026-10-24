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
