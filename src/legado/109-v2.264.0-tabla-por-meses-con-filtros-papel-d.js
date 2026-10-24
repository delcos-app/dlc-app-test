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
// La tabla por meses con los filtros de la pantalla
db.rpc = (orig => function (fn, args, ...r) {
  if (fn === 'analitica_tabla' && TAB === 'analitica' && args && !('p_producto' in args) && $('aprod')) {
    args = Object.assign({}, args, {
      p_medico: AN_MED ? AN_MED.id : null, p_comercial: ($('acom') && $('acom').value) || null,
      p_producto: $('aprod').value || null, p_reporting: ($('arep') && $('arep').value) || null, p_reportado: ($('areprt') && $('areprt').value) || null });
  }
  return orig.call(this, fn, args, ...r);
})(db.rpc);

// Estados comerciales: el papel de cada uno
const PAPELES_ESTADO = [
  ['inicial', 'Inicial', 'El de las fichas nuevas. Solo hay uno.'],
  ['avance', 'En avance', 'Ya hay contacto, pero todavía sin interés claro.'],
  ['interes', 'Con interés', 'Interesado: se le sigue de cerca.'],
  ['positivo', 'Ya es cliente', 'El objetivo: ya compra o trabaja con vosotros.'],
  ['negativo', 'Ya no interesa', 'No le interesa o se ha perdido.']];
arbolCfgUnico = (orig => function (...a) {
  const g = orig.apply(this, a);
  if (!(puedeCatalogos() || puede('administrar'))) return g;
  let dat = g.find(x => x[0] === 'Datos');
  if (!dat) { dat = ['Datos', []]; g.push(dat); }
  if (!dat[1].some(x => x.k === 'estados')) {
    const i = dat[1].findIndex(x => x.k === 'cat');
    dat[1].splice(i < 0 ? 0 : i + 1, 0, { k: 'estados', t: 'Estados comerciales', ic: 'target', d: 'El papel de cada estado: inicial, en avance, con interés, ya es cliente o ya no interesa', r: () => pintarEstadosPapel() });
  }
  return g;
})(arbolCfgUnico);
CFG_CLAVES.estados = 'estados comerciales papel inicial avance interés interes cliente activo positivo perdido negativo embudo';

// Panel delcos → Organizaciones: desactivar o volver a activar
orgAcciones = (orig => function (c, l) {
  const r = orig.apply(this, arguments);
  c.querySelectorAll('[data-orgdom]').forEach(b => {
    const o = l.find(x => x.id === b.dataset.orgdom); if (!o || o.principal || b.parentNode.querySelector('[data-orgact]')) return;   // la propia (principal), nunca
    const del = b.parentNode.querySelector('[data-orgdel]');
    const html = `<button class="btn sec" type="button" data-orgact="${o.id}">${o.activa === false ? 'Volver a activar' : 'Desactivar'}</button>`;
    if (del) del.insertAdjacentHTML('beforebegin', html); else b.parentNode.insertAdjacentHTML('beforeend', html);
  });
  c.querySelectorAll('[data-orgact]').forEach(b => b.onclick = async () => {
    const o = l.find(x => x.id === b.dataset.orgact); if (!o) return;
    const activar = o.activa === false;
    if (!await preguntar(activar ? `Sus ${num(o.usuarios)} usuarios podrán volver a entrar.`
      : `Sus ${num(o.usuarios)} usuarios no podrán entrar hasta que la vuelvas a activar. Sus datos no se tocan.`,
      { titulo: activar ? `¿Volver a activar ${o.nombre}?` : `¿Desactivar ${o.nombre}?`, ok: activar ? 'Volver a activar' : 'Desactivar', peligro: !activar })) return;
    b.disabled = true;
    const { data: x, error } = await db.rpc('activar_organizacion', { p_org: o.id, p_activa: activar });
    if (error || !x || !x.ok) {
      b.disabled = false;
      toast(({ permiso: 'No tienes permiso', principal: 'La organización principal no se puede desactivar', organizacion: 'No se encuentra esa empresa' })[(x && x.error) || ''] || ('No se ha podido cambiar' + (error ? ': ' + error.message : '')), true);
      return;
    }
    toast(activar ? `${o.nombre} vuelve a estar activa` : `${o.nombre} desactivada`);
    pintarOrganizaciones();
  });
  return r;
})(orgAcciones);




