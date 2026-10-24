/* ============================================================
   v2.342.0 · Plantillas de correo y de PDF (Eric, 20/10/2026: «que el usuario vaya creando las que quiera, con el nombre que quiera»;
   eligió que al enviar salga la de por defecto y se pueda cambiar).
   - Correo: ajuste plantillas_correo.lista = [{ id, nombre, uso: pago|factura, asunto, texto, defecto }]. Sin lista, las dos de
     siempre (y los textos guardados antes). Configuración → Correo y firma → «Plantillas de correo»: crear, editar, duplicar,
     eliminar y elegir la de por defecto de cada uso. Al enviar los datos de pago o la factura, si hay más de una, se elige.
   - PDF: ajuste factura_pdf_plantillas = { lista: [{ id, nombre, cfg }], defecto }. factura_pdf sigue siendo el de por defecto (lo usa
     también la base, en la proforma del portal). En «Diseño del PDF», una barra para elegir la plantilla, crear, renombrar, eliminar
     y hacerla la de por defecto. Al descargar o enviar una factura, si hay más de una, se elige.
   ============================================================ */
const USOS_CORREO = { pago: 'Datos de pago', factura: 'Envío de la factura' };
let PLANT_ELEGIDA = { pago: null, factura: null }, PDF_ELEGIDO = null, PDF_EDITANDO = null;
const idPlant = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
function listaCorreos() {
  const a = AJUSTES.plantillas_correo || {};
  if (Array.isArray(a.lista) && a.lista.length) return a.lista;
  return Object.keys(USOS_CORREO).map(u => ({ id: u, nombre: PLANT_CORREO[u].titulo, uso: u, asunto: (a[u] || {}).asunto || PLANT_CORREO[u].asunto, texto: (a[u] || {}).texto || PLANT_CORREO[u].texto, defecto: true }));
}
const plantillasCorreo = uso => listaCorreos().filter(x => x.uso === uso);
// (R-12: plantillaCorreo se definía aquí otra vez; ahora está en su sitio, más arriba)
async function guardarCorreos(lista) {
  const v = Object.assign({}, AJUSTES.plantillas_correo || {}, { lista });
  const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'plantillas_correo', p_valor: v });
  if (error || (r && r.ok === false)) { toast('No se han podido guardar las plantillas', true); return false; }
  AJUSTES.plantillas_correo = v; return true;
}
// Elegir plantilla al enviar (solo si hay más de una para ese uso). Devuelve false si se cancela.
async function elegirPlantillaCorreo(uso) {
  const l = plantillasCorreo(uso); PLANT_ELEGIDA[uso] = null;
  if (l.length < 2) return true;
  const def = l.find(x => x.defecto) || l[0];
  const k = await elegirOpcion('¿Con qué plantilla?', `Hay ${l.length} plantillas para «${USOS_CORREO[uso]}». La de por defecto es «${def.nombre}».`,
    [{ k: '', t: 'Cancelar', cls: 'sec' }, ...[def, ...l.filter(x => x !== def)].map((x, i) => ({ k: x.id, t: x.nombre, cls: i ? 'sec' : '' }))]);
  if (!k) return false;
  PLANT_ELEGIDA[uso] = k; return true;
}
enviarDatosPago = (orig => async function (id, ...a) {
  if (!await elegirPlantillaCorreo('pago')) return false;
  try { return await orig.call(this, id, ...a); } finally { PLANT_ELEGIDA.pago = null; }
})(enviarDatosPago);

