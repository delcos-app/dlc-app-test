// servicios/pdf.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function cargarJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF;
  await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = new URL('jspdf.umd.min.js', location.href).href; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  return window.jspdf.jsPDF;
}

// (v2.183.0: aquí iba la primera versión de facturaPDF; se redefine entera más abajo)
const nombrePDF = f => `${f.numero}_${String((f.cliente || {}).nombre || 'cliente').replace(/[^\p{L}\p{N} ]/gu, '').trim().replace(/\s+/g, '_')}.pdf`;

const PDF_DEF = { logo: true, logoPos: 'izq', logoTam: 'm', color: '#1C2733', titulo: 'FACTURA', fuente: 'helvetica', empresaCab: false, clientePos: 'der',
  cols: { precio: true, unidades: true, subtotal: true, iva: true, total: true }, fotos: true, vencimiento: true, formaPago: true, iban: true, direccion: true,
  pieTel: true, pieWeb: true, pieTexto: true, paginas: true, qrPos: 'abajo' };

const cfgPDF = () => Object.assign({}, PDF_DEF, (AJUSTES || {}).factura_pdf || {}, { cols: Object.assign({}, PDF_DEF.cols, ((AJUSTES || {}).factura_pdf || {}).cols || {}) });

async function descargarFacturaPDFBase(f, rn) {
  const doc = await facturaPDF(f, rn); doc.save(nombrePDF(f));
  await db.from('eventos_facturacion').insert({ tipo: 'PDF descargado', factura_id: f.id, detalle: {} }).then(() => {}, () => {});
}

