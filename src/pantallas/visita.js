// pantallas/visita.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Ficha · Material entregado y datos bajo cada visita del historial
async function fichaMaterialVisitas(id) {
  if (FICHA_ID !== id) return;
  // Material y datos bajo cada visita del historial
  $('fbody').querySelectorAll('[data-editv]').forEach(b => {
    let v; try { v = JSON.parse(b.dataset.editv); } catch (e) { return; }
    const t = detTxt(v); if (!t) return;
    const span = b.parentElement.querySelector(':scope > span');
    if (span && !span.querySelector('.vdet')) span.insertAdjacentHTML('beforeend', `<div class="sm vdet">📎 ${esc(t)}</div>`);
  });
}

function fichaVisitaHTML(m, cons, vis) {
  const fila = (ico, html, cls) => `<div class="fvfila ${cls || ''}"><span class="fvico">${svgIco(ICON_NOM[ico] || '')}</span><div>${html}</div></div>`;
  const c = consultaDeLaVisita(cons), hoy = hoyLetra(), filas = [];
  const NOMDIA = { L: 'lunes', M: 'martes', X: 'miércoles', J: 'jueves', V: 'viernes', S: 'sábado', D: 'domingo' };
  if (m.urgente) filas.push(fila('circle-alert', `<b>Urgente</b>${m.urgente_motivo ? ': ' + esc(m.urgente_motivo) : ''}`, 'fvurg'));
  if (c) {
    const donde = [c.planta, c.sala].map(x => String(x || '').trim()).filter(x => x && !/^[-–·.]+$/.test(x)).map(esc).join(' · ');   // v2.343.0: sin pastilla vacía
    filas.push(fila('building-2', `<b>${esc(c.centro_nombre || consultaPrivada())}</b>${donde ? `<span class="fvdonde">${donde}</span>` : ''}
      <div class="sm">${esc([c.direccion, [c.cp, c.municipio].filter(Boolean).join(' ')].filter(Boolean).join(', ')) || 'Sin dirección'}</div>
      ${c.lat ? `<button class="btn sec fvbtn" type="button" data-nav="${navAttr([c.lat, c.lon])}">${svgIco(ICON_NOM['map-pin'])} Cómo llegar</button>` : ''}`));
    // Cuándo: su horario de hoy en esta consulta (o el próximo día que atiende) y el horario del centro
    const d = c.dias || {}, orden = 'LMXJVSD', h = d[hoy];
    const prox = h ? null : [...orden.slice(orden.indexOf(hoy) + 1), ...orden.slice(0, orden.indexOf(hoy) + 1)].find(k => d[k]);
    const cen = (c.horario_centro || {})[hoy];
    filas.push(fila('clock', `${h ? `<b>Hoy atiende: ${esc(h)}</b>` : prox ? `Hoy no atiende aquí · el ${NOMDIA[prox]}: ${esc(d[prox])}` : 'Sin horario de atención'}
      ${cen ? `<div class="sm">Centro abierto hoy: ${esc(cen)}</div>` : ''}
      <div class="dias fvdias">${['L', 'M', 'X', 'J', 'V'].map(k => `<span class="${d[k] ? 'on' : ''} ${k === hoy ? 'hoy' : ''}" title="${esc(d[k] || '')}">${k}</span>`).join('')}</div>`));
    if (c.indicaciones) filas.push(fila('info', `<b>Cómo llegar dentro:</b> ${esc(c.indicaciones)}`, 'fvind'));
  } else filas.push(fila('building-2', `<span class="sm">Sin ${TT('consulta', 's', '', 'l', 'l')} registrada: añádela en «Editar ficha».</span>`));
  // Lo último que pasó y lo que quedó pendiente
  const ult = (vis || [])[0];
  if (ult) {
    const mat = detTxt(ult);
    filas.push(fila('notebook-pen', `<b>Última ${TT('visita', 's', '', 'l', 'l')}: ${fechaCorta(ult.fecha)}</b> · ${esc((ult.resultados || []).join(' + ') || 'Sin resultado')}
      ${ult.nota ? `<div class="sm">${esc(ult.nota)}</div>` : ''}${mat ? `<div class="sm">Material: ${esc(mat)}</div>` : ''}`));
  }
  const pend = (vis || []).find(v => v.proxima_accion || v.proxima_fecha);
  if (pend) {
    const f = pend.proxima_fecha, hoyIso = hoyISO();
    const est = !f ? '' : f < hoyIso ? '<span class="pill p-bor">Atrasada</span>' : f === hoyIso ? '<span class="pill p-est">Hoy</span>' : '';
    filas.push(fila('clipboard-list', `<b>Pendiente:</b> ${esc(pend.proxima_accion || 'Volver a ' + TT('visita', 's', '', 'l', 'l'))}${f ? ` · ${fechaCorta(f)}` : ''} ${est}`));
  }
  if (m.nota) filas.push(fila('message-circle', `<b>Notas:</b> ${esc(m.nota)}`));
  const tels = [m.telefono, c && c.telefono].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i);
  if (tels.length || m.contacto) filas.push(fila('phone', `${tels.map(t => `<a href="tel:${esc(t.replace(/\s+/g, ''))}"><b>${esc(t)}</b></a>`).join(' · ')}
    ${m.contacto ? `<div class="sm">${esc(m.contacto)}</div>` : ''}`));
  return `<section class="fvis" aria-label="Para la ${TT('visita', 's', '', 'l', 'l')}"><h3>Para la ${TT('visita', 's', '', 'l', 'l')}</h3>${filas.join('')}</section>`;
}

