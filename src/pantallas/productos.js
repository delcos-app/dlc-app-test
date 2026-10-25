// pantallas/productos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function editorProductos() {
  await cargarProductos();
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Productos</h2><div class="sm">Catálogo usado en pedidos, muestras y analítica</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="lista">${PRODUCTOS.map(p => `<div class="item" style="cursor:default">
      <span class="ic" style="${p.foto_url ? `background:url('${esc(p.foto_url)}') center/cover` : ''}">${p.foto_url ? '' : '◧'}</span><span class="tx"><b>${esc(p.nombre)}</b>
        <span class="sm">${esc(p.presentacion || '')}${p.precio ? ' · ' + eur(p.precio) + ' + ' + (p.iva || 0) + '% IVA' : ''}${p.referencia ? ' · ref. ' + esc(p.referencia) : ''}</span></span>
      <span class="acts" style="margin:0"><button class="btn sec" data-pdel="${p.id}">Desactivar</button></span></div>`).join('')
      || '<div class="vacio">Todavía no hay productos.</div>'}</div>
    <div class="g2" style="margin-top:12px">
      <div><label for="prn">Nombre</label><input id="prn" placeholder="Nombre del producto"></div>
      <div><label for="prp">Presentación</label><input id="prp" placeholder="Caja de 60 cápsulas"></div>
    </div>
    <div class="g2">
      <div><label for="prpr">Precio sin IVA</label><input id="prpr" type="number" step="0.01" min="0" placeholder="41,82"></div>
      <div><label for="priva">IVA (%)</label><input id="priva" type="number" min="0" max="21" value="10"></div>
    </div>
    <div class="g2">
      <div><label for="prref">Referencia</label><input id="prref"></div>
      <div><label for="prcb">Código de barras</label><input id="prcb"></div>
    </div>
    <label for="prfoto">Foto del producto</label><input id="prfoto" type="file" accept="image/*">
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="pradd">Añadir producto</button></div>`;

  $('pradd').onclick = async ev => {
    if (!$('prn').value.trim()) { toast('Escribe el nombre', true); return; }
    ev.target.disabled = true;
    let foto_url = null;
    const f = $('prfoto').files && $('prfoto').files[0];
    if (f) {
      const ruta = 'p-' + Date.now() + '-' + f.name.replace(/[^a-zA-Z0-9.]/g, '');
      const { error: eu } = await db.storage.from('productos').upload(ruta, f, { upsert: true });
      if (!eu) foto_url = db.storage.from('productos').getPublicUrl(ruta).data.publicUrl;
      else toast('La foto no se ha podido subir: ' + eu.message, true);
    }
    const { data: r, error } = await db.rpc('guardar_producto', { p: { nombre: $('prn').value.trim(),
      presentacion: $('prp').value.trim(), precio: $('prpr').value, iva: +$('priva').value || 10,
      referencia: $('prref').value.trim(), codigo_barras: $('prcb').value.trim(),
      ...(foto_url ? { foto_url } : {}) } });
    ev.target.disabled = false;
    if (error || (r && r.ok === false)) { toast('No se ha podido crear', true); return; }
    toast('Producto añadido'); editorProductos();
  };
  $('dbody').querySelectorAll('[data-pdel]').forEach(b => b.onclick = async () => {
    await db.rpc('guardar_producto', { p: { id: b.dataset.pdel, activo: false } });
    toast('Producto desactivado'); editorProductos();
  });
  $('dlg').showModal();
}


async function cargarAlmacenes() { const { data } = await db.rpc('almacenes_lista'); ALMACENES = data || []; }

function loteRecepcion(l, uds, almId) {
  return `<div class="g2 rcl">
    <div class="g2" style="margin:0"><div><label>Unidades</label><input type="number" min="0" data-r="u" value="${uds}"></div>
      <div><label>Nº de lote</label><input data-r="lote" placeholder="p. ej. L2609"></div></div>
    <div class="g2" style="margin:0"><div><label>Caducidad</label><input type="date" data-r="cad"></div>
      <div><label>Fabricación</label><input type="date" data-r="fab"></div></div>
    <div><label>Almacén</label><select data-r="alm">${ALMACENES.filter(a => a.activo).map(a => `<option value="${a.id}" ${a.id === almId ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}</select></div></div>`;
}











async function refrescarProductos() {
  try { invalidarCache(); } catch (e) {}
  await cargarProductos();
  if (TAB === 'productos' && typeof cargarProductosModulo === 'function') cargarProductosModulo();
}



let SERVICIOS = [];

let PSEC = 'productos';

let PRODF = {};   // v2.88.0: filtros por campos del producto (Clasificadores)



let ESTADO_PROD = {};

const vendible = p => (p.estado || 'Activo') === 'Activo';

const pillMaterial = e => `<span class="pill ${e === 'Pendiente' ? 'p-warn' : e === 'Entregado' ? 'p-est' : 'p-anu'}">${esc(e)}</span>`;

/* v2.196.0 · Material en depósito en el cliente (segunda tanda del estudio por sectores, SQL 122). Decisiones de Eric: solo en fichas de tipo
   Centro; lo usado se sabe por recuento o apuntando cada uso; lo usado crea un pedido en borrador y se propone reponerlo.
   - Ficha de un centro: bloque «Material en depósito» (unidades y productos) con «Abrir el depósito» o «Dejar material en depósito».
   - Ventana del depósito: lo que hay por lote y caducidad (aviso si caduca en menos de 60 días), lo usado en 90 días y los últimos
     movimientos; «Reponer» (de tu maletín o del almacén central), «Apuntar uso» (con referencia, sin datos del paciente) y «Recuento».
     Lo usado deja un pedido en borrador del centro («Ver el pedido») y ofrece «Reponer lo usado». */

const depCaducaPronto = f => f && f <= isoMas(hoyISO(), 60);

/* v2.198.0 · Cobertura por producto en el ciclo (segunda tanda, «Panel y ciclos», SQL 124). Decisiones de Eric: la cobertura mide los
   productos presentados en las visitas, y solo salen los que la administración marca como «Se promociona en las visitas».
   - Producto: casilla «Se promociona en las visitas».
   - Registrar visita: «Productos presentados» (los que se promocionan); el historial de la ficha dice qué se presentó.
   - Ciclo de visitas → «Por producto»: por cada producto, cuántos de A, B y C lo han oído este ciclo y a quiénes les falta (con «+ Cita»). */
let PROMO_PRODS = null;   // [{ id, nombre }] de los productos que se promocionan (última lista leída)


async function cargarProductosBase() {
  const { data } = await db.rpc('productos_lista');
  const l = data || [];
  PRODUCTOS = l.filter(p => (p.tipo || 'producto') === 'producto');
  SERVICIOS = l.filter(p => p.tipo === 'servicio');
}



async function pintarMaterialBase() {
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

async function cargarProductos() {
  await cargarProductosBase();
  const { data } = await db.from('productos').select('id,estado');
  ESTADO_PROD = {}; (data || []).forEach(x => { ESTADO_PROD[x.id] = x.estado || 'Activo'; });
  [...PRODUCTOS, ...SERVICIOS].forEach(p => { p.estado = ESTADO_PROD[p.id] || 'Activo'; });
}

async function productosPromocionadosBase() {
  if (!navigator.onLine) return PROMO_PRODS || [];   // v2.259.0: sin red, la última lista leída
  try {
    const { data, error } = await db.from('productos').select('id,nombre,estado').eq('promocionado', true).order('nombre');
    if (!error) PROMO_PRODS = (data || []).filter(p => (p.estado || 'Activo') !== 'Descatalogado').map(p => ({ id: p.id, nombre: p.nombre }));
  } catch (e) {}
  return PROMO_PRODS || [];
}

// La lista de material se pide a la vez que los productos promocionados (así «Presentar» sale con ellos, no después)
async function productosPromocionados(...a) {
  const [r] = await Promise.all([productosPromocionadosBase.apply(this, a), presMateriales()]);
  return r;
}

/* ============================================================
   v2.278.0 · Material de visita: cada material con su cantidad y su máximo en el portal (aviso de Eric, 12/10/2026).
   Antes, «Pide cantidad» solo se elegía al añadir y el máximo que puede pedir el profesional desde su portal (20 si nadie lo
   cambiaba) estaba en otro apartado. Ahora cada fila de «Material promocional» lleva:
   - Al registrar: «Anotar cuántas se entregan» o «Solo marcar que se entregó» (guardar_valor dato_tipo).
   - Con el portal: «Se puede pedir desde el portal» y «Máximo por petición» (1 a 1.000; vacío o fuera de rango avisa en la fila
     y no se guarda). Se guarda en el mismo ajuste que «Portal del profesional» (portal.material).
   ============================================================ */
async function pintarMaterial(...x) {
  const r = await pintarMaterialBase.apply(this, x);
  try { await matMejorar(); } catch (e) { registrarError('error', 'Material promocional: ' + e.message); }
  return r;
}

function editorProductoBase(p) {
  const esAdmin = puede('administrar');
  p = p || { iva: 10, activo: true, unidades_envase: 1 };
  const ro = esAdmin ? '' : 'disabled';
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${p.id ? esc(p.nombre) : 'Nuevo producto'}</h2>
      <div class="sm">${esAdmin ? 'Escribe el precio sin IVA o con IVA: el otro se calcula solo.' : 'Solo administración puede cambiar productos.'}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div style="display:flex;gap:14px;align-items:center;margin-top:8px">
      <span class="pfoto" id="prfprev" style="width:72px;height:72px;${p.foto_url ? `background-image:url('${esc(p.foto_url)}')` : ''}">${p.foto_url ? '' : '◧'}</span>
      ${esAdmin ? '<div style="flex:1"><label for="prfoto" style="margin-top:0">Foto</label><input id="prfoto" type="file" accept="image/*"></div>' : ''}</div>
    <div class="g2">
      <div><label for="prn">Nombre</label><input id="prn" value="${esc(p.nombre || '')}" ${ro}></div>
      <div><label for="prp">Presentación</label><input id="prp" value="${esc(p.presentacion || '')}" placeholder="Caja de 30 sobres" ${ro}></div></div>
    <div class="pvp">
      <div><label for="prpr">Precio sin IVA (€)</label><input id="prpr" type="number" step="0.01" min="0" value="${p.precio != null ? +(+p.precio).toFixed(4) : ''}" ${ro}></div>
      <div><label for="priva">IVA (%)</label><input id="priva" type="number" step="1" min="0" max="21" value="${p.iva != null ? p.iva : 10}" ${ro}></div>
      <div><label for="prpvp">Precio con IVA (€)</label><input id="prpvp" type="number" step="0.01" min="0" value="${p.precio != null ? r2(p.precio * (1 + (+p.iva || 0) / 100)) : ''}" ${ro}></div></div>
    <div class="g2">
      <div><label for="prref">Referencia</label><input id="prref" value="${esc(p.referencia || '')}" ${ro}></div>
      <div><label for="prcb">Código de barras</label><input id="prcb" value="${esc(p.codigo_barras || '')}" ${ro}></div></div>
    <div class="g2">
      <div><label for="prue">Unidades por envase</label><input id="prue" type="number" min="1" value="${p.unidades_envase || 1}" ${ro}></div>
      <div><label for="prco">Coste (€, sin IVA)</label><input id="prco" type="number" step="0.01" min="0" value="${p.coste != null ? p.coste : ''}" ${ro}></div></div>
    ${esAdmin && p.id ? `<label class="opt" style="margin-top:12px"><input type="checkbox" id="pract" ${p.activo ? 'checked' : ''}> Activo: aparece al crear pedidos</label>` : ''}
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>${esAdmin ? 'Cancelar' : 'Cerrar'}</button>
      ${esAdmin ? `<button class="btn" id="prok">${p.id ? 'Guardar' : 'Crear producto'}</button>` : ''}</div>`;
  $('dlg').showModal();
  if (!esAdmin) return;

  const iva = () => (+$('priva').value || 0) / 100;
  $('prpr').oninput = () => { $('prpvp').value = $('prpr').value === '' ? '' : r2(+$('prpr').value * (1 + iva())); };
  $('prpvp').oninput = () => { $('prpr').value = $('prpvp').value === '' ? '' : +(+$('prpvp').value / (1 + iva())).toFixed(4); };
  $('priva').oninput = () => { if ($('prpr').value !== '') $('prpvp').value = r2(+$('prpr').value * (1 + iva())); };
  $('prfoto').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    $('prfprev').style.backgroundImage = `url('${URL.createObjectURL(f)}')`; $('prfprev').textContent = '';
  };
  camposInsertar($('dbody'), 'producto', p.id, $('prok') && $('prok').closest('.acts'));
  $('prok').onclick = async ev => {
    if (!$('prn').value.trim()) { toast('Escribe el nombre', true); return; }
    const cps = camposLeer($('dbody'));
    if (cps && cps.falta.length) { toast(`Rellena «${cps.falta[0]}»`, true); return; }
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    let foto_url;
    const f = $('prfoto').files && $('prfoto').files[0];
    if (f) {
      const ruta = 'p-' + Date.now() + '-' + f.name.replace(/[^a-zA-Z0-9.]/g, '');
      const { error: eu } = await db.storage.from('productos').upload(ruta, f, { upsert: true });
      if (!eu) foto_url = db.storage.from('productos').getPublicUrl(ruta).data.publicUrl;
      else toast('La foto no se ha podido subir: ' + eu.message, true);
    }
    const { data: r, error } = await db.rpc('guardar_producto', { p: {
      id: p.id || null, nombre: $('prn').value.trim(), presentacion: $('prp').value.trim(),
      precio: $('prpr').value, iva: $('priva').value, referencia: $('prref').value.trim(),
      codigo_barras: $('prcb').value.trim(), unidades_envase: $('prue').value, coste: $('prco').value,
      ...(foto_url ? { foto_url } : {}), ...($('pract') ? { activo: $('pract').checked } : {}) } });
    ev.target.disabled = false; ev.target.textContent = p.id ? 'Guardar' : 'Crear producto';
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar: ' + ((error && error.message) || (r && r.error) || ''), true); return; }
    if (cps && !(await camposGuardar(cps, (r && r.id) || p.id))) return;
    $('dlg').close(); toast(p.id ? 'Producto guardado' : 'Producto creado');
    await cargarProductos(); if (TAB === 'productos') pintarProductos();
  };
}

// En la ficha del producto: selector de estado
function editorProductoBase2(p, ...r) {
  const x = editorProductoBase(p, ...r);
  setTimeout(() => {
    if (!p || !p.id || $('prestado') || !$('dbody')) return;
    const est = ESTADO_PROD[p.id] || p.estado || 'Activo';
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prestado"><h3>Estado</h3><div class="segs">${['Activo', 'En pausa', 'Descatalogado'].map(e => `<button type="button" data-pest="${e}" class="${e === est ? 'on' : ''}">${e}</button>`).join('')}</div>
      <div class="sm" style="margin-top:6px">«En pausa»: no aparece al hacer pedidos, pero se conserva su stock. «Descatalogado»: deja de venderse.</div></div>`);
    $('dbody').querySelectorAll('[data-pest]').forEach(b => b.onclick = async () => {
      const { data, error } = await RPC_ORIG('estado_producto', { p_id: p.id, p_estado: b.dataset.pest });
      if (error || !data || !data.ok) { toast('No se ha podido cambiar el estado', true); return; }
      ESTADO_PROD[p.id] = b.dataset.pest; const pp = PRODUCTOS.find(z => z.id === p.id); if (pp) pp.estado = b.dataset.pest;
      $('dbody').querySelectorAll('[data-pest]').forEach(z => z.classList.toggle('on', z === b)); toast('Estado: ' + b.dataset.pest);
    });
  }, 80);
  return x;
}

