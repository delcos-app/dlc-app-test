let PLANT_ELEGIDA = { pago: null, factura: null }, PDF_ELEGIDO = null, PDF_EDITANDO = null;
enviarDatosPago = (orig => async function (id, ...a) {
  if (!await elegirPlantillaCorreo('pago')) return false;
  try { return await orig.call(this, id, ...a); } finally { PLANT_ELEGIDA.pago = null; }
})(enviarDatosPago);


facturaPDF = (orig => function (f, rn, cfg, ...a) {
  if (!cfg && PDF_ELEGIDO && PDF_ELEGIDO !== listaPDF().defecto) cfg = cfgDePlantilla(PDF_ELEGIDO);
  return orig.call(this, f, rn, cfg, ...a);
})(facturaPDF);
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

addEventListener('resize', () => { clearTimeout(FAB_RZ); FAB_RZ = setTimeout(() => { fabAOrdenador(); try { if (typeof plSync === 'function' && TAB) plSync(TAB); } catch (e) {} }, 120); });


