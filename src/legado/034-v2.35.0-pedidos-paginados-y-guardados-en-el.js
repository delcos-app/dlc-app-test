/* ============================================================
   DLC OS 2.0 · v2.35.0 · Pedidos paginados y guardados en el dispositivo,
   factura en PDF como la de Holded y envío por email con el PDF adjunto,
   manual renovado y punto de salida sin valor por defecto
   ============================================================ */

Object.assign(RPC_TTL, { pedidos_pagina: 30 });

/* ---------------- punto de salida: cada persona configura el suyo ---------------- */

document.addEventListener('click', e => { if (e.target.closest('[data-irprefs]')) { CFG_SEC = 'prefs'; ir('config'); } });

/* ---------------- Pedidos → Ventas: por páginas y guardado en el dispositivo ---------------- */

let PEDPAG = 0;
let PEDF = {};   // v2.88.0: filtros por campos del pedido (Clasificadores)
// Cualquier cambio de filtro vuelve a la primera página
document.addEventListener('change', e => { if (e.target.closest('#pper, #pcanal, #pestado')) PEDPAG = 0; }, true);
document.addEventListener('input', e => { if (e.target.id === 'pq') PEDPAG = 0; }, true);

/* ---------------- paginación también en facturas y llamadas ---------------- */

let FACPAG = 0, LLPAG = 0;

/* ---------------- factura en PDF (mismo formato que Holded) ---------------- */

let LOGO_DATA = null;

// (v2.183.0: aquí iba la primera versión de facturaPDF; se redefine entera más abajo)
const nombrePDF = f => `${f.numero}_${String((f.cliente || {}).nombre || 'cliente').replace(/[^\p{L}\p{N} ]/gu, '').trim().replace(/\s+/g, '_')}.pdf`;

async function descargarFacturaPDF(f, rn) {
  const doc = await facturaPDF(f, rn); doc.save(nombrePDF(f));
  await db.from('eventos_facturacion').insert({ tipo: 'PDF descargado', factura_id: f.id, detalle: {} }).then(() => {}, () => {});
}

async function enviarFacturaEmail(f, rn) {
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


/* ---------------- email con los datos de pago: envío directo si está configurado ---------------- */

document.addEventListener('click', async e => {
  const a = e.target.closest('#pdmailpago');
  if (!a) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (!((AJUSTES.empresa || {}).iban || '').trim()) { toast('Falta el IBAN: ponlo en Configuración → Facturación → Datos fiscales antes de enviar los datos de pago', true); return; }   // v2.306.0
  const href = new URL(a.href.replace(/^mailto:/, 'http://x/?to=').replace('?subject', '&subject'));
  const para = decodeURIComponent(href.searchParams.get('to') || ''), asunto = href.searchParams.get('subject') || '', texto = href.searchParams.get('body') || '';
  const { data, error } = await db.functions.invoke('enviar_email', { body: { para, asunto, texto, pedido_id: a.dataset.ped || null, marca: 'email_pago' } });
  if (!error && data && data.ok) { toast('Email con los datos de pago enviado'); return; }
  location.href = a.href;   // sin envío directo: se abre el correo del dispositivo
}, true);

/* ---------------- datos fiscales: web de la empresa para el pie de la factura ---------------- */

pintarEmpresa = (orig => async function () {
  await orig();
  if ($('em_web')) return;
  const e = AJUSTES.empresa || {};
  $('em_email').closest('.g2').insertAdjacentHTML('afterend', `<div class="g2"><div><label for="em_web">Web</label><input id="em_web" value="${esc(e.web || '')}" placeholder="www.tuempresa.com"></div><div></div></div>`);
  const ok = $('emok').onclick;
  $('emok').onclick = async () => { await ok(); AJUSTES.empresa = Object.assign({}, AJUSTES.empresa, { web: $('em_web').value.trim() });
    await db.rpc('guardar_ajuste', { p_clave: 'empresa', p_valor: AJUSTES.empresa }); };
})(pintarEmpresa);

/* ---------------- manual de uso renovado ---------------- */

const ICONOS_MANUAL = { roles: '👥', inicio: '🏠', agenda: '📅', rutas: '🧭', directorio: '🩺', centros: '🏥', visitas: '📝', ventas: '🛒',
  config: '⚙️', admin: '🛡️', facturacion: '🧾', permisos: '🔐' };
const PRIMEROS_PASOS = {
  cartera: [['📍', 'Configura tu punto de salida', 'Configuración → Preferencias. Con él se calculan las horas de tus rutas.', 'config'],
    ['📅', 'Planifica tu semana', `Agenda → Semana → «Planificar la semana». Reparte a tus ${TT('medico', 'p', '', 'l', 'l')} por días.`, 'agenda'],
    ['▶', 'Empieza la jornada', `Agenda → Tu día → «Empezar jornada» y registra cada ${TT('visita', 's', '', 'l', 'l')} al terminarla.`, 'agenda']],
  televenta: [['🛒', 'Crea y confirma pedidos', 'Pedidos → Ventas → «+ Nueva venta»: cliente, qué quiere y pedido. Al confirmarlo sale del stock.', 'ventas'],
    ['📞', 'Cierra cada venta', '«+ Nueva venta» queda en Pedidos → Oportunidades aunque no acabe en pedido: así se ve por qué.', 'ventas'],
    ['✅', 'Cierra la operativa', 'Anota el cobro, prepara el paquete y envía la factura desde el pedido.', 'ventas']],
  default: [['🏠', 'Revisa Inicio', 'Indicadores, alertas y tu semana de un vistazo.', 'inicio'],
    ['👥', 'Mira el equipo', 'Agenda → Equipo: cumplimiento de cada persona.', 'agenda'],
    ['📊', 'Analiza los resultados', 'Analítica → Resumen, con gráficos explicados.', 'analitica']]
};

/* cargarManual: la parte base y, en orden, cada paso que se le añade (antes eran 3 capas separadas). */
async function cargarManual() {
  await cargarManualBase();
  await cargarManualPaso1();
  await cargarManualPaso2();
  await cargarManualPaso3();
}





/* ---------------- ayudas ---------------- */

AYUDA.facturacion[2].push('<b>⬇ PDF</b> descarga la factura en PDF, lista para enviar. <b>✉️ Enviar por email</b> la manda al cliente con el PDF adjunto desde el correo de la empresa.');
AYUDA.ventas[2].push('El listado va por páginas y se guarda en el dispositivo: si vuelves a él, aparece al momento mientras se actualiza. Filtra por operativa para ver los pendientes de cobro, paquetes por preparar o facturas por enviar.');

// Aviso de punto de salida en el plan y en «Tu día»