function editorProductoBase3(p, ...a) { const r = editorProductoBase2.call(this, p, ...a); if (p && p.id) setTimeout(() => bloqueCampos('productos', p.id, $('dbody')), 150); return r; }

// Producto: datos de la muestra regulada (solo administración; se guardan al cambiarlos)
function editorProductoBase4(p, ...r) {
  const x = editorProductoBase3.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !$('dbody') || !$('prok') || $('prmuestra')) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    if (!p || !p.id) { ref.insertAdjacentHTML('beforebegin', '<div class="blk" id="prmuestra"><h3>Muestras con control legal</h3><p class="sm">Guarda el producto y vuelve a abrirlo para marcarlo como muestra con control legal.</p></div>'); return; }
    const { data: m } = await db.from('productos').select('muestra_regulada,muestra_desde,muestra_max').eq('id', p.id).maybeSingle();
    if (!$('dbody') || $('prmuestra')) return;
    const d = m || {};
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prmuestra"><h3>Muestras con control legal</h3>
      <label class="opt"><input type="checkbox" id="prmreg" ${d.muestra_regulada ? 'checked' : ''}> Es un medicamento: sus muestras llevan firma y límite</label>
      <div class="g2 ${d.muestra_regulada ? '' : 'hide'}" id="prmdat">
        <div><label for="prmdesde">Autorizado el</label><input id="prmdesde" type="date" value="${esc(d.muestra_desde || '')}"></div>
        <div><label for="prmmax">Máximo por profesional y año</label><input id="prmmax" type="number" min="1" max="10" step="1" value="${d.muestra_max || 10}"></div></div>
      <p class="sm">La ley permite como mucho 10 muestras por medicamento, profesional y año, durante los 2 años siguientes a su autorización, y con la solicitud firmada.</p></div>`);
    const guardar = async () => {
      const reg = $('prmreg').checked, max = Math.min(10, Math.max(1, +$('prmmax').value || 10));
      $('prmdat').classList.toggle('hide', !reg);
      const { error } = await db.from('productos').update({ muestra_regulada: reg, muestra_desde: $('prmdesde').value || null, muestra_max: max }).eq('id', p.id);
      toast(error ? 'No se ha podido guardar: ' + error.message : 'Muestras: guardado', !!error);
    };
    ['prmreg', 'prmdesde', 'prmmax'].forEach(k => $(k).addEventListener('change', guardar));
  }, 120);
  return x;
}

function editorProductoBase5(p, ...r) {
  const x = editorProductoBase4.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !planIncluyeSeccion('cobertura') || !$('dbody') || !$('prok') || $('prpromo') || !p || !p.id) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    const { data: m } = await db.from('productos').select('promocionado').eq('id', p.id).maybeSingle();
    if (!$('dbody') || $('prpromo') || !m) return;
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prpromo"><h3>Promoción</h3>
      <label class="opt"><input type="checkbox" id="prpromoc" ${m.promocionado ? 'checked' : ''}> Se promociona en las ${TT('visita', 'p', '', 'l', 'l')}</label>
      <p class="sm">Sale en «Registrar ${TT('visita', 's', '', 'l', 'l')}» para marcarlo como presentado, y en la cobertura por producto del ciclo.</p></div>`);
    $('prpromoc').onchange = async e => {
      const { error } = await db.from('productos').update({ promocionado: e.target.checked }).eq('id', p.id);
      toast(error ? 'No se ha podido guardar: ' + error.message : (e.target.checked ? 'Se promociona en las ' + TT('visita', 'p', '', 'l', 'l') : 'Ya no se promociona'), !!error);
      if (!error) PROMO_PRODS = null;
    };
  }, 140);
  return x;
}

