// pantallas/visita.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Ficha · Material entregado y datos bajo cada visita del historial

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

/* v2.96.0 · «Para la visita»: lo que hace falta al llegar, arriba del todo.
   Dónde (centro, planta, sala, cómo llegar), cuándo (su horario de hoy y el del centro), cómo entrar,
   lo que quedó pendiente en la última visita, las notas y a quién llamar. Las ventas van al final. */
// La consulta de la visita: la que tiene consulta hoy; si ninguna, la principal
function consultaDeLaVisitaBase(cons) {
  const hoy = hoyLetra();
  return (cons || []).find(c => (c.dias || {})[hoy]) || (cons || [])[0] || null;
}

async function editarVisitaBase(v, medicoId) {
  const pos = CAT.resultado_visita.filter(r => r.extra !== 'neg'), neg = CAT.resultado_visita.filter(r => r.extra === 'neg');
  const marcados = v.resultados || [];
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Editar ${TT('visita', 's', '', 'l', 'l')}</h2><div class="sm">Registrada el ${fechaCorta(v.fecha)}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2">
      <div><label for="evf">Fecha</label><input id="evf" type="date" value="${esc(v.fecha)}"></div>
      <div><label for="evm">Muestras</label><input id="evm" type="number" min="0" value="${v.muestras || 0}"></div>
    </div>
    <label>Resultado</label>
    <div class="opciones">${pos.map(r => `<button type="button" class="opt" data-res="${esc(r.valor)}"
      aria-pressed="${marcados.includes(r.valor)}"><span class="mk"></span>${esc(r.valor)}</button>`).join('')}</div>
    <div class="opciones" style="margin-top:8px">${neg.map(r => `<button type="button" class="opt neg" data-res="${esc(r.valor)}" data-neg="1"
      aria-pressed="${marcados.includes(r.valor)}"><span class="mk"></span>${esc(r.valor)}</button>`).join('')}</div>
    <div class="g2" style="margin-top:6px">
      <div><label for="evpa">Próxima acción</label><input id="evpa" value="${esc(v.proxima_accion || '')}"></div>
      <div><label for="evpf">Fecha</label><input id="evpf" type="date" value="${esc(v.proxima_fecha || '')}"></div>
    </div>
    <label for="evn">Nota</label><textarea id="evn" rows="3">${esc(v.nota || '')}</textarea>
    <div class="acts" style="justify-content:space-between">
      <button class="btn sec dang" id="evborrar">Borrar ${TT('visita', 's', '', 'l', 'l')}</button>
      <span class="acts" style="margin:0"><button class="btn sec" data-cerrar>Cancelar</button>
        <button class="btn" id="evok">Guardar</button></span></div>`;

  $('dbody').querySelectorAll('[data-res]').forEach(b => b.onclick = () => {
    const esNeg = b.dataset.neg === '1', on = b.getAttribute('aria-pressed') === 'true';
    $('dbody').querySelectorAll('[data-res]').forEach(x => { if (esNeg || x.dataset.neg === '1') x.setAttribute('aria-pressed', 'false'); });
    b.setAttribute('aria-pressed', String(!on));
  });

  $('evok').onclick = async ev => {
    const res = [...$('dbody').querySelectorAll('[data-res][aria-pressed=true]')].map(b => b.dataset.res);
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    const { data: r, error } = await db.rpc('actualizar_actividad', { p: {
      id: v.id, fecha: $('evf').value, resultados: res, muestras: +$('evm').value || 0,
      nota: $('evn').value.trim(), proxima_accion: $('evpa').value.trim(), proxima_fecha: $('evpf').value || ''
    }});
    ev.target.disabled = false; ev.target.textContent = 'Guardar';
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    $('dlg').close(); toast(`${TT('visita', 's', '', 'l', 'C', 'actualizado')}`); abrirFicha(medicoId); cargarInicio();
  };

  $('evborrar').onclick = async () => {
    if (!await preguntar(`${TT('visita', 's', 'el', 'C', 'l')} desaparece del historial ${TT('medico', 's', 'del', 'l', 'l')}.\nQueda constancia en la auditoría.`,
      { titulo: `¿Borrar ${TT('visita', 's', 'el', 'l', 'l')}?`, ok: 'Borrar', peligro: true })) return;
    const { data: r, error } = await db.rpc('borrar_actividad', { p_id: v.id });
    if (error || (r && r.ok === false)) { toast('No se ha podido borrar', true); return; }
    $('dlg').close(); toast(`${TT('visita', 's', '', 'l', 'C', 'borrado')}`); abrirFicha(medicoId); cargarInicio();
  };
  $('dlg').showModal();
}

/* Registrar visita: la ventana base y el aviso si falta el horario de atención (antes eran 3 capas). */
async function abrirVisitaBase2(id) {
  return ventanaCargando(async () => {
    await abrirVisitaBase(id);
    await visitaAvisoHorario(id);
  });
}

// Médico «sin reporting»: la ventana de visita no ofrece los resultados de reporting
async function abrirVisita(id, ...a) {
  const r = await abrirVisitaBase2.call(this, id, ...a);
  try {
    const { data } = await db.from('cuentas').select('sin_reporting').eq('id', id).maybeSingle();
    const d = $('dlg');
    if (data && data.sin_reporting && d && d.open) {
      let n = 0;
      d.querySelectorAll('.chips button, [data-res], .chip').forEach(b => { if (/reporting/i.test(b.textContent)) { b.style.display = 'none'; n++; } });
      if (n && !d.querySelector('.srnota')) {
        const ch = d.querySelector('.chips, [data-res]'); const cont = ch && (ch.classList.contains('chips') ? ch : ch.parentElement);
        if (cont) cont.insertAdjacentHTML('afterend', `<p class="sm srnota">${TT('medico', 's', 'este', 'C', 'l')} no quiere reporting: solo ${TT('visita', 's', '', 'l', 'l')} presencial.</p>`);
      }
    }
  } catch (e) { /* si no se puede comprobar, la ventana queda como siempre */ }
  return r;
}

// La consulta de la visita: la del centro de la cita; si no, la que tiene consulta hoy; si no, la principal
function consultaDeLaVisita(cons) {
  const pref = FICHA_CENTRO ? clasNorm(FICHA_CENTRO) : '';
  return (pref && (cons || []).find(c => clasNorm(c.centro_nombre) === pref)) || consultaDeLaVisitaBase(cons);
}

async function editarVisita(v, ...r) {
  const res = await editarVisitaBase.call(this, v, ...r);
  try {
    const ok = $('evok'), d = $('dbody'); if (!ok || !d || $('evmodo')) return res;
    const { data: act } = await db.from('actividades').select('modo,productos').eq('id', v.id).maybeSingle();
    const modo = (act && act.modo) || 'presencial', sel = (act && act.productos) || [];
    let prods = [];
    if (planIncluyeSeccion('cobertura')) { prods = await productosPromocionados(); const falta = sel.filter(id => !prods.some(p => p.id === id));
      if (falta.length) { const { data: x } = await db.from('productos').select('id,nombre').in('id', falta); prods = prods.concat(x || []); } }
    if (!$('evok') || $('evmodo')) return res;
    EV_EXTRA = { id: v.id, modo, productos: sel.slice() };
    const ancla = $('evf') ? $('evf').closest('.g2') : null; if (!ancla) return res;
    ancla.insertAdjacentHTML('afterend', `<label>Cómo fue</label>
      <div class="segs" id="evmodo" role="group" aria-label="Cómo fue">${MODOS_VISITA.map(([k, t]) => `<button type="button" data-evmodo="${k}" class="${k === modo ? 'on' : ''}" aria-pressed="${k === modo}">${t}</button>`).join('')}</div>
      ${prods.length ? `<label>Productos presentados</label><div class="opciones" id="evprods">${prods.map(p => `<button type="button" class="opt" data-evprod="${p.id}" aria-pressed="${sel.includes(p.id)}"><span class="mk"></span>${esc(p.nombre)}</button>`).join('')}</div>` : ''}`);
    d.querySelectorAll('[data-evmodo]').forEach(b => b.onclick = () => { EV_EXTRA.modo = b.dataset.evmodo; d.querySelectorAll('[data-evmodo]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); });
    d.querySelectorAll('[data-evprod]').forEach(b => b.onclick = () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); EV_EXTRA.productos = [...d.querySelectorAll('[data-evprod][aria-pressed=true]')].map(x => x.dataset.evprod); });
  } catch (e) {}
  return res;
}

/* Parte base; abrirVisita le añade el resto */
async function abrirVisitaBaseBase(id) {
  const [{ data, error }, { data: clas }] = (VISITA_OP = null, await visitaDatos(id));   // v2.259.0: sin red, con la copia guardada   // v2.179.0: con la ficha, marca los resultados que no tocan en su estado
  if (error) { toast('No se ha podido abrir: ' + error.message, true); return; }
  const m = data.medico, cons = data.consultas || [];
  const grupos = (clas || []).filter(c => (c.valores || []).length);
  const res = grupos.find(c => c.papel === 'resultado_visita') || { clave: '', papel: 'resultado_visita', nombre: 'Resultado', valores: CAT.resultado_visita || [] };
  const otros = grupos.filter(c => c !== res);
  const idx = {};   // clave del botón → { clasificador, valor }
  const boton = (c, v, neg) => {
    const k = c.clave + '::' + v.valor; idx[k] = { c: c.clave, v };
    return `<span class="optw"${v.oculto ? ' data-oculto="1"' : ''}><button type="button" class="opt ${neg ? 'neg' : ''}" data-vk="${esc(k)}" ${c === res ? `data-res="${esc(v.valor)}"` : ''} ${neg ? 'data-neg="1"' : ''} aria-pressed="false">
      <span class="mk"></span>${esc(v.valor)}${v.dato_tipo ? ' <span class="datom">+ dato</span>' : ''}</button>
      ${v.dato_tipo ? `<span class="datobox hide" data-box="${esc(k)}">${campoDato(v, k)}</span>` : ''}</span>`;
  };

  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Registrar ${TT('visita', 's', '', 'l', 'l')}</h2><div class="sm">${esc(m.nombre)}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2">
      <div><label for="vf">Fecha</label><input id="vf" type="date" value="${hoyISO()}"></div>
      <div><label for="vc">Centro ${TT('visita', 's', 'del', 'l', 'l')}</label><select id="vc">
        ${cons.map(c => `<option value="${c.id}">${esc(c.centro_nombre || consultaPrivada())}${c.municipio ? ' · ' + esc(c.municipio) : ''}</option>`).join('')}
      </select></div>
    </div>
    <label>Resultado <span class="sm">· puedes marcar varios de «${TT('visita', 's', '', 'l', 'l', 'realizado')}»</span></label>
    <div class="opciones">${res.valores.filter(v => v.extra !== 'neg').map(v => boton(res, v, false)).join('')}</div>
    <div class="opciones" style="margin-top:8px">${res.valores.filter(v => v.extra === 'neg').map(v => boton(res, v, true)).join('')}</div>
    ${otros.map(c => `<label>${esc(c.nombre)}${c.descripcion ? ` <span class="sm">· ${esc(c.descripcion)}</span>` : ''}</label>
      <div class="opciones">${c.valores.map(v => boton(c, v, false)).join('')}</div>`).join('')}
    <div class="g2" style="margin-top:6px">
      <div><label for="vpa">Próxima acción</label><input id="vpa" placeholder="p. ej. Llevar reporting"></div>
      <div><label for="vpf">Fecha de la próxima acción</label><input id="vpf" type="date"></div>
    </div>
    <label for="vn">Nota</label><textarea id="vn" rows="3"></textarea>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="vguardar">Guardar ${TT('visita', 's', '', 'l', 'l')}</button>
    </div>`;

  $('dbody').querySelectorAll('[data-vk]').forEach(b => b.onclick = () => {
    const k = b.dataset.vk, info = idx[k], on = b.getAttribute('aria-pressed') === 'true';
    if (info.c === res.clave) {
      const esNeg = b.dataset.neg === '1';
      $('dbody').querySelectorAll('[data-res]').forEach(x => {
        if ((esNeg || x.dataset.neg === '1') && x !== b) {
          x.setAttribute('aria-pressed', 'false');
          const bx = $('dbody').querySelector(`[data-box="${CSS.escape(x.dataset.vk)}"]`); if (bx) bx.classList.add('hide');
        }
      });
    }
    b.setAttribute('aria-pressed', String(!on));
    const box = $('dbody').querySelector(`[data-box="${CSS.escape(k)}"]`);
    if (box) { box.classList.toggle('hide', on); if (!on) { const i = box.querySelector('input, select'); if (i) setTimeout(() => i.focus(), 30); } }
  });

  $('vguardar').onclick = async ev => {
    const marcados = [...$('dbody').querySelectorAll('[data-vk][aria-pressed=true]')].map(b => b.dataset.vk);
    const resultados = marcados.filter(k => idx[k].c === res.clave).map(k => idx[k].v.valor);
    if (!resultados.length) { toast('Elige al menos un resultado', true); return; }
    const detalles = marcados.map(k => {
      const el = $('dbody').querySelector(`[data-dato="${CSS.escape(k)}"]`);
      const d = el ? el.value.trim() : '';
      return Object.assign({ clasificador: idx[k].c, valor: idx[k].v.valor }, d ? { dato: d } : {});
    });
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    const { data: r, error: err } = await escribirRpc('registrar_actividad', { p: {
      cuenta_id: id, ubicacion_id: $('vc').value || null, fecha: $('vf').value,
      resultados, detalles, nota: $('vn').value.trim(),
      proxima_accion: $('vpa').value.trim(), proxima_fecha: $('vpf').value || null,
      op_id: VISITA_OP || (VISITA_OP = 'v-' + id + '-' + Date.now())
    }});
    ev.target.disabled = false; ev.target.textContent = `Guardar ${TT('visita', 's', '', 'l', 'l')}`;
    if (err) { toast('No se ha podido guardar: ' + err.message, true); return; }
    $('dlg').close();
    if (!(r && r.encolada)) toast(`${TT('visita', 's', '', 'l', 'C', 'registrado')}` + (r && r.estado ? ' · estado: ' + r.estado : ''));
    // v2.87.0: si estaba marcada como urgente y la visita se ha hecho, se pregunta si se quita la marca
    const hecha = marcados.some(k => idx[k].c === res.clave && idx[k].v.extra !== 'neg');
    if (m.urgente && hecha) {
      const op = await elegirOpcion('Estaba marcada como urgente',
        `${m.nombre}${m.urgente_motivo ? ' · ' + m.urgente_motivo : ''}\n\n¿Quitas la marca de urgente ahora que ya la has visitado?`,
        [{ k: 'dejar', t: 'La dejo', cls: 'sec' }, { k: 'quitar', t: 'Quitar urgente' }]);
      if (op === 'quitar') {
        const { error: e2 } = await db.from('cuentas').update({ urgente: false, urgente_motivo: null }).eq('id', id);
        toast(e2 ? 'No se ha podido quitar la marca' : 'Ya no está marcada como urgente', !!e2);
      }
    }
    cargarInicio();
    if (FICHA_ID === id) abrirFicha(id);
  };
  $('dlg').showModal();
}