// Registrar visita · Aviso si el médico no tiene horario de atención
async function visitaAvisoHorario(id) {
  if (!$('vguardar') || !await faltaHorario(id) || $('vhorario')) return;
  const fh = $('dbody').querySelector('.fh');
  if (fh) fh.insertAdjacentHTML('afterend', `<div class="avisoh" id="vhorario"><span>⚠ Falta su horario de atención. Aprovecha ${TT('visita', 's', 'el', 'l', 'l')} para preguntarlo
    y complétalo después en <b>Editar ficha</b>.</span></div>`);
}

async function guardarAvisoRevisita(v) {
  const prefs = Object.assign({}, PERFIL.preferencias || {});
  prefs.avisos = Object.assign({}, prefs.avisos || {}, { revisita: v });
  const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
  if (error) { toast('No se ha podido guardar', true); return false; }
  PERFIL.preferencias = data || prefs;
  return true;
}

async function editorMuestras() {
  await Promise.all([cargarAjustes(), cargarProductos()]);
  const m = Object.assign({ producto_id: null, restar_stock: false }, AJUSTES.muestras || {});
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Muestras y stock</h2><div class="sm">Qué pasa con el stock cuando se registran muestras en ${TT('visita', 's', 'un', 'l', 'l')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label class="opt" style="margin-top:10px"><input type="checkbox" id="murest" ${m.restar_stock ? 'checked' : ''}>
      <span><b>Restar las muestras del stock</b><br><span class="sm">Salen del maletín de quien registra ${TT('visita', 's', 'el', 'l', 'l')} o, si no tiene, del almacén central, por lote y caducidad.</span></span></label>
    <label for="muprod">Producto de las muestras</label><select id="muprod"><option value="">—</option>${PRODUCTOS.map(p => `<option value="${p.id}" ${p.id === m.producto_id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="muok">Guardar</button></div>`;
  $('dlg').showModal();
  $('muok').onclick = async () => {
    if ($('murest').checked && !$('muprod').value) { toast('Elige el producto de las muestras', true); return; }
    const { error } = await db.rpc('guardar_ajuste', { p_clave: 'muestras', p_valor: { producto_id: $('muprod').value || null, restar_stock: $('murest').checked } });
    if (error) { toast('No se ha podido guardar', true); return; }
    $('dlg').close(); toast('Guardado');
  };
}

async function leerFotoVisita(f) {
  if (!/^image\//.test(f.type)) { toast('Elige una foto', true); return null; }
  return leerJustificante(f);
}

function pintarFotosVisita(caja, fotos, quitar) {
  caja.innerHTML = fotos.map((f, i) => `<span class="vfoto"><img alt="Foto ${i + 1}" src="data:${f.tipo};base64,${f.datos}">
    ${quitar ? `<button type="button" class="vfquitar" data-vfq="${i}" aria-label="Quitar la foto">✕</button>` : ''}</span>`).join('');
  if (quitar) caja.querySelectorAll('[data-vfq]').forEach(b => b.onclick = () => quitar(+b.dataset.vfq));
}

async function subirFotosVisita(actividad, fotos) {
  for (const f of fotos) {
    const { error } = await db.from('actividad_fotos').insert({ actividad_id: actividad, nombre: f.nombre, tipo: f.tipo, tamano: f.tamano, datos: f.datos });
    if (error) { toast(`${TT('visita', 's', '', 'l', 'C', 'guardado')}, pero no se ha podido subir una foto: añádela desde su historial`, true); return false; }
  }
  return true;
}

async function verFotosVisita(actividad, cuenta) {
  const { data, error } = await db.from('actividad_fotos').select('id,nombre,tipo,datos,creado_por').eq('actividad_id', actividad).order('creado_en');
  if (error) { toast('No se han podido abrir las fotos', true); return; }
  const l = data || [];
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>Fotos de ${TT('visita', 's', 'el', 'l', 'l')}</h2><div class="sm">${l.length ? (l.length === 1 ? '1 foto' : l.length + ' fotos') : 'Todavía no hay fotos'}</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <div class="vfotos grande">${l.map(f => `<span class="vfoto"><img alt="${esc(f.nombre || 'Foto')}" src="data:${esc(f.tipo)};base64,${f.datos}">
      ${f.creado_por === PERFIL.id || puede('administrar') ? `<button type="button" class="vfquitar" data-vfdel="${f.id}" aria-label="Borrar la foto">✕</button>` : ''}</span>`).join('')}</div>
    <div class="acts" style="justify-content:flex-end"><label class="btn sec" style="display:inline-flex">${svgIco(ICON_NOM.camera)} Añadir foto<input type="file" id="vfmas" accept="image/*" data-fp="1" hidden multiple></label>
      <button type="button" class="btn" data-cerrar2>Hecho</button></div>`;
  $('dlg2body').querySelectorAll('[data-vfdel]').forEach(b => b.onclick = async () => {
    if (!await preguntar('La foto desaparece de ' + TT('visita', 's', 'este', 'l', 'l') + '.', { titulo: '¿Borrar la foto?', ok: 'Borrar', peligro: true })) return;
    const { error: e2 } = await db.from('actividad_fotos').delete().eq('id', b.dataset.vfdel);
    if (e2) { toast('No se ha podido borrar', true); return; }
    toast('Foto borrada'); verFotosVisita(actividad, cuenta); if (FICHA_ID === cuenta) abrirFicha(cuenta);
  });
  $('vfmas').onchange = async e => {
    const nuevas = [];
    for (const f of [...e.target.files].slice(0, Math.max(0, FOTOS_VISITA_MAX - l.length))) { const j = await leerFotoVisita(f); if (j) nuevas.push(j); }
    if (e.target.files.length > FOTOS_VISITA_MAX - l.length) toast(`Como mucho ${FOTOS_VISITA_MAX} fotos por ${TT('visita', 's', '', 'l', 'l')}`, true);
    if (!nuevas.length) return;
    if (await subirFotosVisita(actividad, nuevas)) { toast(nuevas.length === 1 ? 'Foto añadida' : 'Fotos añadidas'); verFotosVisita(actividad, cuenta); if (FICHA_ID === cuenta) abrirFicha(cuenta); }
  };
  if (!$('dlg2').open) $('dlg2').showModal();
}

// Ficha y resultados de la visita: de la red y, sin ella, de la copia guardada
async function visitaDatos(id) {
  const [f, c] = await Promise.all([rpcCache('ficha_cuenta', { p_id: id }, 'ficha-' + id), rpcCache('clasificadores_actividad', { p_cuenta: id }, 'clasact-' + id)]);
  let clas = c && c.data;
  if (clas && !c.cache) { try { guardarCache('clasact', clas); } catch (e) {} }
  if (!clas) { const g = leerCache('clasact'); clas = g && g.d; }
  return [{ data: f && f.data, error: f && f.data ? null : { message: navigator.onLine ? 'no se ha podido leer la ficha' : 'sin conexión y sin copia de esta ficha en el móvil' } }, { data: clas || [] }];
}

async function presMateriales(forzar) {
  if (PRES_MAT && !forzar && Date.now() - PRES_T < 300000) return PRES_MAT;
  if (!navigator.onLine) return PRES_MAT || [];
  try {
    const { data, error } = await db.from('producto_materiales').select('id,producto_id,nombre,tipo,orden,para_portal').order('orden').order('creado_en');
    if (!error) { PRES_MAT = data || []; PRES_T = Date.now(); }
  } catch (e) {}
  return PRES_MAT || [];
}

function presBlob(m, datos) {
  const bin = atob(String(datos).replace(/^data:[^,]*,/, '')), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([u], { type: m.tipo }));
}

async function presentarProducto(prod) {
  const l = (PRES_MAT || []).filter(m => m.producto_id === prod); if (!l.length) return;
  // Enseñarlo lo marca como presentado
  const chip = document.querySelector(`#vprods [data-vprod="${prod}"]`);
  if (chip && chip.getAttribute('aria-pressed') !== 'true') chip.click();
  presAbrir(chip ? chip.textContent.trim() : 'Presentación', l, 0);
}

// La ventana a pantalla completa (desde la visita o desde la ficha del producto)
function presAbrir(titulo, l, i) {
  let d = $('presenta');
  if (!d) { document.body.insertAdjacentHTML('beforeend', '<dialog id="presenta" class="presdlg" aria-label="Presentación"></dialog>'); d = $('presenta'); }
  d.innerHTML = `<div class="prescab"><b>${esc(titulo)}</b><span class="sm" id="presn"></span><button type="button" class="x" id="prescerrar" aria-label="Cerrar">✕</button></div>
    <div class="prescuerpo" id="prescuerpo"></div>
    <button type="button" class="presnav ant" id="presant" aria-label="Anterior">‹</button><button type="button" class="presnav sig" id="pressig" aria-label="Siguiente">›</button>`;
  PRES = { l, i, urls: [] };
  $('prescerrar').onclick = () => presCerrar();
  $('presant').onclick = () => presIr(-1); $('pressig').onclick = () => presIr(1);
  d.oncancel = e => { e.preventDefault(); presCerrar(); };
  d.onkeydown = e => { if (e.key === 'ArrowRight') presIr(1); if (e.key === 'ArrowLeft') presIr(-1); };
  d.showModal();
  presPintar();
}

function presIr(n) { if (!PRES) return; const i = PRES.i + n; if (i < 0 || i >= PRES.l.length) return; PRES.i = i; presPintar(); }

async function presPintar() {
  const P = PRES; if (!P) return;
  const m = P.l[P.i], caja = $('prescuerpo'); if (!caja) return;
  $('presn').textContent = P.l.length > 1 ? `${P.i + 1} de ${P.l.length} · ${m.nombre}` : m.nombre;
  $('presant').disabled = P.i === 0; $('pressig').disabled = P.i === P.l.length - 1;
  let datos = PRES_DATOS.get(m.id);
  if (!datos) {
    cargando(caja, 'Cargando…');
    if (!navigator.onLine) { caja.innerHTML = '<p class="vacio">Sin conexión: este material se podrá ver cuando vuelva la conexión.</p>'; return; }
    const { data, error } = await db.from('producto_materiales').select('datos').eq('id', m.id).maybeSingle();
    if (PRES !== P || P.l[P.i] !== m) return;
    if (error || !data) { caja.innerHTML = `<p class="vacio">No se ha podido cargar: ${esc((error && error.message) || 'no está')}</p>`; return; }
    datos = data.datos; PRES_DATOS.set(m.id, datos);
  }
  if (PRES !== P || P.l[P.i] !== m) return;
  const url = presBlob(m, datos); P.urls.push(url);
  caja.innerHTML = m.tipo === 'application/pdf'
    ? `<iframe class="prespdf" src="${url}" title="${esc(m.nombre)}"></iframe>`
    : `<img class="presimg" src="${url}" alt="${esc(m.nombre)}">`;
}

function presCerrar() {
  if (PRES) PRES.urls.forEach(u => URL.revokeObjectURL(u));
  PRES = null;
  const d = $('presenta'); if (d && d.open) d.close();
}

// Ver un material desde la ficha del producto (sin marcar nada como presentado)
function presentarSolo(p, idm) {
  const l = (PRES_MAT || []).filter(m => m.producto_id === p.id); if (!l.length) return;
  presAbrir(p.nombre || 'Material', l, Math.max(0, l.findIndex(m => m.id === idm)));
}

const esMuestras = d => (CAT.resultado_visita || []).some(x => x.valor === d.valor && x.papel === 'muestras');

/* v2.191.0 · Visita a distancia y fotos de la visita (primera tanda del estudio por sectores, SQL 118).
   - Al registrar una visita se elige cómo fue: Presencial (por defecto), Por teléfono o Por videollamada (actividades.modo). En el historial
     de la ficha, las que no son presenciales lo dicen.
   - Fotos de la visita (lineal, exposición, material colocado…): se reducen a 1600 px en JPEG como los justificantes y se guardan en
     actividad_fotos al registrar la visita. Sin conexión la visita se guarda igual y las fotos se añaden después desde su historial
     («📷 Fotos»), donde también se ven y se borran. */
const MODOS_VISITA = [['presencial', 'Presencial'], ['telefono', 'Teléfono'], ['video', 'Videollamada']];

let VISITA_ACTUAL = null;   // { id, modo, fotos } de la ventana «Registrar visita» abierta

/* v2.192.0 · Muestras con control legal (primera tanda del estudio por sectores, SQL 119; RD 1416/1994, art. 16).
   - Producto: «Muestra con control legal» con fecha de autorización (se pueden dar los 2 años siguientes) y máximo por profesional y año.
   - Registrar visita: si la empresa tiene productos regulados, bloque «Muestras de medicamento» con lo que queda este año para ese
     profesional; si se entrega alguna, pide la firma (con el dedo o el ratón) y el nombre de quien firma. Se comprueba antes de guardar
     la visita; después, registrar_muestras guarda todo o nada (también desde la cola sin conexión, enlazada por el op_id de la visita).
   - Ficha: «Muestras este año» con lo entregado y lo que queda de cada producto regulado. */
const MUESTRA_ERR = { firma: 'Falta la firma de quien recibe las muestras', profesional: 'Las muestras solo se entregan a profesionales, no a un centro',
  plazo: 'Ese producto ya no se puede dar como muestra (han pasado 2 años desde su autorización)', limite: 'Se pasa del máximo de muestras de este año',
  permiso: 'No puedes registrar muestras de esta ficha', producto: 'Producto no encontrado', no_existe: 'Ficha no encontrada' };

const muestraError = r => (MUESTRA_ERR[r && r.error] || 'No se han podido guardar las muestras') +
  (r && r.error === 'limite' ? ` (${r.producto}: quedan ${r.quedan} de ${r.max})` : r && r.error === 'plazo' ? ` (${r.producto})` : '');

/* ============================================================
   v2.259.0 · Visita sin conexión (pendiente de la auditoría del 8/10, cerrado el 11/10/2026). Antes, sin cobertura la ventana
   «Registrar visita» ni se abría; si la red caía al guardar, la visita podía rechazarse al reenviarla otro día (por la fecha) y
   perderse sin aviso, o duplicarse al repetir. Ahora:
   - La visita se abre sin conexión con la última copia de la ficha (la misma de la ficha) y de sus resultados, y los catálogos
     quedan guardados en el móvil.
   - Al guardar sin conexión: a la cola con «sin conexión» (el servidor no la rechaza por la fecha), con el mismo op_id aunque se
     repita, y las fotos se guardan en el móvil (IndexedDB) y se suben solas cuando se envía la visita.
   - «Tu día» marca la cita «Registrada en el móvil · pendiente de enviar» y quita «Registrar».
   - La cola se envía de una en una (sin dos envíos a la vez); lo que el servidor rechaza no se pierde: queda en «sin enviar», con
     aviso y la opción de reintentar o descartar; el tiempo agotado cuenta como fallo de red.
   - Sin conexión, la app arranca con el perfil guardado aunque no pueda comprobar la sesión.
   - Las muestras siguen necesitando conexión (el límite legal se comprueba en el servidor): la ventana lo avisa.
   ============================================================ */
let VISITA_OP = null;   // op_id de la ventana abierta (el mismo si se pulsa Guardar dos veces)

/* ============================================================
   v2.266.0 · Presentaciones de producto en la visita (grupo 4 del plan del 11/10/2026; necesita el SQL 143).
   - Ficha del producto (administración): «Material para presentar», imágenes o PDF (fichas técnicas, estudios, catálogo).
   - «Registrar visita»: bajo «Productos presentados», «Presentar» con los productos que tienen material; se ve a pantalla completa
     (con flechas y teclado) y el producto queda marcado como presentado (cuenta en la cobertura del ciclo).
   - El material se descarga al enseñarlo y se queda en memoria mientras la app está abierta; sin conexión, solo lo ya visto.
   ============================================================ */
const PRES_MAX = 8 * 1024 * 1024;

const PRES_DATOS = new Map();               // id → datos (base64) ya descargados