// Producto: es un equipo y cada cuánto se revisa
function editorProductoBase6(p, ...r) {
  const x = editorProductoBase5.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !planIncluyeSeccion('parque') || !$('dbody') || !$('prok') || $('prequipo') || !p || !p.id) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    const { data: m } = await db.from('productos').select('es_equipo,revision_meses').eq('id', p.id).maybeSingle();
    if (!$('dbody') || $('prequipo') || !m) return;
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prequipo"><h3>Equipo</h3>
      <label class="opt"><input type="checkbox" id="preqc" ${m.es_equipo ? 'checked' : ''}> Es un equipo: se instala con su número de serie</label>
      <div class="${m.es_equipo ? '' : 'hide'}" id="preqd"><label for="preqr">Revisión cada (meses; 0 = sin revisiones)</label><input id="preqr" type="number" min="0" max="120" step="1" value="${+m.revision_meses || 0}" style="max-width:140px"></div>
      <p class="sm">Al confirmar un pedido con este producto se pide el número de serie de cada unidad y queda en el parque instalado del cliente.</p></div>`);
    const guardar = async () => {
      $('preqd').classList.toggle('hide', !$('preqc').checked);
      const { error } = await db.from('productos').update({ es_equipo: $('preqc').checked, revision_meses: Math.min(120, Math.max(0, Math.floor(+$('preqr').value || 0))) }).eq('id', p.id);
      toast(error ? 'No se ha podido guardar: ' + error.message : 'Equipo: guardado', !!error);
    };
    $('preqc').onchange = guardar; $('preqr').onchange = guardar;
  }, 160);
  return x;
}

// Ficha del producto: el material para presentar
function editorProductoBase7(p, ...r) {
  const x = editorProductoBase6.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !$('dbody') || !$('prok') || $('prmat') || !p || !p.id) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    const l = (await presMateriales(true)).filter(m => m.producto_id === p.id);
    if (!$('dbody') || $('prmat') || !$('prok')) return;
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prmat"><h3>Material para presentar</h3>
      <p class="sm">Imágenes o PDF (fichas técnicas, estudios, catálogo) que se enseñan a pantalla completa al registrar ${esc(TT('visita', 's', 'una', 'l', 'l'))}. Hasta 8 MB cada uno. Con «Para los centros», los centros que tienen el producto lo descargan desde su portal.</p>
      <div class="prmatl" id="prmatl"></div>
      <label class="btn sec prmatadd">+ Añadir imagen o PDF<input type="file" id="prmatf" accept="image/*,application/pdf" data-fp="1" multiple hidden></label></div>`);
    const pinta = lista => {
      $('prmatl').innerHTML = lista.length ? lista.map(m => `<div class="prmati"><span>${m.tipo === 'application/pdf' ? 'PDF' : 'Imagen'} · ${esc(m.nombre)}</span><label class="prmatpp"><input type="checkbox" data-prmatpp="${m.id}" ${m.para_portal ? 'checked' : ''}> Para los centros</label>
          <button type="button" class="lnk" data-prmatver="${m.id}">Ver</button><button type="button" class="lnk" data-prmatdel="${m.id}" aria-label="Quitar ${esc(m.nombre)}">Quitar</button></div>`).join('')
        : '<p class="sm">Todavía no tiene material.</p>';
      $('prmatl').querySelectorAll('[data-prmatver]').forEach(b => b.onclick = async () => {
        await presMateriales(); presentarSolo(p, b.dataset.prmatver);
      });
      $('prmatl').querySelectorAll('[data-prmatdel]').forEach(b => b.onclick = async () => {
        const m = lista.find(y => y.id === b.dataset.prmatdel); if (!m) return;
        if (!await preguntar(`Se quita «${m.nombre}» del material de este producto.`, { titulo: '¿Quitar el material?', ok: 'Quitar', peligro: true })) return;
        const { error } = await db.from('producto_materiales').delete().eq('id', m.id);
        if (error) { toast('No se ha podido quitar: ' + error.message, true); return; }
        PRES_DATOS.delete(m.id); pinta((await presMateriales(true)).filter(y => y.producto_id === p.id)); toast('Material quitado');
      });
    };
    pinta(l);
    $('prmatf').onchange = async e => {
      const fs = [...e.target.files]; e.target.value = '';
      let n = 0, orden = l.length;
      for (const f of fs) {
        let a = null;
        if (f.type === 'application/pdf') {
          if (f.size > PRES_MAX) { toast(`«${f.name}» pesa más de 8 MB`, true); continue; }
          a = { nombre: f.name, tipo: f.type, tamano: f.size, datos: await aBase64(f) };
        } else if (/^image\//.test(f.type)) a = await leerJustificante(f);
        else { toast(`«${f.name}» no es una imagen ni un PDF`, true); continue; }
        if (!a) continue;
        const { error } = await db.from('producto_materiales').insert({ producto_id: p.id, nombre: a.nombre, tipo: a.tipo, tamano: a.tamano, datos: a.datos, orden: orden++ });
        if (error) { toast(`No se ha podido subir «${f.name}»: ${error.message}`, true); continue; }
        n++;
      }
      if (n) toast(n === 1 ? 'Material añadido' : `${n} archivos añadidos`);
      if ($('prmatl')) pinta((await presMateriales(true)).filter(y => y.producto_id === p.id));
    };
  }, 160);
  return x;
}

