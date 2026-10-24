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
async function pintarEstadosPapel() {
  const c = $('cfgcuerpo'); if (!c) return;
  cargando(c, 'Cargando los estados…');
  const { data: ce } = await db.from('clasificadores').select('id').eq('papel', 'estado_comercial').limit(1);
  const { data: est, error } = ce && ce[0] ? await db.from('valores_clasificador').select('id,valor,orden,activo,papel').eq('clasificador_id', ce[0].id).order('orden')
    : { data: [], error: null };
  if (!$('cfgcuerpo') || CFG_KEY !== 'estados') return;
  if (error) { c.innerHTML = `<div class="card"><p class="sm">No se han podido leer los estados: ${esc(error.message)}</p></div>`; return; }
  const l = (est || []).filter(v => v.activo !== false);
  const opc = v => PAPELES_ESTADO.map(([k, t]) => `<option value="${k}" ${v.papel === k ? 'selected' : ''}>${t}</option>`).join('');
  c.innerHTML = `<div class="card estw">
      <p class="sm">Cada estado tiene un papel. Con él, la plataforma sabe qué ficha es nueva, cuál avanza, cuál ya es cliente y cuál se ha perdido:
        de ahí salen los avisos, los indicadores de Inicio y qué resultados se ofrecen al registrar ${esc(TT('visita', 's', 'una', 'l', 'l'))}. El nombre de cada estado se cambia en «Textos personalizados».</p>
      ${l.length ? l.map(v => `<div class="ajfila estfila" data-estid="${v.id}"><div><b>${esc(v.valor)}</b>
          <span class="sm">${esc((PAPELES_ESTADO.find(p => p[0] === v.papel) || [, , 'Sin papel: no cuenta en avisos ni indicadores'])[2])}</span></div>
        <div class="ajctl"><select data-estpapel="${v.id}" aria-label="Papel de ${esc(v.valor)}" ${v.papel === 'inicial' ? 'title="Para cambiarlo, marca otro estado como Inicial"' : ''}>${v.papel ? '' : '<option value="" selected>Sin papel</option>'}${opc(v)}</select></div></div>`).join('')
        : '<p class="vacio">Todavía no hay estados comerciales.</p>'}</div>`;
  c.querySelectorAll('[data-estpapel]').forEach(s => s.onchange = async () => {
    const v = l.find(x => x.id === s.dataset.estpapel), nuevo = s.value;
    if (!v || !nuevo || nuevo === v.papel) return;
    if (v.papel === 'inicial') { s.value = v.papel; toast('Para cambiar el estado inicial, marca otro estado como «Inicial»', true); return; }
    const ant = l.find(x => x.papel === 'inicial' && x.id !== v.id);
    if (nuevo === 'inicial' && ant && !await preguntar(`Las fichas nuevas empezarán en «${v.valor}». «${ant.valor}» pasará a «En avance».`, { titulo: '¿Cambiar el estado inicial?', ok: 'Cambiar' })) { s.value = v.papel || ''; return; }
    s.disabled = true;
    const { data: r, error } = await db.rpc('guardar_papel_estado', { p_id: v.id, p_papel: nuevo });
    if (error || !r || !r.ok) {
      s.disabled = false; s.value = v.papel || '';
      toast(({ permiso: 'No tienes permiso para cambiarlo', sin_inicial: 'Para cambiar el estado inicial, marca otro estado como «Inicial»', papel: 'Ese papel no existe' })[(r && r.error) || ''] || ('No se ha podido cambiar' + (error ? ': ' + error.message : '')), true);
      return;
    }
    toast('Papel cambiado');
    invalidarCache(); try { await cargarCatalogos(); } catch (e) {}
    pintarEstadosPapel();
  });
}

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