// (R-12: pintarPlantillasCorreo se definía aquí otra vez; ahora está en su sitio, más arriba)
function editarPlantillaCorreo(p, nueva, alGuardar) {
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>${nueva ? 'Nueva plantilla de correo' : 'Editar la plantilla'}</h2></div><button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <div class="g2"><div><label for="pcen">Nombre</label><input id="pcen" value="${esc(p.nombre)}" maxlength="60" placeholder="Por ejemplo: Datos de pago · clínicas"></div>
      <div><label for="pceu">Se usa para</label><select id="pceu">${Object.entries(USOS_CORREO).map(([k, t]) => `<option value="${k}" ${p.uso === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div></div>
    <label for="pcea">Asunto</label><input id="pcea" value="${esc(p.asunto)}">
    <label for="pcet">Texto</label><textarea id="pcet" rows="12">${esc(p.texto)}</textarea>
    <div class="sm plchue">Huecos (pulsa para añadirlo donde está el cursor):</div>
    <div class="plcvars">${VARS_CORREO.map(([n, t]) => `<button type="button" class="btn sec chico" data-plv="${n}" title="${esc(t)}">[${n}]</button>`).join('')}</div>
    <label class="chk"><input type="checkbox" id="pced" ${p.defecto ? 'checked' : ''}> <span>Usarla por defecto para este uso</span></label>
    <div class="acts"><button type="button" class="btn sec" data-cerrar2>Cancelar</button><button type="button" class="btn" id="pceok">Guardar</button></div>`;
  $('dlg2').showModal();
  let ult = $('pcet'); ['pcea', 'pcet'].forEach(id => $(id).addEventListener('focus', () => { ult = $(id); }));
  $('dlg2body').querySelectorAll('[data-plv]').forEach(b => b.onclick = () => {
    const t = ult, v = '[' + b.dataset.plv + ']', i = t.selectionStart == null ? t.value.length : t.selectionStart, j = t.selectionEnd == null ? i : t.selectionEnd;
    t.value = t.value.slice(0, i) + v + t.value.slice(j); t.focus(); t.selectionStart = t.selectionEnd = i + v.length;
  });
  $('pceok').onclick = () => conCarga($('pceok'), 'Guardando…', async () => {
    const nombre = $('pcen').value.trim(); if (!nombre) { toast('Pon un nombre a la plantilla', true); return; }
    const n = Object.assign({}, p, { nombre, uso: $('pceu').value, asunto: $('pcea').value.trim(), texto: $('pcet').value.replace(/\s+$/, ''), defecto: $('pced').checked });
    let l = listaCorreos().map(x => Object.assign({}, x)).filter(x => x.id !== n.id);
    if (n.defecto) l.forEach(x => { if (x.uso === n.uso) x.defecto = false; });
    l.push(n);
    Object.keys(USOS_CORREO).forEach(u => { const g = l.filter(x => x.uso === u); if (g.length && !g.some(x => x.defecto)) g[0].defecto = true; });
    if (await guardarCorreos(l)) { $('dlg2').close(); toast('Plantilla guardada'); alGuardar && alGuardar(); }
  });
}

// ---- PDF ----
function listaPDF() {
  const a = AJUSTES.factura_pdf_plantillas || {};
  if (Array.isArray(a.lista) && a.lista.length) return { lista: a.lista, defecto: a.defecto || a.lista[0].id };
  return { lista: [{ id: 'base', nombre: 'Diseño principal', cfg: AJUSTES.factura_pdf || {} }], defecto: 'base' };
}
const cfgDePlantilla = id => { const p = listaPDF().lista.find(x => x.id === id); const c = (p && p.cfg) || {};
  return Object.assign({}, PDF_DEF, c, { cols: Object.assign({}, PDF_DEF.cols, c.cols || {}) }); };
async function guardarPDFPlantillas(v) {
  const { data: r, error } = await RPC_V2342('guardar_ajuste', { p_clave: 'factura_pdf_plantillas', p_valor: v });
  if (error || (r && r.ok === false)) { toast('No se han podido guardar las plantillas del PDF', true); return false; }
  AJUSTES.factura_pdf_plantillas = v; return true;
}
facturaPDF = (orig => function (f, rn, cfg, ...a) {
  if (!cfg && PDF_ELEGIDO && PDF_ELEGIDO !== listaPDF().defecto) cfg = cfgDePlantilla(PDF_ELEGIDO);
  return orig.call(this, f, rn, cfg, ...a);
})(facturaPDF);
async function elegirPlantillaPDF() {
  const { lista, defecto } = listaPDF(); PDF_ELEGIDO = null;
  if (lista.length < 2) return true;
  const def = lista.find(x => x.id === defecto) || lista[0];
  const k = await elegirOpcion('¿Con qué diseño?', `Hay ${lista.length} diseños del PDF. El de por defecto es «${def.nombre}».`,
    [{ k: '', t: 'Cancelar', cls: 'sec' }, ...[def, ...lista.filter(x => x !== def)].map((x, i) => ({ k: x.id, t: x.nombre, cls: i ? 'sec' : '' }))]);
  if (!k) return false;
  PDF_ELEGIDO = k; return true;
}
descargarFacturaPDF = (orig => async function (...a) {
  if (!await elegirPlantillaPDF()) return;
  try { return await orig.apply(this, a); } finally { PDF_ELEGIDO = null; }
})(descargarFacturaPDF);
// Enviar la factura: plantilla del correo y diseño del PDF, en la propia ventana (si hay más de uno)
enviarFacturaEmail = (orig => async function (f, rn, ...a) {
  PLANT_ELEGIDA.factura = null; PDF_ELEGIDO = null;
  const r = await orig.call(this, f, rn, ...a);
  const pl = plantillasCorreo('factura'), { lista, defecto } = listaPDF(), c = f.cliente || {};
  const sel = [];
  if (pl.length > 1) sel.push(`<div><label for="efplant">Plantilla del correo</label><select id="efplant">${pl.map(x => `<option value="${x.id}" ${x.defecto ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select></div>`);
  if (lista.length > 1) sel.push(`<div><label for="efdis">Diseño del PDF</label><select id="efdis">${lista.map(x => `<option value="${x.id}" ${x.id === defecto ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select></div>`);
  if (sel.length && $('efp')) {
    $('efp').insertAdjacentHTML('afterend', `<div class="g2 efplants">${sel.join('')}</div>`);
    if ($('efplant')) $('efplant').onchange = () => {
      PLANT_ELEGIDA.factura = $('efplant').value;
      const v = varsCorreo({ documento: 'factura', numero: f.numero, importe: f.total, nombre: c.nombre });
      $('efa').value = plantillaCorreo('factura', 'asunto', v); $('eft').value = plantillaCorreo('factura', 'texto', v);
    };
    if ($('efdis')) $('efdis').onchange = () => { PDF_ELEGIDO = $('efdis').value; };
    $('dlg2').addEventListener('close', () => { PLANT_ELEGIDA.factura = null; PDF_ELEGIDO = null; }, { once: true });
  }
  return r;
})(enviarFacturaEmail);
// «Diseño del PDF»: barra de plantillas. Guardar un diseño que no es el de por defecto lo guarda en su plantilla (no en factura_pdf).
const RPC_V2342 = db.rpc;
db.rpc = function (fn, params, ...a) {
  if (fn === 'guardar_ajuste' && params && params.p_clave === 'factura_pdf' && PDF_EDITANDO) {
    const v = listaPDF(), id = PDF_EDITANDO;
    v.lista = v.lista.map(x => x.id === id ? Object.assign({}, x, { cfg: params.p_valor }) : x);
    const conDef = id === v.defecto;
    return (async () => {
      const ok = await guardarPDFPlantillas({ lista: v.lista, defecto: v.defecto });
      if (!ok) return { data: { ok: false }, error: null };
      if (conDef) return RPC_V2342.call(db, fn, params, ...a);
      setTimeout(() => { AJUSTES.factura_pdf = (v.lista.find(x => x.id === v.defecto) || {}).cfg || AJUSTES.factura_pdf; }, 0);   // el de por defecto no cambia
      return { data: { ok: true }, error: null };
    })();
  }
  return RPC_V2342.call(db, fn, params, ...a);
};
disenoPDF = (orig => async function (...a) {
  const v = listaPDF(); if (!PDF_EDITANDO || !v.lista.some(x => x.id === PDF_EDITANDO)) PDF_EDITANDO = v.defecto;
  const g = AJUSTES.factura_pdf, tmp = !!AJUSTES.__pdfTmp; delete AJUSTES.__pdfTmp;   // «Volver al diseño original» pinta su diseño provisional
  if (!tmp) AJUSTES.factura_pdf = (v.lista.find(x => x.id === PDF_EDITANDO) || {}).cfg || g;
  let r; try { r = await orig.apply(this, a); } finally { if (!tmp) AJUSTES.factura_pdf = (v.lista.find(x => x.id === v.defecto) || {}).cfg || g; }
  const fh = $('dbody') && $('dbody').querySelector('.fh'); if (!fh || $('pdfplbar')) return r;
  const actual = v.lista.find(x => x.id === PDF_EDITANDO) || v.lista[0];
  fh.insertAdjacentHTML('afterend', `<div class="pdfplbar" id="pdfplbar"><div><label for="pdfplsel">Plantilla</label><select id="pdfplsel">${v.lista.map(x => `<option value="${x.id}" ${x.id === actual.id ? 'selected' : ''}>${esc(x.nombre)}${x.id === v.defecto ? ' · por defecto' : ''}</option>`).join('')}</select></div>
    <div class="pdfplacts"><button type="button" class="btn sec chico" id="pdfplnueva">+ Nueva</button><button type="button" class="btn sec chico" id="pdfplren">Renombrar</button>
      ${actual.id !== v.defecto ? '<button type="button" class="btn sec chico" id="pdfpldef">Usar por defecto</button>' : ''}${v.lista.length > 1 ? '<button type="button" class="btn sec chico dang" id="pdfplx">Eliminar</button>' : ''}
      ${pmAyu('Plantillas del PDF', 'Guarda varios diseños con el nombre que quieras. El de por defecto es el que sale siempre; si hay más, al descargar o enviar una factura se puede elegir otro. «Guardar diseño» guarda la plantilla elegida.')}</div></div>`);
  const otra = id => { PDF_EDITANDO = id; disenoPDF(); };
  $('pdfplsel').onchange = () => otra($('pdfplsel').value);
  $('pdfplnueva').onclick = async () => {
    const n = await pedirTexto('Nombre de la plantilla', actual.nombre + ' (copia)', { titulo: 'Nueva plantilla del PDF', ok: 'Crear' }); if (n === null || !n.trim()) return;
    const id = idPlant(); v.lista.push({ id, nombre: n.trim(), cfg: JSON.parse(JSON.stringify(actual.cfg || {})) });
    if (await guardarPDFPlantillas({ lista: v.lista, defecto: v.defecto })) otra(id);
  };
  $('pdfplren').onclick = async () => {
    const n = await pedirTexto('Nombre de la plantilla', actual.nombre, { titulo: 'Renombrar', ok: 'Guardar' }); if (n === null || !n.trim()) return;
    actual.nombre = n.trim(); if (await guardarPDFPlantillas({ lista: v.lista, defecto: v.defecto })) otra(actual.id);
  };
  if ($('pdfpldef')) $('pdfpldef').onclick = async () => {
    if (!await guardarPDFPlantillas({ lista: v.lista, defecto: actual.id })) return;
    const { data: r2 } = await RPC_V2342('guardar_ajuste', { p_clave: 'factura_pdf', p_valor: actual.cfg || {} });
    if (r2 && r2.ok !== false) AJUSTES.factura_pdf = actual.cfg || {};
    toast(`«${actual.nombre}» es ahora el diseño por defecto`); otra(actual.id);
  };
  if ($('pdfplx')) $('pdfplx').onclick = async () => {
    if (!await preguntar(`Se elimina la plantilla «${actual.nombre}».`, { titulo: '¿Eliminar la plantilla?', ok: 'Eliminar' })) return;
    const l = v.lista.filter(x => x !== actual), def = actual.id === v.defecto ? l[0].id : v.defecto;
    if (!await guardarPDFPlantillas({ lista: l, defecto: def })) return;
    if (def !== v.defecto) { await RPC_V2342('guardar_ajuste', { p_clave: 'factura_pdf', p_valor: (l[0].cfg || {}) }); AJUSTES.factura_pdf = l[0].cfg || {}; }
    toast('Plantilla eliminada'); otra(def);
  };
  return r;
})(disenoPDF);

/* v2.343.0 · El «+» flotante del móvil vuelve a la cabecera al pasar a tamaño de ordenador (aviso de Eric: «+ Añadir médico» se
   quedaba debajo de la tabla tras usar el simulador de móvil o estrechar la ventana sin recargar). */
function fabAOrdenador() {
  if (ES_MOVIL()) return;
  document.querySelectorAll('main > section .fab[data-txt], main > section .fab[data-plfab], main > section > button[data-plfab], main > section > button[data-txt]').forEach(f => {
    const sec = f.closest('main > section'), acts = sec && sec.querySelector(':scope > .saludo .acts'); if (!acts) return;
    const txt = f.dataset.txt || f.getAttribute('aria-label') || 'Añadir';
    f.classList.remove('fab', 'plfuera'); delete f.dataset.plfab; delete f.dataset.txt;
    f.innerHTML = plIco('plus') + ' ' + esc(txt.replace(/^\s*\+\s*/, ''));
    acts.appendChild(f);
  });
}
let FAB_RZ = 0;
addEventListener('resize', () => { clearTimeout(FAB_RZ); FAB_RZ = setTimeout(() => { fabAOrdenador(); try { if (typeof plSync === 'function' && TAB) plSync(TAB); } catch (e) {} }, 120); });