// Producto: packs para los centros y PVP de referencia
function editorProductoBase8(p, ...r) {
  const x = editorProductoBase7.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !$('dbody') || !$('prok') || $('prpacks') || !p || !p.id) return;
    const { data: d } = await db.from('productos').select('packs, pvp_recomendado').eq('id', p.id).maybeSingle();
    const ref = $('prmat') || $('dbody').querySelector('.acts:last-of-type'); if (!ref || $('prpacks')) return;
    let packs = (d && Array.isArray(d.packs) ? d.packs : []).map(k => ({ compra: +k.compra || 0, regalo: +k.regalo || 0 }));
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prpacks"><h3>Packs para los centros</h3>
      <p class="sm">Si pones packs, los centros piden este producto solo por packs desde su portal. El regalo va en el pedido como línea aparte al 100 % de descuento. El PVP de referencia (con IVA) sirve para enseñarles su margen.</p>
      <div id="prpkl"></div><button type="button" class="btn sec chico" id="prpkmas">+ Añadir pack</button>
      <div class="g2" style="margin-top:10px"><div><label for="prpkpvp">PVP de referencia (con IVA)</label><input id="prpkpvp" type="number" step="0.01" value="${d && d.pvp_recomendado != null ? +d.pvp_recomendado : ''}" placeholder="Sin indicar"></div></div>
      <span class="pcerr" id="prpkerr" hidden></span>
      <div class="prpkacts"><button type="button" class="btn sec" id="prpkok">Guardar packs</button></div></div>`);
    const leer = () => [...$('prpkl').querySelectorAll('.prpkf')].map(f => ({ compra: f.querySelector('[data-pkc]').value, regalo: f.querySelector('[data-pkg]').value }));
    const pinta = () => {
      $('prpkl').innerHTML = packs.length ? packs.map((k, i) => `<div class="prpkf"><label>Compra <input type="number" step="1" data-pkc value="${k.compra || ''}"></label>
          <label>Regalo <input type="number" step="1" data-pkg value="${k.regalo || 0}"></label><button type="button" class="pmhx" data-pkx="${i}" aria-label="Quitar este pack">✕</button></div>`).join('')
        : '<p class="sm">Sin packs: los centros lo piden por unidades.</p>';
      $('prpkl').querySelectorAll('[data-pkx]').forEach(b => b.onclick = () => { packs = leer(); packs.splice(+b.dataset.pkx, 1); pinta(); });
    };
    pinta();
    $('prpkmas').onclick = () => { packs = leer(); packs.push({ compra: '', regalo: 0 }); pinta(); };
    $('prpkok').onclick = async ev => {
      const l = leer().map(k => ({ compra: Number(k.compra), regalo: Number(k.regalo || 0) })), err = $('prpkerr');
      const malo = l.find(k => !Number.isInteger(k.compra) || k.compra < 1 || !Number.isInteger(k.regalo) || k.regalo < 0);
      const rep = l.some((k, i) => l.findIndex(y => y.compra === k.compra && y.regalo === k.regalo) !== i);
      const pv = $('prpkpvp').value === '' ? null : Number($('prpkpvp').value);
      const txt = malo ? 'Cada pack necesita una compra de 1 o más unidades y un regalo de 0 o más (números enteros).' : rep ? 'Hay dos packs iguales.' : pv != null && (!(pv >= 0) || isNaN(pv)) ? 'El PVP de referencia tiene que ser un importe de 0 o más.' : '';
      err.hidden = !txt; err.textContent = txt; if (txt) return;
      ev.target.disabled = true;
      const { error } = await db.from('productos').update({ packs: l.length ? l.sort((a, b) => a.compra - b.compra) : null, pvp_recomendado: pv }).eq('id', p.id);
      ev.target.disabled = false;
      if (error) { toast('No se han podido guardar los packs: ' + error.message, true); return; }
      packs = l; pinta(); toast(l.length ? `Packs guardados (${num(l.length)})` : 'Sin packs: se pide por unidades');
    };
  }, 0);
  return x;
}

function editorProducto(p, ...r) {
  const x = editorProductoBase8.call(this, p, ...r);
  setTimeout(() => {
    if (!p || !p.id || !puedeEliminarProducto() || !$('dbody') || !$('prok') || $('prelim')) return;
    // dentro de la fila de botones del editor: un bloque nuevo al final despistaría a los que buscan .acts:last-of-type
    const fila = $('prok').closest('.acts') || $('dbody').querySelector('.acts:last-of-type'); if (!fila) return;
    fila.insertAdjacentHTML('afterbegin', '<button type="button" class="btn sec dang prelimb" id="prelim">Eliminar producto</button>');
    $('prelim').onclick = async () => {
      if (!await preguntar('Si no se ha vendido nunca, se borra del todo, también su stock, sus lotes y sus compras. Si tiene ventas, muestras firmadas, intervenciones o equipos, deja de salir en todas partes pero se conserva para el histórico (los pedidos y las facturas siguen con su nombre) y se puede recuperar.',
        { titulo: `¿Eliminar «${p.nombre}»?`, ok: 'Eliminar', peligro: true })) return;
      const { data: res, error } = await db.rpc('eliminar_producto', { p_id: p.id });
      if (error || !res || !res.ok) {
        toast(res && res.error === 'stock' ? `Tiene ventas y ${num(res.unidades)} unidades en stock: sácalas o regulariza el stock antes de eliminarlo`
          : res && res.error === 'permiso' ? 'No tienes permiso para eliminar productos' : 'No se ha podido eliminar: ' + ((error && error.message) || (res && res.error) || ''), true);
        return;
      }
      if ($('dlg').open) $('dlg').close();
      if (res.modo === 'borrado') toast('Producto eliminado' + (res.detalle && +res.detalle.unidades ? ` con sus ${num(res.detalle.unidades)} unidades de stock` : ''));   // v2.324.0
      else toast('Producto eliminado de las listas · se conserva en el histórico (' + Object.entries(res.detalle || {}).map(([k, n]) => `${num(n)} ${PROD_USOS[k] || k}`).join(', ') + ')');
      refrescarProductos();
    };
  }, 0);
  return x;
}

function productoPorDefecto() {
  const lista = PRODUCTOS.filter(p => p.tipo !== 'servicio' && vendible(p));
  const hab = localStorage.getItem('dlc-prod-habitual');
  return (lista.find(p => p.id === hab) || lista[0] || {}).id || '';
}

function opcionesProducto(id, nombre) {
  // En los pedidos solo aparecen los productos activos (y el que ya tuviera la línea)
  const lista = PRODUCTOS.filter(p => (p.tipo !== 'servicio' && vendible(p)) || p.id === id);
  const falta = id && !lista.some(p => p.id === id);
  return (falta ? `<option value="${id}" selected>${esc(nombre || 'Producto del pedido')}</option>` : '') +
    lista.map(p => `<option value="${p.id}" ${p.id === id ? 'selected' : ''}>${esc(p.nombre)}${vendible(p) ? '' : ' (' + esc(p.estado.toLowerCase()) + ')'}</option>`).join('')
    || '<option value="">Sin productos activos</option>';
}

// Productos está en src/app/screens/products (v2.413.0). Estos nombres se quedan: el menú, la caché de pantallas (legado 057),
// los filtros de campos, Configuración, la ficha de la cuenta, «‹ Volver» (legado 089) y las pruebas los usan.
function cargarProductosModulo() { return window.delcos.screens.products.loadProductsModule(); }
function pintarProductos() { return window.delcos.screens.products.paintProducts(); }
function fichaStock(s) { return window.delcos.screens.products.showStock(s); }
function verDeposito(cuenta, nombre, aviso) { return window.delcos.screens.products.showDeposit(cuenta, nombre, aviso || ''); }
function pintarAlmacenes2() { return window.delcos.screens.products.paintStores(); }
function movimientoStock(s, tipo, loteId, almId) { return window.delcos.screens.products.stockMovement(s || null, tipo, loteId ? { batchId: loteId, storeId: almId } : undefined); }
