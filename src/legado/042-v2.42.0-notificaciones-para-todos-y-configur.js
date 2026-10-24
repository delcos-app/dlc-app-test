/* ============================================================
   v2.42.0 · Notificaciones para todos y configurables, Mi perfil,
   Rutas y Mensajes como apartados propios, Material de visita y
   Almacenes explicados, controles compactos en Configuración,
   navegación de Configuración sin desplazarse y alta con resumen
   ============================================================ */

/* ---------------- notificaciones ---------------- */

const TIPOS_NOTIF = [
  ['pauta', '💊', 'Pautas registradas', 'Cada vez que se registra, se corrige o se anula una pauta'],
  ['venta_cartera', '🛒', 'Pedidos de mi cartera', `Cuando se confirma un pedido de ${TT('medico', 's', 'un', 'l', 'l')} que llevas`],
  ['cartera', '🩺', 'Cambios en mi cartera', `Cuando te asignan ${TT('medico', 'p', '', 'l', 'l', 'nuevo')}`],
  ['cruce', '🔁', `${TT('visita', 'p', '', 'l', 'C')} de otros a mi cartera`, `Cuando otra persona ${TT('visita', 's', '', 'l', 'l')} a ${TT('medico', 's', 'un', 'l', 'l')} que llevas`],
  ['pedido_validado', '📦', 'Pedidos confirmados', 'Cada pedido que se confirma (menos los tuyos)']
];
const tiposDeMiRol = () => TIPOS_NOTIF.filter(t => puede('aviso_' + t[0]));
let NOTIF_N = 0;
async function refrescarCampana() {
  if (!PERFIL || document.body.classList.contains('sin-sesion')) return;
  const { data } = await RPC_ORIG('mis_notificaciones', { lim: 30 });
  const d = data || {}; NOTIF_N = d.sin_leer || 0;
  let b = $('mdavisos');
  if (!b) { const u = $('ubtn'); if (!u) return; u.insertAdjacentHTML('beforebegin', '<button class="mdavisos" id="mdavisos" aria-label="Notificaciones"></button>'); b = $('mdavisos'); }
  b.innerHTML = `🔔${NOTIF_N ? `<span class="nb2">${NOTIF_N > 9 ? '9+' : NOTIF_N}</span>` : ''}`;
  b.onclick = () => panelNotificaciones(d.lista || []);
}
pintarAvisos = refrescarCampana;
function irEnlace(e) {
  if (!e) return;
  const [t, id] = String(e).split(':');
  if (t === 'ficha' && id) abrirFicha(id); else if (t === 'pedido' && id) verPedido(id);
  else if (t === 'informe') ir('informe'); else if (t === 'directorio') ir('directorio');
}
// (v2.183.0: aquí iba la primera versión de panelNotificaciones; se redefine entera más abajo)

// v2.242.0: aquí iba panelNotificacionesPaso1 (nadie la usaba)

// v2.242.0: aquí iba panelNotificacionesPaso2 (nadie la usaba)

// v2.242.0: aquí iba panelNotificacionesBase (nadie la usaba)
setInterval(refrescarCampana, 30000);   // v2.281.0: cada 30 s (además, en vivo con el SQL 150)

