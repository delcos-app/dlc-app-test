// pantallas/facturacion.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.










async function emitirFacturaPedido(pedidoId, o = {}) {
  const { data: pd } = await RPC_ORIG('pedido_detalle', { p_id: pedidoId });
  const cli = pd && pd.contacto;
  const aviso = !cli ? '\n\n⚠ El pedido no tiene cliente: la factura saldrá sin destinatario. Para una factura completa, asigna antes un cliente con su NIF.'
    : !cli.nif ? `\n\n⚠ ${cli.nombre} no tiene DNI o CIF en su ficha: conviene añadirlo antes para una factura completa.` : '';
  if (!o.yaVista && !await preguntar('Se emite la factura con el número siguiente de la serie. Una vez emitida no se puede modificar ni borrar: si hay un error se corrige con una rectificativa.' + aviso,
    { titulo: '¿Emitir la factura?', ok: 'Emitir factura' })) return null;
  const { data: r, error } = await db.rpc('emitir_factura', { p_pedido: pedidoId });
  if (error || (r && r.ok === false)) {
    toast(r && r.error === 'ya_facturado' ? 'Este pedido ya tiene la factura ' + r.numero : r && r.error === 'no_validado' ? 'Solo se facturan pedidos confirmados' : r && r.error === 'distribuidor' ? 'Este pedido lo factura el distribuidor' : r && r.error === 'sin_cargo' ? 'Una entrega sin cargo no se factura' : 'No se ha podido emitir: ' + ((error && error.message) || (r && r.error)), true);
    return null;
  }
  toast('Factura ' + r.numero + ' emitida');
  return r;
}

function ajustarFacturacion() {
  if (TAB !== 'facturacion') return;
  const cu = $('fcuerpo'); if (!cu) return;
  if (FSEC === 'series') {
    const nb = [...cu.querySelectorAll('button')].find(x => /nueva serie/i.test(x.textContent));
    const barra = cu.querySelector('.tbarra, .filtros.conbtn');
    if (nb && barra && nb.parentElement !== barra) { const hb = barra.querySelector('.htbtn'); nb.classList.add('tbacc'); hb ? barra.insertBefore(nb, hb) : barra.appendChild(nb); }
  }
  // Series y Registro: su texto explicativo pasa a una ayuda «i» al principio de la barra de la tabla
  if (FSEC === 'series' || FSEC === 'registro') {
    const barra = cu.querySelector('.tbarra, .filtros.conbtn');
    if (barra && !barra.querySelector('.ai')) {
      const txt = [cu.querySelector('.panel > .cuenta'), FSEC === 'series' ? cu.querySelector('.panel > p.sm') : null].filter(Boolean);
      if (txt.length) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'ai'; b.textContent = 'i'; b.setAttribute('aria-label', 'Ayuda');
        b.dataset.ayudaTit = FSEC === 'series' ? 'Series y numeración' : 'Registro de facturación';
        b.dataset.ayudaTxt = txt.map(x => { const c = x.cloneNode(true); c.querySelectorAll('button').forEach(y => y.remove()); return c.textContent.trim().replace(/\s+/g, ' '); }).join(' ');
        barra.insertBefore(b, barra.firstChild); txt.forEach(x => x.remove());
      }
    }
  }
}

// Factura de ejemplo para la vista previa
function facturaEjemplo() {
  // Los datos reales de la empresa (Facturación → Configuración → Datos fiscales); de ejemplo solo lo que falte
  const real = Object.fromEntries(Object.entries((AJUSTES || {}).empresa || {}).filter(([, v]) => v));
  if (real.poblacion && !real.municipio) real.municipio = real.poblacion;
  const e = Object.assign({ razon_social: nombreApp(), nif: 'B00000000', direccion: 'Calle Mayor 1', cp: '08001', municipio: 'Barcelona', telefono: '930 000 000', web: 'www.tuempresa.com', email: 'hola@tuempresa.com', iban: 'ES00 0000 0000 0000 0000 0000', pie: 'Gracias por su confianza.' }, real);
  const pr = (PRODUCTOS[0] || { nombre: 'Producto de ejemplo' }).nombre;
  return { numero: 'F260001', fecha: hoyISO(), vencimiento: hoyISO(), emisor: e, forma_pago: 'Transferencia bancaria',
    cliente: { nombre: 'Cliente de ejemplo', nif: '12345678Z', direccion: 'Avenida Diagonal 100', municipio: 'Barcelona', cp: '08018', provincia: 'Barcelona', email: 'cliente@correo.es' },
    lineas: [{ descripcion: pr + ' · caja de 60 cápsulas', precio: 41.82, unidades: 2, base: 83.64, iva: 10 }, { descripcion: 'Envío', precio: 5, unidades: 1, base: 5, iva: 21 }],
    base: 88.64, desglose_iva: [{ iva: 10, cuota: 8.36 }, { iva: 21, cuota: 1.05 }], total: 98.05, verifactu: {} };
}

