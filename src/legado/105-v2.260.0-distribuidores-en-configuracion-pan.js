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
let DIS_TODOS = null;
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
function editarDistribuidor(d) {
  const nuevo = !d; d = d || {};
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>${nuevo ? 'Nuevo distribuidor' : 'Editar distribuidor'}</h2><div class="sm">Mayorista o depósito que sirve pedidos a vuestros clientes</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <label for="dsn">Nombre</label><input id="dsn" placeholder="p. ej. Cofares" value="${esc(d.nombre || '')}">
    <div class="g2"><div><label for="dse">Correo para pedidos</label><input id="dse" type="email" value="${esc(d.email || '')}"></div>
      <div><label for="dst">Teléfono</label><input id="dst" inputmode="tel" value="${esc(d.telefono || '')}"></div></div>
    <label for="dsnota">Nota</label><input id="dsnota" placeholder="Horario de pedidos, persona de contacto…" value="${esc(d.nota || '')}">
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" data-cerrar2>Cancelar</button><button type="button" class="btn" id="dsok">${nuevo ? 'Añadir' : 'Guardar'}</button></div>`;
  $('dlg2').showModal();
  $('dsok').onclick = async () => {
    const nombre = $('dsn').value.trim(); if (!nombre) { toast('Escribe el nombre', true); return; }
    const email = $('dse').value.trim() || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('El correo no parece válido', true); return; }
    const fila = { nombre, email, telefono: $('dst').value.trim() || null, nota: $('dsnota').value.trim() || null };
    $('dsok').disabled = true;
    const { error } = nuevo ? await db.from('distribuidores').insert(fila) : await db.from('distribuidores').update(fila).eq('id', d.id);
    if (error) { $('dsok').disabled = false; toast((nuevo ? 'No se ha podido añadir: ' : 'No se ha podido guardar: ') + error.message, true); return; }
    $('dlg2').close(); toast(nuevo ? 'Distribuidor añadido' : 'Guardado');
    await cargarDistribuidores(true).catch(() => []);
    if (CFG_KEY === 'distribuidores' && $('cfgcuerpo')) pintarDistribuidores();
  };
}




