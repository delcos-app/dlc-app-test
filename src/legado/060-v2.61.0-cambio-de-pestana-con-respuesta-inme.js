/* ============================================================
   v2.61.0 · Cambio de pestaña con respuesta inmediata, ayudas
   breves con enlace al manual, diseño del PDF de factura
   configurable y ajustes de Facturación, Manual, Analítica y Cuentas
   ============================================================ */

/* ---------------- 1. Cambio de pestaña: respuesta inmediata y vista anterior atenuada ---------------- */

let CLIC_PESTANA = null;
// Se registra al apoyar el dedo o el ratón (antes del clic), para que la vista fija sepa qué botón se ha pulsado
document.addEventListener('pointerdown', e => { CLIC_PESTANA = e.target.closest('button, [data-ag]'); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') CLIC_PESTANA = e.target.closest && e.target.closest('button, [data-ag]'); }, true);
congelar = function (sec) {
  if (!sec || sec.classList.contains('hide') || document.querySelector('.congelada')) return;
  const r = sec.getBoundingClientRect(); if (r.height < 40) return;
  const t0 = Date.now() - 2;
  // La copia conserva sus identificadores (así mantiene exactamente su aspecto); al estar al final de la página,
  // la plataforma sigue encontrando siempre los elementos reales, que van antes
  const c = sec.cloneNode(true);
  c.classList.add('congelada', 'atenuada'); c.classList.remove('cargando', 'cargando-pend', 'preparando');
  Object.assign(c.style, { position: 'absolute', left: (r.left + scrollX) + 'px', top: (r.top + scrollY) + 'px', width: r.width + 'px', margin: 0, zIndex: 45, background: 'var(--bg, #F3F8FC)' });
  // La pestaña pulsada se marca activa al momento en la copia
  const b = CLIC_PESTANA;
  if (b && sec.contains(b)) {
    const attrs = [...b.attributes].filter(a => a.name.startsWith('data-') && a.name !== 'data-expl');
    const sel = attrs.length ? attrs.map(a => `[${a.name}="${CSS.escape(a.value)}"]`).join('') : null;
    const cb = sel && c.querySelector(sel);
    if (cb) { [...cb.parentElement.children].forEach(x => { x.setAttribute('aria-pressed', String(x === cb)); x.classList.toggle('on', x === cb); if (x !== cb && x.classList.contains('btn') && !x.classList.contains('sec')) x.classList.add('sec'); }); cb.classList.remove('sec'); }
  }
  c.insertAdjacentHTML('afterbegin', '<div class="barraprog"><i></i></div>');
  // Se coloca justo debajo de la fila de botones que se ha pulsado (pestañas, modos de la agenda…)
  if (b && sec.contains(b)) { const fila = b.closest('.subnav, .cfgsubs, .acts, .segs') || b.parentElement; const rb = fila.getBoundingClientRect(); c.querySelector('.barraprog').style.top = Math.round(rb.bottom - r.top + 4) + 'px'; }
  document.body.appendChild(c); sec.style.minHeight = r.height + 'px';
  setTimeout(() => estable(sec, 3000, t0).then(() => { c.remove(); requestAnimationFrame(() => { sec.style.minHeight = ''; }); }), 0);
};
// Pestañas de la configuración de Facturación también
document.addEventListener('click', e => { const b = e.target.closest('main [data-fsub], main [data-faccfg]'); if (b && b.getAttribute('aria-pressed') !== 'true' && !b.classList.contains('on')) congelar(b.closest('main > section')); }, true);

/* ---------------- 2. Ayudas: breves, con enlace al manual ---------------- */

new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList.contains('aipop')) resumirAyuda(n); })
  .observe(document.body, { childList: true });