// Botón en Facturas (administración)
function botonDisenoPDF() {
  return;   // v2.87.0: el diseño del PDF está en la configuración de facturación, no en Facturas
  if (TAB !== 'facturacion' || FSEC !== 'facturas' || !PERFIL || !puede('administrar') || $('fpdfbtn')) return;
  const acts = document.querySelector('#v-facturacion .saludo .acts'); if (!acts) return;
  acts.insertAdjacentHTML('afterbegin', `<button class="btn sec" id="fpdfbtn" type="button">${svgIco(ICON_NOM.file)} Diseño del PDF</button>`);
  $('fpdfbtn').onclick = () => disenoPDF();
}

/* v2.165.0 · Bajar de plan con orden (decisiones de Eric, 4/10/2026):
   - A medida: no se baja desde la app; lo hace delcos desde su panel y no antes de la fecha de compromiso del contrato.
   - Las bajadas (plan menor, menos usuarios o de anual a mensual) se programan para el final del periodo pagado; las subidas, al momento.
     Antes de confirmar se enseña lo que se deja de tener. «Plan y suscripción» dice el cambio previsto (con «Anular el cambio») y la baja pedida.
   - Sin Facturación en el plan pero con facturas emitidas: Facturación en solo consulta (verlas y descargarlas, no emitir; la base lo impide). */
function facConsulta() {
  try { return !!(PAGO_ESTADO && PAGO_ESTADO.facturas) && !['empresa', 'medida'].includes((PLAN_ACTUAL || {}).plan); } catch (e) { return false; }
}

/* ============================================================
   v2.339.0 · Vista previa de la factura antes de emitirla (Eric, 20/10/2026). En el pedido, «Ver la factura» enseña el PDF tal como
   saldrá (mismas cuentas que emitir_factura: precio = importe / unidades, base con el descuento general repartido, envío como línea,
   desglose por tipo de IVA) con «VISTA PREVIA» y sin número; desde ahí, «Emitir factura». No guarda nada.
   ============================================================ */
function facturaDePedido(d) {
  const p = d.pedido, t = d.totales || {}, c = d.contacto || {};
  const emp = Object.fromEntries(Object.entries((AJUSTES || {}).empresa || {}).filter(([, v]) => v));
  if (emp.poblacion && !emp.municipio) emp.municipio = emp.poblacion;
  const bruto = +t.bruto || 0, k = bruto ? (+t.base_productos || 0) / bruto : 1, r2 = v => Math.round(v * 100) / 100;
  const lineas = (d.lineas || []).map(x => ({ descripcion: x.producto || 'Sin producto', unidades: +x.unidades || 0,
    precio: (+x.unidades ? (+x.importe || 0) / +x.unidades : 0), descuento: +x.descuento || 0, iva: +x.iva || 0,
    base: r2((+x.importe || 0) * (1 - (+x.descuento || 0) / 100) * k) }));
  if (p.envio) lineas.push({ descripcion: ((SERVICIOS || []).find(x => x.id === p.servicio_id) || {}).nombre || 'Envío', unidades: 1,
    precio: +p.envio_base || 0, descuento: 0, iva: +p.envio_iva || 0, base: r2(+p.envio_base || 0), servicio: true });
  const g = {}; lineas.forEach(l => { g[l.iva] = (g[l.iva] || 0) + l.base; });
  const desglose_iva = Object.keys(g).map(Number).sort((a, b) => a - b).map(iva => ({ iva, base: r2(g[iva]), cuota: r2(g[iva] * iva / 100) }));
  const base = r2(desglose_iva.reduce((a, x) => a + x.base, 0)), total = r2(desglose_iva.reduce((a, x) => a + x.base + x.cuota, 0));
  return { numero: 'Sin número hasta emitirla', fecha: hoyISO(), vencimiento: hoyISO(), emisor: emp, forma_pago: p.forma_pago || '',
    cliente: c.id ? { nombre: c.nombre, nif: c.nif, direccion: c.direccion, cp: c.cp, municipio: c.municipio, provincia: c.provincia, email: c.email } : {},
    lineas, base, desglose_iva, total, verifactu: {} };
}