async function disenoPDFBase() {
  const C = cfgPDF();
  await cargarAjustes();
  const sel = (k, ops) => `<div class="segs" data-pk="${k}">${ops.map(([v, t]) => `<button type="button" data-v="${v}" class="${C[k] === v ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  const chk = (k, t, sub) => `<label class="opt"><input type="checkbox" data-pc="${sub ? sub + '.' : ''}${k}" ${(sub ? C[sub][k] : C[k]) ? 'checked' : ''}> ${t}</label>`;
  $('dbody').innerHTML = `<div class="fh"><div><h2>Diseño del PDF de la factura</h2><div class="sm">Los cambios se ven al momento en la vista previa. Las facturas ya emitidas se descargan con el diseño que haya en ese momento.</div></div>
    <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="pdfcfg" data-pagina="1"><div class="pdfops">
      <h4>Logo</h4>${chk('logo', 'Mostrar el logo')}<div class="g2"><div><label>Posición</label>${sel('logoPos', [['izq', 'Izquierda'], ['der', 'Derecha']])}</div><div><label>Tamaño</label>${sel('logoTam', [['s', 'Pequeño'], ['m', 'Mediano'], ['l', 'Grande']])}</div></div>
      <h4>Estilo</h4><div class="g2"><div><label for="pcol">Color de títulos y líneas</label><input type="color" id="pcol" value="${esc(C.color)}"></div><div><label>Tipografía</label>${sel('fuente', [['helvetica', 'Moderna'], ['times', 'Clásica']])}</div></div>
      <label for="ptit">Título del documento</label><input id="ptit" value="${esc(C.titulo)}" maxlength="24">
      <h4>Cabecera</h4>${chk('empresaCab', 'Datos de la empresa también en la cabecera (además del pie)')}<label>Cliente</label>${sel('clientePos', [['der', 'A la derecha'], ['izq', 'A la izquierda']])}
      ${chk('vencimiento', 'Fecha de vencimiento')}${chk('direccion', 'Dirección de envío como referencia')}
      <h4>Líneas</h4>${chk('fotos', 'Foto de cada producto')}<div class="pcols">${chk('precio', 'Precio', 'cols')}${chk('unidades', 'Unidades', 'cols')}${chk('subtotal', 'Subtotal', 'cols')}${chk('iva', 'IVA', 'cols')}${chk('total', 'Total', 'cols')}</div>
      <h4>Pago y pie</h4>${chk('formaPago', 'Forma de pago')}${chk('iban', 'IBAN si se paga por transferencia')}${chk('pieTel', 'Teléfono de atención')}${chk('pieWeb', 'Web')}${chk('pieTexto', 'Texto del pie (Datos fiscales)')}${chk('paginas', 'Número de página')}
      <h4>VeriFactu</h4><div class="sm">El código QR es obligatorio cuando VeriFactu está activo. Puedes elegir dónde va.</div>${sel('qrPos', [['abajo', 'Abajo'], ['arriba', 'Arriba']])}
    </div><div class="pdfprev"><iframe id="pdfif" title="Vista previa del PDF"></iframe></div></div>
    <div class="acts" style="justify-content:space-between"><button class="btn sec" id="pdfdef" type="button">Volver al diseño original</button>
      <div style="display:flex;gap:8px"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="pdfok">Guardar diseño</button></div></div>`;
  $('dlg').classList.add('amplia'); if (!$('dlg').open) $('dlg').showModal();
  // v2.122.0: integrado en su pestaña (ordenador): sin cerrar, «Descartar cambios» vuelve a lo guardado y al guardar se queda
  const enPagina = $('dlg').classList.contains('encajada');
  if (enPagina) {
    $('dlg').dataset.fija = '1';
    $('dbody').querySelector('.fh .x').remove();
    const c = $('dbody').querySelector('.acts [data-cerrar]'); c.removeAttribute('data-cerrar'); c.textContent = 'Descartar cambios';
    c.onclick = () => disenoPDF();
  } else if ((TAB === 'organizacion' && PAG_TAB.organizacion === 'pdf') || (TAB === 'config' && CFG_KEY === 'o.pdf')) {
    // v2.124.0: en el móvil el diseño es una ventana; al cerrarla, la pestaña no se queda vacía con el cargador girando
    $('dlg').dataset.depagina = '1';   // v2.136.0: se cierra al cambiar de pantalla
    $('dlg').addEventListener('close', () => {
      delete $('dlg').dataset.depagina;
      const area = document.querySelector('#v-organizacion .pagcuerpo') || (TAB === 'config' ? $('cfgcuerpo') : null);
      if (!area || !((TAB === 'organizacion' && PAG_TAB.organizacion === 'pdf') || (TAB === 'config' && CFG_KEY === 'o.pdf'))) return;
      area.innerHTML = `<div class="card cfgpanel"><h2>Diseño del PDF de la factura</h2><p class="sm">Logo, colores, columnas y pie de las facturas, con vista previa.</p>
        <div class="acts"><button class="btn" id="pdfabrir" type="button">Abrir el diseño del PDF</button></div></div>`;
      $('pdfabrir').onclick = () => disenoPDF();
    }, { once: true });
  }
  let T = null;
  const pinta = () => { clearTimeout(T); T = setTimeout(async () => { const d = await facturaPDF(facturaEjemplo(), '', C); const u = d.output('bloburl'); $('pdfif').src = u + '#toolbar=0&navpanes=0&view=FitH'; }, 250); };
  $('dbody').querySelectorAll('[data-pk]').forEach(g => g.querySelectorAll('button').forEach(b => b.onclick = () => { C[g.dataset.pk] = b.dataset.v; g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); pinta(); }));
  $('dbody').querySelectorAll('[data-pc]').forEach(i => i.onchange = () => { const [a, b] = i.dataset.pc.split('.'); if (b) C[a][b] = i.checked; else C[a] = i.checked; pinta(); });
  $('pcol').oninput = () => { C.color = $('pcol').value; pinta(); };
  $('ptit').oninput = () => { C.titulo = $('ptit').value.trim() || 'FACTURA'; pinta(); };
  $('pdfdef').onclick = () => { Object.assign(C, JSON.parse(JSON.stringify(PDF_DEF))); disenoPDFCon(C); };
  const disenoPDFCon = nuevo => { AJUSTES.__pdfTmp = nuevo; $('dlg').close(); setTimeout(() => { const g = AJUSTES.factura_pdf; AJUSTES.factura_pdf = nuevo; disenoPDF().then(() => { AJUSTES.factura_pdf = g; }); }, 50); };
  $('pdfok').onclick = () => conCarga($('pdfok'), 'Guardando…', async () => {
    const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'factura_pdf', p_valor: C });
    if (error || !r || !r.ok) { toast('No se ha podido guardar el diseño', true); return; }
    AJUSTES.factura_pdf = JSON.parse(JSON.stringify(C)); delete $('dlg').dataset.sucio; if (!enPagina) $('dlg').close(); toast('Diseño del PDF guardado');
  });
  pinta();
}

async function descargarFacturaPDF(...a) {
  if (!await elegirPlantillaPDF()) return;
  try { return await descargarFacturaPDFBase.apply(this, a); } finally { PDF_ELEGIDO = null; }
}

async function disenoPDF(...a) {
  const v = listaPDF(); if (!PDF_EDITANDO || !v.lista.some(x => x.id === PDF_EDITANDO)) PDF_EDITANDO = v.defecto;
  const g = AJUSTES.factura_pdf, tmp = !!AJUSTES.__pdfTmp; delete AJUSTES.__pdfTmp;   // «Volver al diseño original» pinta su diseño provisional
  if (!tmp) AJUSTES.factura_pdf = (v.lista.find(x => x.id === PDF_EDITANDO) || {}).cfg || g;
  let r; try { r = await disenoPDFBase.apply(this, a); } finally { if (!tmp) AJUSTES.factura_pdf = (v.lista.find(x => x.id === v.defecto) || {}).cfg || g; }
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
}
