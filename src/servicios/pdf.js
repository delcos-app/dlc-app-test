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

async function facturaPDFBase(f, rectificaNum, cfgPrueba) {
  const C = cfgPrueba || cfgPDF();
  const JsPDF = await cargarJsPDF();
  if (!PRODUCTOS.length) await cargarProductos();
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const F = C.fuente === 'times' ? 'times' : 'helvetica';
  const e = f.emisor || {}, c = f.cliente || {};
  const gris = [110, 118, 126], negro = [28, 39, 51], claro = [238, 240, 242], acento = hexRGB(C.color);
  const eur = v => (Math.round((+v || 0) * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
  const fecha = x => x ? x.split('-').reverse().join('/') : '';
  const izqLogo = C.logoPos !== 'der', tam = { s: 22, m: 34, l: 44 }[C.logoTam] || 34;
  const xLogo = izqLogo ? 17 : 192 - tam, xTit = izqLogo ? 192 : 18, alTit = izqLogo ? 'right' : 'left';
  // Logo
  if (C.logo) {
    const logo = await logoData();
    if (logo && LOGO_CIRC) doc.addImage(logo, 'PNG', xLogo, 19, tam, tam);
    else if (logo) { doc.setFillColor(236, 240, 245); doc.circle(xLogo + tam / 2, 19 + tam / 2, tam / 2 - 2, 'F'); doc.addImage(logo, 'PNG', xLogo + tam * .16, 19 + tam * .37, tam * .68, tam * .27); }
  }
  // Título y número
  doc.setFont(F, 'normal'); doc.setTextColor(...acento); doc.setFontSize(f.rectifica_id ? 22 : 28);
  doc.text(f.rectifica_id ? (C.titulo || 'FACTURA') + ' RECTIFICATIVA' : (C.titulo || 'FACTURA'), xTit, 36, { align: alTit });
  doc.setFontSize(14); doc.setTextColor(...gris); doc.text(f.numero || '', xTit, 44, { align: alTit });
  // Empresa en la cabecera (opcional)
  let yEmp = 19 + (C.logo ? tam : 0) + 6;
  if (C.empresaCab) {
    doc.setFontSize(8.8); doc.setTextColor(...negro); doc.setFont(F, 'bold');
    doc.text(e.razon_social || nombreApp(), izqLogo ? 18 : 192, yEmp, { align: izqLogo ? 'left' : 'right' }); doc.setFont(F, 'normal'); doc.setTextColor(...gris);
    [e.nif ? 'NIF ' + e.nif : '', [e.direccion, [e.cp, e.municipio].filter(Boolean).join(' ')].filter(Boolean).join(', '), [e.telefono, e.email].filter(Boolean).join(' · ')].filter(Boolean)
      .forEach((t, i) => doc.text(t, izqLogo ? 18 : 192, yEmp + 4.2 * (i + 1), { align: izqLogo ? 'left' : 'right' }));
  }
  // Fechas y cliente
  doc.setFontSize(9.5); let y = C.empresaCab ? Math.max(76, yEmp + 20) : 70;
  const cliDer = C.clientePos !== 'izq', xDat = cliDer ? 18 : 110, xCli = cliDer ? 110 : 18;
  const fila = (etq, val, x, yy) => { doc.setTextColor(...gris); doc.text(etq, x, yy); doc.setTextColor(...negro); doc.text(val || '', x + doc.getTextWidth(etq) + 2, yy); };
  fila('Fecha:', fecha(f.fecha), xDat, y);
  if (C.vencimiento && !f.rectifica_id) fila('Fecha vencimiento:', fecha(f.vencimiento), xDat, y + 4.6);
  const dirCli = [c.direccion, [c.municipio, c.cp ? '(' + c.cp + ')' : '', c.provincia, c.pais].filter(Boolean).join(', ').replace(', (', ' (')].filter(Boolean);
  if (C.direccion && dirCli.length) { fila('Ref:', dirCli[0], xDat, y + 13.8); if (dirCli[1]) { doc.setTextColor(...negro); doc.text(dirCli[1], xDat, y + 18.4); } }
  if (f.rectifica_id) { doc.setTextColor(...gris); doc.text('Rectifica la factura ' + (rectificaNum || '') + (f.motivo_rectificacion ? ' · ' + f.motivo_rectificacion : ''), xDat, y + 9.2); }
  doc.setFont(F, 'bold'); doc.setTextColor(...negro); doc.text(c.nombre || '', xCli, y); doc.setFont(F, 'normal');
  [c.nif, ...dirCli, c.email].filter(Boolean).forEach((t, i) => doc.text(String(t), xCli, y + 4.6 * (i + 1)));
  // Tabla con las columnas elegidas
  y = Math.max(104, y + 34);
  const cols = [['precio', 'PRECIO', l => eur(l.precio)], ['unidades', 'UNIDADES', l => String(l.unidades)], ['subtotal', 'SUBTOTAL', l => eur(l.base)],
    ['iva', 'IVA', l => (+l.iva || 0) + '%'], ['total', 'TOTAL', l => eur((+l.base || 0) * (1 + (+l.iva || 0) / 100))]].filter(k => C.cols[k[0]]);
  const conFoto = C.fotos, xCon = conFoto ? 46 : 20, anchoNum = cols.length ? Math.min(28, 110 / cols.length) : 0;
  const xs = cols.map((_, i) => 192 - (cols.length - 1 - i) * anchoNum);
  doc.setFillColor(...claro); doc.rect(conFoto ? 42 : 18, y, conFoto ? 150 : 174, 11, 'F'); if (conFoto) doc.rect(18, y, 22.5, 11, 'F');
  doc.setFont(F, 'bold'); doc.setFontSize(8.8); doc.setTextColor(...acento);
  doc.text('CONCEPTO', xCon, y + 7); cols.forEach((k, i) => doc.text(k[1], xs[i], y + 7, { align: 'right' }));
  doc.setFont(F, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...negro); y += 11;
  const limCon = (cols.length ? xs[0] - anchoNum : 190) - xCon;
  for (const l of f.lineas || []) {
    const p = conFoto && PRODUCTOS.find(x => x.nombre && l.descripcion && l.descripcion.toLowerCase().startsWith(x.nombre.toLowerCase()));
    const img = p && p.foto_url ? await imagenData(p.foto_url) : null;
    const alto = img ? 20 : 11;
    if (y + alto > 250) { doc.addPage(); y = 20; }
    if (img) { try { doc.addImage(img, 20, y + 3, 18, 13); } catch (er) {} }
    const ld = doc.splitTextToSize(l.descripcion || '', Math.max(30, limCon));
    doc.text(ld, xCon, y + 7);
    cols.forEach((k, i) => doc.text(k[2](l), xs[i], y + 7, { align: 'right' }));
    y += Math.max(alto, 5 + ld.length * 4.6);
    doc.setDrawColor(226, 230, 234); doc.line(18, y, 192, y);
  }
  // Totales
  y += 10; doc.setFontSize(9.5);
  const tot = (etq, val, negrita) => { doc.setTextColor(...gris); doc.text(etq, 150, y, { align: 'right' }); doc.setTextColor(...(negrita ? acento : negro));
    doc.setFont(F, negrita ? 'bold' : 'normal'); doc.text(val, 190, y, { align: 'right' }); doc.setFont(F, 'normal'); y += 7; };
  tot('Base imponible', eur(f.base));
  (f.desglose_iva || []).filter(d => +d.cuota).forEach(d => tot('IVA ' + d.iva + '%', eur(d.cuota)));
  if (!(f.desglose_iva || []).some(d => +d.cuota)) tot('IVA', eur(0));
  doc.setFillColor(...claro); doc.rect(152, y - 5, 40, 9, 'F'); tot('Total', eur(f.total), true);
  y += 4;
  if (C.formaPago && f.forma_pago) { doc.setTextColor(...gris); doc.text('Forma de pago: ', 18, y); doc.setTextColor(...negro);
    doc.text(f.forma_pago + (C.iban && /transfer/i.test(f.forma_pago) && e.iban ? ' · IBAN ' + e.iban : ''), 18 + doc.getTextWidth('Forma de pago: ') + 1, y); }
  // QR VeriFactu (obligatorio si está activo; solo se elige su posición)
  if ((f.verifactu || {}).activo && f.qr_url) {
    try {
      const QR = await cargarQR(), q = QR(0, 'M'); q.addData(f.qr_url); q.make();
      const n = q.getModuleCount(), t = 26 / n, arriba = C.qrPos === 'arriba', x0 = arriba ? 18 : 18, y0 = arriba ? 52 : 238;
      if (arriba && C.logo && izqLogo) { /* con el logo a la izquierda, el QR arriba va a la derecha */ }
      const xq = arriba && izqLogo ? 166 : x0, yq = arriba ? 50 : y0;
      doc.setFillColor(0, 0, 0);
      for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) doc.rect(xq + k * t, yq + r * t, t, t, 'F');
      doc.setFontSize(8.5); doc.setTextColor(...negro); doc.setFont(F, 'bold');
      const xt = arriba && izqLogo ? 164 : 48, al = arriba && izqLogo ? 'right' : 'left';
      doc.text('VERI*FACTU', xt, yq + 10, { align: al }); doc.setFont(F, 'normal'); doc.setTextColor(...gris); doc.text('Factura verificable en la sede electrónica de la AEAT', xt, yq + 15, { align: al });
    } catch (er) {}
  }
  // Pie
  const pags = doc.getNumberOfPages();
  for (let i = 1; i <= pags; i++) {
    doc.setPage(i); doc.setDrawColor(...acento); doc.line(18, 276, 192, 276);
    doc.setFontSize(8.3); doc.setTextColor(...gris); doc.setFont(F, 'normal');
    doc.text(`${e.razon_social || nombreApp()} | NIF: ${e.nif || ''} | ${[e.direccion, [e.cp, e.municipio].filter(Boolean).join(' '), e.pais || 'España'].filter(Boolean).join(', ')}`, 105, 281, { align: 'center' });
    if (C.pieTel && e.telefono) doc.text('Atención al cliente: ' + e.telefono, 105, 285, { align: 'center' });
    if (C.pieWeb && e.web) doc.text(e.web, 105, 289, { align: 'center' });
    if (C.pieTexto && e.pie) doc.text(doc.splitTextToSize(e.pie, 170), 105, 293, { align: 'center' });
    if (C.paginas) doc.text(i + '/' + pags, 192, 289, { align: 'right' });
  }
  return doc;
}

function facturaPDF(f, rn, cfg, ...a) {
  if (!cfg && PDF_ELEGIDO && PDF_ELEGIDO !== listaPDF().defecto) cfg = cfgDePlantilla(PDF_ELEGIDO);
  return facturaPDFBase.call(this, f, rn, cfg, ...a);
}