async function previaFacturaPedido(id) {
  // v2.352.0: en su ventana grande, encima del pedido (que sigue abierto tal cual); se abre al momento con el cargador
  const d2 = $('dlg2');
  $('dlg2body').innerHTML = '<div class="fh"><div><h2>Vista previa de la factura</h2></div><button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div><div class="facprev facpcarga"><div class="spin"></div></div>';
  d2.classList.add('amplia'); d2.addEventListener('close', () => d2.classList.remove('amplia'), { once: true });
  if (!d2.open) d2.showModal();
  await cargarAjustes();
  const { data: d } = await RPC_ORIG('pedido_detalle', { p_id: id });
  if (!d2.open) return;
  if (!d || !d.pedido) { d2.close(); toast('No se ha podido leer el pedido', true); return; }
  const c = d.contacto, falta = !c ? `El pedido no tiene ${TT('paciente', 's', '', 'l', 'l')}: la factura saldrá sin destinatario.` : !c.nif ? `${esc(c.nombre)} no tiene DNI o CIF en su ficha: conviene añadirlo antes.` : '';
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>Vista previa de la factura</h2></div><button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    ${falta ? `<div class="banda-aviso facpaviso">${falta}</div>` : ''}
    <div class="facprev"><iframe id="facpif" title="Vista previa de la factura"></iframe></div>
    <p class="sm">Al emitirla se le da el número siguiente de la serie y ya no se puede modificar ni borrar: un error se corrige con una rectificativa.</p>
    <div class="acts"><button type="button" class="btn sec" data-cerrar2>Cancelar</button><button type="button" class="btn" id="facpemitir">Emitir factura</button></div>`;
  try {
    const C = Object.assign({}, cfgPDF()); C.titulo = (C.titulo || 'FACTURA') + ' · VISTA PREVIA';
    const doc = await facturaPDF(facturaDePedido(d), '', C);
    if ($('facpif')) $('facpif').src = doc.output('bloburl') + '#toolbar=0&navpanes=0&view=FitH';
  } catch (e) { toast('No se ha podido preparar la vista previa', true); registrarError('app', 'Vista previa de la factura', { e: String(e) }); }
  $('facpemitir').onclick = () => conCarga($('facpemitir'), 'Emitiendo…', async () => {
    const r = await emitirFacturaPedido(id, { yaVista: true });
    if (r) { d2.close(); verFactura(r.id); }
  });
}

// ---- PDF ----
function listaPDF() {
  const a = AJUSTES.factura_pdf_plantillas || {};
  if (Array.isArray(a.lista) && a.lista.length) return { lista: a.lista, defecto: a.defecto || a.lista[0].id };
  return { lista: [{ id: 'base', nombre: 'Diseño principal', cfg: AJUSTES.factura_pdf || {} }], defecto: 'base' };
}

async function guardarPDFPlantillas(v) {
  const { data: r, error } = await RPC_V2342('guardar_ajuste', { p_clave: 'factura_pdf_plantillas', p_valor: v });
  if (error || (r && r.ok === false)) { toast('No se han podido guardar las plantillas del PDF', true); return false; }
  AJUSTES.factura_pdf_plantillas = v; return true;
}

async function elegirPlantillaPDF() {
  const { lista, defecto } = listaPDF(); PDF_ELEGIDO = null;
  if (lista.length < 2) return true;
  const def = lista.find(x => x.id === defecto) || lista[0];
  const k = await elegirOpcion('¿Con qué diseño?', `Hay ${lista.length} diseños del PDF. El de por defecto es «${def.nombre}».`,
    [{ k: '', t: 'Cancelar', cls: 'sec' }, ...[def, ...lista.filter(x => x !== def)].map((x, i) => ({ k: x.id, t: x.nombre, cls: i ? 'sec' : '' }))]);
  if (!k) return false;
  PDF_ELEGIDO = k; return true;
}

function emitir(inp) { inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); }

// v2.113.0 · Unidades de la ficha por semana (12), mes (12) o año (5)
const UDS_SERIES = [['semana', 'Semana'], ['mes', 'Mes'], ['anio', 'Año']];

let FSEC = 'facturas';



const fac = fn => () => { $('cfgcuerpo').innerHTML = '<div id="fcuerpo"></div>'; fn(); };

const FAC_CONFIG = [['empresa', 'Datos fiscales'], ['series', 'Series y numeración'], ['verifactu', 'VeriFactu'], ['registro', 'Registro']];

let FAC_ULTIMA = 'empresa';

/* v2.121.0 · Página «Organización» (menú de usuario, arriba): marca, correo, copias, plan y facturación de la empresa, solo para el
   Propietario (configurar_organizacion) y el Administrador de la plataforma (gestionar_plataforma). Empresa y Plan pasan a ser
   pestañas suyas; Configuración se queda con lo del día a día. Y en escritorio, las ventanas de Configuración y de estas páginas
   se abren dentro del área de contenido, no por encima. */
// Las pestañas de facturación usan #fcuerpo, como el módulo Facturación: su pantalla se vacía para no tener dos (se rehace al volver)
const facOrg = fn => () => { const v = $('v-facturacion'); if (v) v.innerHTML = ''; fac(fn)(); };

const facSinPlan = () => { try { return !['empresa', 'medida'].includes((PLAN_ACTUAL || {}).plan); } catch (e) { return false; } };

/* ---------------- Analítica: cifras que cuentan y línea de seis meses ---------------- */
const AN_SERIE = new Map();

/* ============================================================
   v2.348.0 · Estados del pedido (Eric: A + B de https://claude.ai/artifact/TNX2JSHkXP6thEzunyUZ8b). «Validado» decía que el
   pedido estaba bien hecho, no que estuviera cobrado, y el indicador «Pagos por validar» usaba la misma palabra. Ahora:
   A · el estado es «Confirmado» y el cobro va aparte (Pendiente de cobro / Cobrado / Sin cargo);
   B · en la lista, el estado dice qué le falta: Borrador, Esperando pago, Por cobrar, Por preparar, Por facturar, Completado
   o Anulado. Se calcula con lo que ya se guarda. Con contrarreembolso se prepara antes de cobrar; con las demás formas de
   pago, primero se cobra (así, en «Pendientes de cobro» todos dicen «Por cobrar»).
   ============================================================ */
const cobroDe = p => p.sin_cargo || sinCargoP(p, p.total) ? 'Sin cargo' : p.pago_estado === 'Cobrado' || p.pago_validado_en ? 'Cobrado' : 'Pendiente de cobro';

// Ver pedido · Facturas del pedido, o botón para emitirla
async function pedidoFacturasBase(id) {
  if (!VE_TODO() || !$('dlg').open) return;
  const acts = $('dbody').querySelector('.acts:last-of-type'); if (!acts) return;
  const { data } = await RPC_ORIG('pedido_detalle', { p_id: id });
  const p = data && data.pedido; if (!p) return;
  const { data: fs } = await db.from('facturas').select('id,numero,pedido_id').eq('pedido_id', id);   // v2.350.0: solo las de este pedido
  const fac = fs || [];
  if (fac.length) {
    acts.insertAdjacentHTML('afterbegin', fac.map(f => `<button class="btn sec" data-pvfac="${f.id}">🧾 ${esc(f.numero)}</button>`).join(''));
    acts.querySelectorAll('[data-pvfac]').forEach(b => b.onclick = () => verFactura(b.dataset.pvfac));
  } else if (p.estado === 'Confirmado' && !p.sin_cargo && puedeFacturar()) {
    acts.insertAdjacentHTML('afterbegin', '<button class="btn" id="pvemitir">🧾 Ver la factura</button>');   // v2.339.0: primero la vista previa
    acts.querySelector('#pvemitir').onclick = () => previaFacturaPedido(id);
  }
}

async function enviarFacturaEmailBase(f, rn) {
  await cargarAjustes();
  const e = AJUSTES.empresa || {}, c = f.cliente || {};
  const saludo = c.nombre ? nombrePila(c.nombre) : '';
  $('dlg2body').innerHTML = `
    <div class="fh"><div><h2>Enviar ${esc(f.numero)} por email</h2><div class="sm">La factura va adjunta en PDF</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <label for="efp">Para</label><input id="efp" type="email" value="${esc(c.email || '')}" placeholder="email del cliente">
    <label for="efa">Asunto</label><input id="efa" value="${esc(plantillaCorreo('factura', 'asunto', varsCorreo({ documento: 'factura', numero: f.numero, importe: f.total, nombre: c.nombre })))}">
    <label for="eft">Mensaje</label><textarea id="eft" rows="12">${esc(plantillaCorreo('factura', 'texto', varsCorreo({ documento: 'factura', numero: f.numero, importe: f.total, nombre: c.nombre })))}</textarea>
    <div class="adjunto">📎 ${esc(nombrePDF(f))}</div>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn sec" data-cerrar2>Cancelar</button>
      <button class="btn" id="efok">Enviar</button></div>`;
  $('dlg2').showModal();
  $('efok').onclick = async ev => {
    const para = $('efp').value.trim(); if (!/\S+@\S+\.\S+/.test(para)) { toast('Escribe un email válido', true); return; }
    ev.target.disabled = true; ev.target.textContent = 'Preparando el PDF…';
    const doc = await facturaPDF(f, rn), b64 = doc.output('datauristring').split(',')[1];
    ev.target.textContent = 'Enviando…';
    let { data, error } = await db.functions.invoke('enviar_email', { body: { para, asunto: $('efa').value.trim(), texto: $('eft').value,
      adjuntos: [{ nombre: nombrePDF(f), base64: b64, tipo: 'application/pdf' }], factura_id: f.id, pedido_id: f.pedido_id, marca: 'email_factura' } });
    // Si la función responde con error, su motivo viene en el cuerpo de la respuesta
    if (error && error.context && typeof error.context.json === 'function') { try { data = await error.context.json(); } catch (x) {} }
    ev.target.disabled = false; ev.target.textContent = 'Enviar';
    if (!error && data && data.ok) { $('dlg2').close(); toast('Factura enviada a ' + para); return; }
    // Sin envío directo configurado: se ofrece compartir el PDF o descargarlo y adjuntarlo
    const sinSmtp = data && data.error === 'sin_smtp';
    const archivo = new File([doc.output('blob')], nombrePDF(f), { type: 'application/pdf' });
    const compartir = navigator.canShare && navigator.canShare({ files: [archivo] });
    $('dlg2body').innerHTML = `<div class="fh"><div><h2>${sinSmtp ? 'El envío directo aún no está configurado' : 'No se ha podido enviar'}</h2>
      <div class="sm">${sinSmtp ? 'Falta conectar el correo de la empresa (lo prepara administración).' : esc((error && error.message) || (data && data.error) || '')}</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
      <p>Puedes enviarla desde tu correo con el PDF adjunto:</p>
      <div class="acts" style="flex-wrap:wrap">${compartir ? '<button class="btn" id="efsh">Compartir el PDF (correo, WhatsApp…)</button>' : ''}
        <button class="btn ${compartir ? 'sec' : ''}" id="efdl">⬇ Descargar el PDF</button>
        <a class="btn sec" href="mailto:${esc(para)}?subject=${encodeURIComponent($('efa') ? $('efa').value : f.numero)}&body=${encodeURIComponent('Adjuntamos la factura ' + f.numero + '.')}">Abrir mi correo</a></div>
      <label class="opt" style="margin-top:12px"><input type="checkbox" id="efmarca"> Ya la he enviado: marcar el pedido como «Email con la factura enviado»</label>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar2>Cerrar</button></div>`;
    if ($('efsh')) $('efsh').onclick = () => navigator.share({ files: [archivo], title: f.numero, text: 'Factura ' + f.numero }).catch(() => {});
    $('efdl').onclick = () => doc.save(nombrePDF(f));
    $('efmarca').onchange = async ev2 => { if (ev2.target.checked && f.pedido_id) { await db.rpc('marcar_operativa', { p_pedido: f.pedido_id, p_campo: 'email_factura', p_hecho: true }); toast('Marcado como enviado'); } };
  };
}

// Desde el pedido: la factura se abre encima y al cerrarla vuelve el pedido tal como estaba
async function pedidoFacturas(id) {
  await pedidoFacturasBase(id);
  $('dbody').querySelectorAll('[data-pvfac]').forEach(b => b.onclick = () => abrirApilada(() => verFactura(b.dataset.pvfac), 'Volver al pedido'));
}

// Enviar la factura: plantilla del correo y diseño del PDF, en la propia ventana (si hay más de uno)
async function enviarFacturaEmail(f, rn, ...a) {
  PLANT_ELEGIDA.factura = null; PDF_ELEGIDO = null;
  const r = await enviarFacturaEmailBase.call(this, f, rn, ...a);
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
}

// Facturación está en src/app/screens/billing (v2.413.0). Estos nombres se quedan: el menú, la caché de pantallas (legado 057),
// la barra de configuración, Configuración, Organización, Pedidos, «‹ Volver» (legado 089), la ventana amplia y las pruebas los usan.
function cargarFacturacion() { return window.delcos.screens.billing.loadBilling(); }
function verFactura(id) { return window.delcos.screens.billing.showInvoice(id); }
function pintarSeries() { return window.delcos.screens.billing.paintSeries(); }
function pintarVerifactu() { return window.delcos.screens.billing.paintVerifactu(); }
