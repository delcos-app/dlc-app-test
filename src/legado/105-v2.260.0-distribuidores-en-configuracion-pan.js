/* ============================================================
   v2.260.0 · Distribuidores en Configuración (pantalla que faltaba, auditoría del 8/10/2026). Hasta ahora solo se podían añadir
   desde el editor del pedido y no se podían corregir ni retirar. Ahora, en Configuración → Datos → Distribuidores (administración):
   la lista con su correo y teléfono, añadir, editar (nombre, correo para pedidos, teléfono y nota) y dejar de usar o volver a usar
   (no se borran: los pedidos antiguos siguen diciendo quién los sirvió). Los que no se usan no salen al hacer un pedido.
   ============================================================ */
arbolCfgUnico = (orig => function (...a) {
  const g = orig.apply(this, a);
  if (!puede('administrar') || !puedeModulo('ventas')) return g;
  let dat = g.find(x => x[0] === 'Datos');
  if (!dat) { dat = ['Datos', []]; g.push(dat); }
  if (!dat[1].some(x => x.k === 'distribuidores'))
    dat[1].push({ k: 'distribuidores', t: 'Distribuidores', ic: 'package', d: 'Quién sirve pedidos por vosotros: correo, teléfono y si se usa', r: () => pintarDistribuidores() });
  return g;
})(arbolCfgUnico);
CFG_CLAVES.distribuidores = 'distribuidores mayoristas almacenes pedidos transfer servir correo';
async function pintarDistribuidores() {
  const c = $('cfgcuerpo'); if (!c) return;
  cargando(c, 'Cargando los distribuidores…');
  const { data, error } = await db.from('distribuidores').select('id,nombre,email,telefono,nota,activo').order('nombre');
  if (!$('cfgcuerpo') || CFG_KEY !== 'distribuidores') return;
  if (error) { c.innerHTML = `<div class="card"><p class="sm">No se han podido leer los distribuidores: ${esc(error.message)}</p></div>`; return; }
  DIS_TODOS = data || [];
  const fila = d => `<div class="ajfila disfila${d.activo ? '' : ' disoff'}" data-disid="${d.id}">
      <div><b>${esc(d.nombre)}${d.activo ? '' : ' <span class="pill">No se usa</span>'}</b>
        <span class="sm">${[d.email, d.telefono].filter(Boolean).map(esc).join(' · ') || 'Sin correo ni teléfono'}${d.nota ? ' · ' + esc(d.nota) : ''}</span></div>
      <div class="ajctl"><button type="button" class="btn sec" data-dised="${d.id}">Editar</button>
        <button type="button" class="btn sec" data-disact="${d.id}">${d.activo ? 'Dejar de usar' : 'Volver a usar'}</button></div></div>`;
  const act = DIS_TODOS.filter(d => d.activo), off = DIS_TODOS.filter(d => !d.activo);
  c.innerHTML = `<div class="card disw">
      <div class="discab"><p class="sm">Mayoristas o depósitos que sirven pedidos a vuestros clientes. Al hacer un pedido se elige si lo servís vosotros o uno de ellos; el suyo no descuenta stock de vuestro almacén.</p>
        <button type="button" class="btn" id="disnuevo">+ Nuevo distribuidor</button></div>
      ${DIS_TODOS.length ? act.map(fila).join('') + (off.length ? `<h3 class="dissub">Que ya no se usan</h3>` + off.map(fila).join('') : '')
        : '<p class="vacio" id="disvacio">Todavía no hay distribuidores.</p>'}</div>`;
  $('disnuevo').onclick = () => editarDistribuidor(null);
  c.querySelectorAll('[data-dised]').forEach(b => b.onclick = () => editarDistribuidor(DIS_TODOS.find(d => d.id === b.dataset.dised)));
  c.querySelectorAll('[data-disact]').forEach(b => b.onclick = async () => {
    const d = DIS_TODOS.find(x => x.id === b.dataset.disact); if (!d) return;
    if (d.activo && !await preguntar('No saldrá al hacer pedidos nuevos. Los pedidos que ya sirvió siguen diciendo que fue él.', { titulo: `¿Dejar de usar ${d.nombre}?`, ok: 'Dejar de usar' })) return;
    b.disabled = true;
    const { error } = await db.from('distribuidores').update({ activo: !d.activo }).eq('id', d.id);
    if (error) { b.disabled = false; toast('No se ha podido cambiar: ' + error.message, true); return; }
    toast(d.activo ? 'Ya no se usa' : 'Se vuelve a usar');
    await cargarDistribuidores(true).catch(() => []);
    pintarDistribuidores();
  });
}