function resumirAyuda(pop) {
  const txt = pop.textContent || '';
  const lis = [...pop.querySelectorAll('li')];
  if (txt.length > 320 || lis.length > 3) {
    lis.slice(3).forEach(l => l.remove());
    // El texto principal se deja en su primera frase
    const w = document.createTreeWalker(pop, NodeFilter.SHOW_TEXT); let primero = true;
    while (w.nextNode()) { const x = w.currentNode; if (x.parentElement.tagName === 'B' || x.parentElement.closest('li')) continue;
      if (primero && x.nodeValue.length > 200) { const cut = x.nodeValue.slice(0, 200); x.nodeValue = cut.slice(0, Math.max(cut.lastIndexOf('. ') + 1, cut.lastIndexOf(' '))) + '…'; } primero = false; }
  }
  const mod = TAB;
  pop.insertAdjacentHTML('beforeend', `<a href="#" class="aiman">Ver más en el manual de uso →</a>`);
  pop.querySelector('.aiman').onclick = ev => {
    ev.preventDefault(); pop.remove(); ir('manual');
    setTimeout(() => { const q = $('manq'); const nom = (document.querySelector(`nav.main [data-t="${mod}"]`) || {}).textContent || mod; if (q) { q.value = nom.trim(); q.dispatchEvent(new Event('input', { bubbles: true })); } }, 350);
  };
}
// Texto explicativo de una tarjeta → ayuda «i» junto a su título
// v2.242.0: aquí iba textoAAyuda (nadie la usaba)

/* ---------------- 3. Facturación: Series, Registro y VeriFactu ---------------- */

new MutationObserver(() => ajustarFacturacion()).observe($('v-facturacion'), { childList: true, subtree: true });

/* ---------------- 4. Cuentas: el icono sigue el modo real (mapa o lista) ---------------- */

barraCuentas = (orig => function () {
  orig();
  const m = $('mapaBtn'); if (!m) return;
  const mapa = [...document.querySelectorAll('#v-directorio .leaflet-container, #v-directorio #mapa')].some(x => x.offsetParent);
  const quiere = mapa ? 'lista' : 'mapa';
  if (m.dataset.icono !== quiere || !m.querySelector('svg')) {
    m.dataset.icono = quiere; m.innerHTML = svgIco(ICON_NOM[quiere === 'lista' ? 'list' : 'map']);
    m.title = quiere === 'lista' ? 'Ver la lista' : 'Ver en el mapa'; m.setAttribute('aria-label', m.title);
  }
})(barraCuentas);

/* ---------------- 5. Diseño del PDF de la factura ---------------- */

const PDF_DEF = { logo: true, logoPos: 'izq', logoTam: 'm', color: '#1C2733', titulo: 'FACTURA', fuente: 'helvetica', empresaCab: false, clientePos: 'der',
  cols: { precio: true, unidades: true, subtotal: true, iva: true, total: true }, fotos: true, vencimiento: true, formaPago: true, iban: true, direccion: true,
  pieTel: true, pieWeb: true, pieTexto: true, paginas: true, qrPos: 'abajo' };
const cfgPDF = () => Object.assign({}, PDF_DEF, (AJUSTES || {}).factura_pdf || {}, { cols: Object.assign({}, PDF_DEF.cols, ((AJUSTES || {}).factura_pdf || {}).cols || {}) });
const hexRGB = h => { const x = (h || '#1C2733').replace('#', ''); return [0, 2, 4].map(i => parseInt(x.substr(i, 2), 16)); };
facturaPDF = async function (f, rectificaNum, cfgPrueba) {
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
};
async function disenoPDF() {
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
new MutationObserver(botonDisenoPDF).observe($('v-facturacion'), { childList: true, subtree: true });


/* ---------------- v2.62.0 · acceso: recordar el correo y mantener la sesión ---------------- */

(function () {
  const lu = $('lu'), f = $('lform'); if (!lu || !f) return;
  try { const c = localStorage.getItem('dlc-ultimo-correo'); if (c && !lu.value) { lu.value = c; setTimeout(() => { if ($('lp') && document.activeElement !== lu) $('lp').focus(); }, 50); } } catch (e) {}
  if (!$('lrecordar')) $('lbtn').insertAdjacentHTML('beforebegin', `<label class="opt lrecordar"><input type="checkbox" id="lrecordar" ${localStorage.getItem('dlc-no-recordar') ? '' : 'checked'}> Mantener la sesión iniciada en este dispositivo</label>`);
  f.addEventListener('submit', () => {
    try {
      localStorage.setItem('dlc-ultimo-correo', lu.value.trim());
      if ($('lrecordar').checked) localStorage.removeItem('dlc-no-recordar'); else localStorage.setItem('dlc-no-recordar', '1');
      document.cookie = 'dlc-sesion-viva=1; path=/; SameSite=Lax';   // cookie de sesión: dura hasta cerrar el navegador
    } catch (e) {}
  }, true);
})();


