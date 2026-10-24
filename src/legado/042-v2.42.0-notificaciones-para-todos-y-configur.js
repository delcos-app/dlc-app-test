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


/* ---------------- Configuración: apartados y navegación ---------------- */


/* ---------------- alta de usuario: resumen al terminar ---------------- */