function pintarNotif() {
  const pref = (PERFIL.preferencias || {}).notif || {}, tipos = tiposDeMiRol();
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel"><h2>Notificaciones</h2>
    <p class="sm">Te llegan a la campana 🔔 de arriba. Elige cuáles quieres recibir.</p>
    ${tipos.length ? `<div class="notcfg">${tipos.map(([k, ic, t, d]) => `<label class="vfswitch"><input type="checkbox" data-nt="${k}" ${pref[k] === false ? '' : 'checked'}><span class="sw"></span>
      <span><b>${ic} ${esc(t)}</b><br><span class="sm">${esc(d)}</span></span></label>`).join('')}</div>` : '<div class="vacio">Tu perfil no tiene notificaciones disponibles todavía.</div>'}</div>`;
  $('cfgcuerpo').querySelectorAll('[data-nt]').forEach(c => c.onchange = async () => {
    const notif = Object.assign({}, (PERFIL.preferencias || {}).notif || {}, { [c.dataset.nt]: c.checked });
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { notif });
    const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
    if (error) { toast('No se ha podido guardar', true); c.checked = !c.checked; return; }
    PERFIL.preferencias = data || prefs; toast(c.checked ? 'Activada' : 'Desactivada');
  });
}

/* ---------------- Mi perfil ---------------- */

/* pintarPerfil: la parte base y, en orden, cada paso que se le añade (antes eran 4 capas separadas). */
function pintarPerfil() {
  pintarPerfilBase();
  pintarPerfilPaso1();
  pintarPerfilPaso2();
  pintarPerfilPaso3();
  pintarPerfilPaso4();
}

function pintarPerfilPaso1() {
  const g = $('pfi') && $('pfi').closest('.g2'); if (!g) return;
  const vacio = g.children[1];
  vacio.innerHTML = `<label for="pfl">Idioma</label><select id="pfl" data-notr>${IDIOMAS.map(([k, n]) => `<option value="${k}" ${IDIOMA === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
  $('pfl').onchange = async () => {
    const id = $('pfl').value;
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { idioma: id });
    const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
    if (error) { toast('No se ha podido guardar', true); return; }
    PERFIL.preferencias = data || prefs;
    try { localStorage.setItem('app-idioma', id); } catch (e) {}
    // Al volver al castellano se recarga para recuperar los textos originales
    if (id === 'es') { location.reload(); return; }
    aplicarIdioma(id); toast('✓');
  };
}

function pintarPerfilPaso2() {
  const ok = $('pfok');
  if (ok) {
    // Siempre con las preferencias actuales: antes, guardar «Mis datos» podía borrar el idioma elegido
    ok.onclick = async () => {
      const nombre = $('pfn').value.trim(); if (!nombre) { toast('El nombre no puede quedar vacío', true); return; }
      const prefs = Object.assign({}, PERFIL.preferencias || {}, { telefono: $('pft').value.trim(), inicio: $('pfi').value });
      const [a, b] = await Promise.all([db.rpc('guardar_preferencias', { p: prefs }), db.from('perfiles').update({ nombre }).eq('id', PERFIL.id)]);
      if (a.error) { toast('No se ha podido guardar', true); return; }
      PERFIL.preferencias = a.data || prefs;
      if (!b.error) { PERFIL.nombre = nombre; $('uname').textContent = nombrePila(nombre); $('av').textContent = iniciales(nombre); }
      toast('Datos guardados');
    };
  }
  const sel = $('pfl');
  if (sel) sel.onchange = async () => {
    const id = sel.value;
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { idioma: id });
    const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
    if (error) { toast('No se ha podido guardar', true); return; }
    PERFIL.preferencias = data || prefs;
    try { localStorage.setItem('app-idioma', id); sessionStorage.removeItem('app-idioma-recarga'); } catch (e) {}
    pantallaCarga(IDIOMAS.find(x => x[0] === id)[1] + '…');
    location.reload();
  };
}

function pintarPerfilPaso3() {
 medidorClave($('pfp1'), $('pfp2'), $('pfpok'));
}

function pintarPerfilPaso4() {
 const c = $('pfp1') && $('pfp1').closest('.card'); if (c) c.remove();
}

function pintarPerfilBase() {
  const pr = PERFIL.preferencias || {};
  const inicios = [['inicio', 'Inicio'], ['agenda', 'Agenda'], ['rutas', 'Rutas'], ['directorio', 'Directorio'], ['ventas', 'Pedidos']].filter(([k]) => puedeModulo(k));
  $('cfgcuerpo').innerHTML = `<div id="perfilcab"></div>
    <div class="card cfgpanel"><h2>Mis datos</h2>
      <div class="g2"><div><label for="pfn">Nombre visible</label><input id="pfn" value="${esc(PERFIL.nombre)}"></div>
        <div><label for="pft">Teléfono</label><input id="pft" inputmode="tel" value="${esc(pr.telefono || '')}" placeholder="Para que el equipo pueda llamarte"></div></div>
      <div class="g2"><div><label for="pfi">Al entrar, abrir</label><select id="pfi">${inicios.map(([k, t]) => `<option value="${k}" ${(pr.inicio || 'inicio') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div><div></div></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn" id="pfok">Guardar</button></div></div>
    <div class="card cfgpanel"><h2>Contraseña</h2>
      <div class="g2"><div><label for="pfp1">Nueva contraseña</label><input id="pfp1" type="password" autocomplete="new-password"></div>
        <div><label for="pfp2">Repítela</label><input id="pfp2" type="password" autocomplete="new-password"></div></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" id="pfpok">Cambiar contraseña</button></div></div>`;
  // Tarjeta de contexto (datos, accesos y actividad)
  const tmp = $('cfgcuerpo'); const guard = tmp.innerHTML;
  $('pfok').onclick = async () => {
    const nombre = $('pfn').value.trim(); if (!nombre) { toast('El nombre no puede quedar vacío', true); return; }
    const prefs = Object.assign({}, pr, { telefono: $('pft').value.trim(), inicio: $('pfi').value });
    const [a, b] = await Promise.all([db.rpc('guardar_preferencias', { p: prefs }), db.from('perfiles').update({ nombre }).eq('id', PERFIL.id)]);
    if (a.error) { toast('No se ha podido guardar', true); return; }
    PERFIL.preferencias = a.data || prefs; if (!b.error) { PERFIL.nombre = nombre; $('uname').textContent = nombrePila(nombre); $('av').textContent = iniciales(nombre); }
    toast('Datos guardados');
  };
  $('pfpok').onclick = async () => {
    const p1 = $('pfp1').value, p2 = $('pfp2').value;
    if (p1.length < 8) { toast('Mínimo 8 caracteres', true); return; } if (p1 !== p2) { toast('No coinciden', true); return; }
    const { error } = await db.auth.updateUser({ password: p1 });
    if (error) { toast('No se ha podido cambiar: ' + error.message, true); return; }
    $('pfp1').value = $('pfp2').value = ''; toast('Contraseña cambiada');
  };
  // Se reutiliza la tarjeta de perfil con accesos y actividad
  const caja = document.createElement('div'); caja.id = 'cfgcuerpo-tmp';
  pintarPrefsPerfil();
}
async function pintarPrefsPerfil() {
  // v2.340.0: la tarjeta de la persona se pinta directamente en su sitio (antes, en un contenedor escondido esperando a pintarPrefs:
  // llegaba tarde o, si quedaba otra #miperfil en la copia fija, no llegaba y dejaba el hueco)
  document.querySelectorAll('#miperfil, #mpextra').forEach(x => { if (x.closest('.congelada')) x.removeAttribute('id'); else x.remove(); });
  if (!$('perfilcab')) return;
  const p = pintarPrefsPaso2();
  const mp = $('miperfil');
  if (mp && $('perfilcab')) $('perfilcab').replaceWith(mp); else if ($('perfilcab')) $('perfilcab').remove();
  try { await p; } catch (e) {}
}
// Al entrar, se abre el módulo elegido

/* ---------------- Rutas y desplazamientos ---------------- */

async function pintarPrefsParte(parte) {
  await pintarPrefs();
  const c = $('cfgcuerpo'); if (!c) return;
  if ($('miperfil')) $('miperfil').remove();
  if (parte === 'rutas') {
    c.querySelectorAll(':scope > p.sm').forEach(p => p.remove());
    c.insertAdjacentHTML('afterbegin', '<div class="card cfgpanel"><h2>Rutas y desplazamientos</h2><p class="sm">Desde dónde sales y dónde terminas. Al pulsar «Cómo llegar» eliges con qué app navegar (Google Maps, Waze o Apple Maps). El horario de las rutas está en su propio apartado.</p></div>');
  }
}

/* ---------------- Material de visita ---------------- */

async function pintarMaterial() {
  await Promise.all([cargarAjustes(), cargarProductos()]);
  const m = Object.assign({ producto_id: null, restar_stock: false }, AJUSTES.muestras || {});
  const { data: clas } = await db.rpc('clasificadores_actividad');
  const mat = (clas || []).find(c => c.papel === 'material_visita');
  const { data: cid } = await db.from('clasificadores').select('id').eq('papel', 'material_visita').maybeSingle();
  const { data: vals } = cid ? await db.from('valores_clasificador').select('id,valor,activo,dato_tipo').eq('clasificador_id', cid.id).order('orden') : { data: [] };
  $('cfgcuerpo').innerHTML = `
    <div class="card cfgpanel"><h2>Material de ${TT('visita', 's', '', 'l', 'l')}</h2>
      <p class="sm">Todo lo que un comercial puede dejar en ${TT('visita', 's', 'un', 'l', 'l')}. Al registrar ${TT('visita', 's', 'el', 'l', 'l')} se marca qué se entregó y cuánto, y queda en la ficha ${TT('medico', 's', 'del', 'l', 'l')} y en Analítica (material por comercial, por ${TT('medico', 's', '', 'l', 'l')} y por mes).</p>
      <div class="mattipos"><div><b>📦 Muestras de producto</b><span>Unidades de un producto del catálogo. Pueden descontarse del stock.</span></div>
        <div><b>📚 Material promocional</b><span>Dípticos, catálogos, flyers, tarjetas… Se cuentan, pero no descuentan stock.</span></div></div></div>
    <div class="card cfgpanel"><h2>📦 Muestras de producto</h2>
      <div class="g2"><div><label for="muprod">Producto que se entrega como muestra</label><select id="muprod"><option value="">— Ninguno —</option>${PRODUCTOS.filter(p => p.tipo !== 'servicio').map(p => `<option value="${p.id}" ${p.id === m.producto_id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div><div></div></div>
      <label class="vfswitch" style="margin-top:10px"><input type="checkbox" id="murest" ${m.restar_stock ? 'checked' : ''}><span class="sw"></span>
        <span><b>Descontar las muestras del stock</b><br><span class="sm">Salen del maletín de quien registra ${TT('visita', 's', 'el', 'l', 'l')} (o del almacén central si no tiene), empezando por el lote que caduca antes. Así sabes cuántas muestras quedan y a quién llegó cada lote.</span></span></label>
      <div class="acts" style="justify-content:flex-end"><button class="btn" id="muok">Guardar</button></div></div>
    <div class="card cfgpanel"><h2>📚 Material promocional</h2>
      <p class="sm">Lo que aparece para marcar al registrar ${TT('visita', 's', 'un', 'l', 'l')}. En cada uno eliges si al registrar se anotan las unidades entregadas y, con el portal, si se puede pedir desde él y cuántas como máximo por petición.</p>
      <div class="matlista">${(vals || []).map(v => `<div class="matfila ${v.activo ? '' : 'off'}"><b>${esc(v.valor)}</b><span class="sm">${v.dato_tipo === 'numero' ? 'Pide cantidad' : 'Solo se marca'}</span>
        <label class="vfswitch mini"><input type="checkbox" data-mact="${v.id}" ${v.activo ? 'checked' : ''}><span class="sw"></span><span class="sm">${v.activo ? 'Activo' : 'Oculto'}</span></label></div>`).join('') || '<div class="sm">Todavía no hay material.</div>'}</div>
      <div class="matadd"><input id="matn" placeholder="Nuevo material, p. ej. Cartel para el mostrador"><label class="opt" style="margin:0"><input type="checkbox" id="matq" checked> Anotar cuántas se entregan</label>
        <button class="btn sec" id="matok" ${cid ? '' : 'disabled'}>Añadir</button></div></div>`;
  $('muok').onclick = async () => {
    if ($('murest').checked && !$('muprod').value) { toast('Elige el producto de las muestras', true); return; }
    const { error } = await db.rpc('guardar_ajuste', { p_clave: 'muestras', p_valor: { producto_id: $('muprod').value || null, restar_stock: $('murest').checked } });
    if (error) { toast('No se ha podido guardar', true); return; } AJUSTES.muestras = { producto_id: $('muprod').value || null, restar_stock: $('murest').checked }; toast('Guardado');
  };
  $('cfgcuerpo').querySelectorAll('[data-mact]').forEach(c => c.onchange = async () => { await db.rpc('guardar_valor', { p: { id: c.dataset.mact, activo: c.checked } }); toast(c.checked ? `Visible en ${TT('visita', 'p', 'el', 'l', 'l')}` : `Oculto en ${TT('visita', 'p', 'el', 'l', 'l')}`); cargarCatalogos(); pintarMaterial(); });
  $('matok').onclick = async () => {
    const v = $('matn').value.trim(); if (!v) return;
    const { error } = await db.rpc('guardar_valor', { p: Object.assign({ clasificador_id: cid.id, valor: v }, $('matq').checked ? { dato_tipo: 'numero', dato_etiqueta: 'Unidades' } : {}) });
    if (error) { toast('No se ha podido: ' + error.message, true); return; } toast('Añadido'); cargarCatalogos(); pintarMaterial();
  };
}

/* ---------------- Almacenes ---------------- */

async function pintarAlmacenes2() {
  await cargarAlmacenes(); if (!COMS.length) await cargarComerciales();
  const { data: st } = await RPC_ORIG('stock_resumen', {});
  const sinMaletin = COMS.filter(u => rolPuede(u.rol, 'almacen_propio') && !ALMACENES.some(a => a.usuario_id === u.id));
  $('cfgcuerpo').innerHTML = `
    <div class="card cfgpanel"><h2>Almacenes</h2>
      <p class="sm">Dónde está físicamente tu stock. Cada unidad está en un almacén y en un lote, así sabes qué hay, dónde y cuándo caduca.</p>
      <div class="mattipos"><div><b>🏢 Almacén central</b><span>Donde entra la mercancía al recibir las compras y de donde salen los pedidos.</span></div>
        <div><b>💼 Maletín de comercial</b><span>Las muestras que lleva cada comercial. Se reponen traspasando desde el central y se descuentan al registrar ${TT('visita', 'p', '', 'l', 'l')}.</span></div></div></div>
    <div class="card cfgpanel"><h2>Tus almacenes</h2>
      <div class="almgrid">${ALMACENES.map(a => `<div class="almc"><span class="ic">${a.tipo === 'central' ? '🏢' : a.tipo === 'deposito' ? '🏢' : '💼'}</span>
        <b>${esc(a.nombre)}</b><span class="sm">${a.tipo === 'central' ? 'Almacén central' : a.tipo === 'deposito' ? 'Depósito en un centro' : 'Maletín de ' + esc(a.usuario || '—')}${a.activo ? '' : ' · inactivo'}</span>
        <span class="almu"><b>${num(a.unidades || 0)}</b> unidades</span></div>`).join('')}</div>
      ${sinMaletin.length ? `<div class="avisoh" style="margin-top:12px"><span>${sinMaletin.length === 1 ? esc(sinMaletin[0].nombre) + ' no tiene' : sinMaletin.length + ' comerciales no tienen'} maletín: sus muestras saldrán del almacén central.</span></div>` : ''}
      <div class="matadd" style="margin-top:12px"><select id="almu">${COMS.filter(u => rolPuede(u.rol, 'almacen_propio')).map(u => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}</select>
        <button class="btn sec" id="almok">Crear maletín</button></div>
      <p class="sm">Para pasar unidades del central a un maletín: Productos → Stock → abre el producto → «Traspasar».${Array.isArray(st) && st.length ? '' : ''}</p></div>`;
  $('almok').onclick = async () => {
    const u = COMS.find(x => x.id === $('almu').value); if (!u) return;
    const { error } = await db.rpc('guardar_almacen', { p: { nombre: 'Maletín ' + String(u.nombre).split(' ')[0], tipo: 'maletin', usuario_id: u.id } });
    if (error) { toast('No se ha podido crear', true); return; } toast('Maletín creado'); pintarAlmacenes2();
  };
}

/* ---------------- Configuración: apartados y navegación ---------------- */


/* ---------------- alta de usuario: resumen al terminar ---------------- */