/* v2.179.0 · Resultados de visita según el estado de la ficha (decisión de Eric, SQL 113): al registrar una visita solo salen los resultados
   que tocan en el estado de esa ficha (clasificadores_actividad con p_cuenta marca «oculto» los demás); «Ver todos» los enseña igualmente.
   En Configuración, cada resultado lleva «En todos los estados» / «Solo en: …» para elegir en qué estados aparece (guardar_valor, en_estados). */
async function abrirVisitaBaseBase2(id, ...r) {
  if ($('dbody')) $('dbody').classList.remove('vertodos');
  const res = await abrirVisitaBaseBase.call(this, id, ...r);
  try {
    const caja = $('dbody'); if (!caja) return res;
    const ocultos = caja.querySelectorAll('.optw[data-oculto]');
    if (ocultos.length && !$('vtodos')) {
      const ult = [...caja.querySelectorAll('.opciones')].filter(o => o.querySelector('[data-res]')).pop();
      if (ult) ult.insertAdjacentHTML('afterend', `<button type="button" class="lnk" id="vtodos">Ver ${ocultos.length === 1 ? 'el resultado' : `los ${ocultos.length} resultados`} de otros estados</button>`);
      $('vtodos').onclick = () => { caja.classList.add('vertodos'); $('vtodos').remove(); };
    }
  } catch (e) {}
  return res;
}

