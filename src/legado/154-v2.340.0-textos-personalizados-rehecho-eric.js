/* ============================================================
   v2.340.0 · Textos personalizados, rehecho (Eric, 20/10/2026): una tabla con cada módulo del menú, su nombre de siempre y el que
   quiere la empresa (en blanco, el de siempre). Se irá ampliando. El de las fichas (directorio) es la etiqueta de la marca.
   La tarjeta «Cómo se llama cada cosa» de Marca y vocabulario queda fuera (Eric: descartada).
   ============================================================ */
// (R-12: pintarTextos se definía aquí otra vez; ahora está en su sitio, más arriba)

// v2.340.0 (Eric): «Estados comerciales» no es una página aparte: va como pestaña de «Clasificadores»
function arbolCfgUnicoBase8(...a) {
  const g = arbolCfgUnicoBase7.apply(this, a), d = g.find(x => x[0] === 'Datos'); if (!d) return g;
  const l = d[1], cat = l.find(x => x.k === 'cat'), est = l.find(x => x.k === 'estados');
  if (cat && est && !cat.hijos) {
    d[1] = l.filter(x => x !== est).map(x => x === cat ? Object.assign({}, cat, { hijos: [{ k: 'cat', t: 'Listas de valores', r: cat.r }, { k: 'estados', t: est.t, r: est.r }] }) : x);
  }
  return g;
}

