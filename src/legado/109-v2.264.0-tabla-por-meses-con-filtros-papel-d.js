/* ============================================================
   v2.264.0 · Tabla por meses con filtros, papel de los estados y desactivar una empresa (puntos 4 y 5 del plan del 11/10/2026;
   necesita el SQL 141).
   - Analítica → Explorar → «Tabla por meses»: aplica también los filtros de la pantalla (profesional, comercial, producto y
     reporting), como el Ranking, y cuenta igual que él (con el descuento de línea).
   - Configuración → Datos → «Estados comerciales»: el papel de cada estado (Inicial, En avance, Con interés, Ya es cliente,
     Ya no interesa) se puede cambiar. Del papel dependen los avisos, los indicadores y los resultados de visita que se ofrecen.
   - Panel delcos → Organizaciones: «Desactivar» y «Volver a activar» cada empresa (sus usuarios no pueden entrar mientras está
     desactivada; sus datos no se tocan). Desactivada, se puede borrar si no tiene facturas.
   ============================================================ */

function arbolCfgUnicoBase4(...a) {
  const g = arbolCfgUnicoBase3.apply(this, a);
  if (!(puedeCatalogos() || puede('administrar'))) return g;
  let dat = g.find(x => x[0] === 'Datos');
  if (!dat) { dat = ['Datos', []]; g.push(dat); }
  if (!dat[1].some(x => x.k === 'estados')) {
    const i = dat[1].findIndex(x => x.k === 'cat');
    dat[1].splice(i < 0 ? 0 : i + 1, 0, { k: 'estados', t: 'Estados comerciales', ic: 'target', d: 'El papel de cada estado: inicial, en avance, con interés, ya es cliente o ya no interesa', r: () => pintarEstadosPapel() });
  }
  return g;
}
CFG_CLAVES.estados = 'estados comerciales papel inicial avance interés interes cliente activo positivo perdido negativo embudo';