async function abrirVisitaBaseBase3(id, ...r) {
  const res = await abrirVisitaBaseBase2.call(this, id, ...r);
  const d = $('dbody'), g = d && $('vguardar') && d.querySelector('.g2');
  if (!g || $('vmodo')) return res;
  VISITA_ACTUAL = { id, modo: 'presencial', fotos: [] };
  g.insertAdjacentHTML('afterend', `<label>Cómo fue</label>
    <div class="segs" id="vmodo" role="group" aria-label="Cómo fue">${MODOS_VISITA.map(([k, t]) => `<button type="button" data-vmodo="${k}" class="${k === 'presencial' ? 'on' : ''}" aria-pressed="${k === 'presencial'}">${t}</button>`).join('')}</div>`);
  d.querySelectorAll('[data-vmodo]').forEach(b => b.onclick = () => {
    if (!VISITA_ACTUAL) return;
    VISITA_ACTUAL.modo = b.dataset.vmodo;
    d.querySelectorAll('[data-vmodo]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  });
  const nota = $('vn');
  if (nota) nota.insertAdjacentHTML('afterend', `<div class="vfotosw"><label class="btn sec" id="vfotobtn" style="display:inline-flex">${svgIco(ICON_NOM.camera)} Añadir foto<input type="file" id="vfotof" accept="image/*" data-fp="1" hidden multiple></label>
    <span class="sm">Lineal, exposición, material colocado… (hasta ${FOTOS_VISITA_MAX})</span><div class="vfotos" id="vfotos"></div></div>`);
  const pintar = () => pintarFotosVisita($('vfotos'), VISITA_ACTUAL ? VISITA_ACTUAL.fotos : [], i => { VISITA_ACTUAL.fotos.splice(i, 1); pintar(); });
  if ($('vfotof')) $('vfotof').onchange = async e => {
    for (const f of [...e.target.files]) {
      if (!VISITA_ACTUAL) break;
      if (VISITA_ACTUAL.fotos.length >= FOTOS_VISITA_MAX) { toast(`Como mucho ${FOTOS_VISITA_MAX} fotos por ${TT('visita', 's', '', 'l', 'l')}`, true); break; }
      const j = await leerFotoVisita(f); if (j) VISITA_ACTUAL.fotos.push(j);
    }
    e.target.value = ''; pintar();
  };
  return res;
}

async function abrirVisitaBaseBase4(id, ...r) {
  const res = await abrirVisitaBaseBase3.call(this, id, ...r);
  const d = $('dbody'), nota = $('vn');
  if (!d || !nota || !$('vguardar') || $('vmuestras') || !VISITA_ACTUAL || VISITA_ACTUAL.id !== id) return res;
  if (!navigator.onLine) return res;   // v2.259.0: sin red no hay muestras (y db.from tardaba más de 10 s en rendirse)
  try { const { data: ct } = await db.from('cuentas').select('tipo').eq('id', id).maybeSingle(); if (ct && ct.tipo === 'Centro') return res; } catch (e) {}   // v2.203.0
  const { data: l } = await db.rpc('muestras_de_cuenta', { p_cuenta: id });
  if (!Array.isArray(l) || !l.length || !$('vn') || $('vmuestras')) return res;
  const nombre = (d.querySelector('.fh .sm') || {}).textContent || '';
  const lab = nota.previousElementSibling && nota.previousElementSibling.tagName === 'LABEL' ? nota.previousElementSibling : nota;
  lab.insertAdjacentHTML('beforebegin', `<div class="vmuestras" id="vmuestras"><label>Muestras de medicamento</label>
    ${l.map(x => `<div class="vmrow ${x.en_plazo && x.quedan ? '' : 'agotada'}"><span><b>${esc(x.nombre)}</b><span class="sm">${!x.en_plazo ? 'Ya no se puede dar: el plazo acabó el ' + fechaCorta(x.hasta)
      : `Quedan ${x.quedan} de ${x.max} este año${x.hasta ? ' · hasta el ' + fechaCorta(x.hasta) : ''}`}</span></span>
      <input type="number" min="0" max="${x.en_plazo ? x.quedan : 0}" step="1" value="0" data-vmprod="${x.producto_id}" aria-label="Muestras de ${esc(x.nombre)}" ${x.en_plazo && x.quedan ? '' : 'disabled'}></div>`).join('')}
    <div class="vmfirma hide" id="vmfirma"><label>Firma de quien las recibe <span class="sm">· solicitud de muestras con fecha de hoy</span></label>
      <canvas id="vmcanvas" aria-label="Espacio para firmar"></canvas>
      <div class="vmfpie"><input id="vmfirmante" value="${esc(nombre)}" aria-label="Nombre de quien firma" placeholder="Nombre de quien firma"><button type="button" class="lnk" id="vmborrar">Borrar la firma</button></div></div></div>`);
  let pad = null;
  const items = () => [...d.querySelectorAll('[data-vmprod]')].map(i => ({ producto_id: i.dataset.vmprod, unidades: Math.max(0, Math.floor(+i.value || 0)), max: +i.max })).filter(x => x.unidades > 0);
  const ver = () => { const hay = items().length > 0; $('vmfirma').classList.toggle('hide', !hay); if (hay && !pad) pad = padFirma($('vmcanvas')); };
  d.querySelectorAll('[data-vmprod]').forEach(i => i.addEventListener('input', ver));
  $('vmborrar').onclick = () => pad && pad.borrar();
  VISITA_ACTUAL.muestras = {
    items, firmante: () => $('vmfirmante') ? $('vmfirmante').value.trim() : '', firma: () => (pad ? pad.imagen() : null),
    validar: () => {
      const it = items();
      if (!it.length) return null;
      const pasa = it.find(x => x.unidades > x.max);
      if (pasa) return 'Se pasa del máximo de muestras de este año';
      if (!pad || pad.vacia()) return 'Falta la firma de quien recibe las muestras';
      return null;
    }
  };
  return res;
}

async function abrirVisitaBaseBase5(id, ...r) {
  const res = await abrirVisitaBaseBase4.call(this, id, ...r);
  try {
    const d = $('dbody'), ancla = $('vmodo');
    if (!d || !ancla || $('vprods') || !VISITA_ACTUAL || VISITA_ACTUAL.id !== id || !planIncluyeSeccion('cobertura')) return res;
    const l = await productosPromocionados();
    if (!l.length || !$('vmodo') || $('vprods') || !VISITA_ACTUAL || VISITA_ACTUAL.id !== id) return res;
    VISITA_ACTUAL.productos = [];
    ancla.insertAdjacentHTML('afterend', `<label>Productos presentados</label>
      <div class="opciones" id="vprods">${l.map(p => `<button type="button" class="opt" data-vprod="${p.id}" aria-pressed="false"><span class="mk"></span>${esc(p.nombre)}</button>`).join('')}</div>`);
    d.querySelectorAll('[data-vprod]').forEach(b => b.onclick = () => {
      if (!VISITA_ACTUAL) return;
      const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on));
      VISITA_ACTUAL.productos = [...d.querySelectorAll('[data-vprod][aria-pressed=true]')].map(x => x.dataset.vprod);
    });
  } catch (e) {}
  return res;
}

async function abrirVisitaBaseBase6(...r) {
  const fecha = VISITA_FECHA; VISITA_FECHA = '';
  const x = await abrirVisitaBaseBase5.apply(this, r);
  const vf = $('vf');
  if (vf) {
    vf.max = hoyISO();
    if (!puede('visita_fecha_pasada')) { vf.value = hoyISO(); vf.min = hoyISO(); vf.disabled = true; vf.title = 'La visita se registra el mismo día'; }
    else if (fecha && fecha <= hoyISO()) vf.value = fecha;
  }
  return x;
}

// Aviso en la ventana de la visita sin conexión
async function abrirVisitaBaseBase7(...a) {
  const r = await abrirVisitaBaseBase6.apply(this, a);
  if (!navigator.onLine && $('dlg').open && $('vguardar') && !$('dbody').querySelector('.vsinred')) {
    const fh = $('dbody').querySelector('.fh');
    const html = `<div class="banda-aviso vsinred"><b>Sin conexión.</b> ${esc(TT('visita', 's', 'la', 'l', 'C'))} se guarda en este móvil y se envía sola al recuperar la conexión. Las muestras necesitan conexión.</div>`;
    if (fh) fh.insertAdjacentHTML('afterend', html); else $('dbody').insertAdjacentHTML('afterbegin', html);
  }
  return r;
}

async function abrirVisitaBase(id, ...r) {
  const res = await abrirVisitaBaseBase7.call(this, id, ...r);
  try {
    const v = $('vprods'); if (!v || $('vpres') || !PRES_MAT || !PRES_MAT.length) return res;
    const con = [...v.querySelectorAll('[data-vprod]')].filter(b => PRES_MAT.some(m => m.producto_id === b.dataset.vprod));
    if (!con.length) return res;
    v.insertAdjacentHTML('afterend', `<div class="vpres" id="vpres"><span class="sm">Presentar</span>${con.map(b => `<button type="button" class="chip" data-vpres="${b.dataset.vprod}">▶ ${esc(b.textContent.trim())}</button>`).join('')}</div>`);
    $('vpres').querySelectorAll('[data-vpres]').forEach(b => b.onclick = () => presentarProducto(b.dataset.vpres));
  } catch (e) {}
  return res;
}
