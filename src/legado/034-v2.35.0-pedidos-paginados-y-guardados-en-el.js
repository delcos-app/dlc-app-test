/* ============================================================
   DLC OS 2.0 · v2.35.0 · Pedidos paginados y guardados en el dispositivo,
   factura en PDF como la de Holded y envío por email con el PDF adjunto,
   manual renovado y punto de salida sin valor por defecto
   ============================================================ */

Object.assign(RPC_TTL, { pedidos_pagina: 30 });

/* ---------------- punto de salida: cada persona configura el suyo ---------------- */

document.addEventListener('click', e => { if (e.target.closest('[data-irprefs]')) { CFG_SEC = 'prefs'; ir('config'); } });

/* ---------------- Pedidos → Ventas: por páginas y guardado en el dispositivo ---------------- */

// Cualquier cambio de filtro vuelve a la primera página
document.addEventListener('change', e => { if (e.target.closest('#pper, #pcanal, #pestado')) PEDPAG = 0; }, true);
document.addEventListener('input', e => { if (e.target.id === 'pq') PEDPAG = 0; }, true);

/* ---------------- paginación también en facturas y llamadas ---------------- */

let FACPAG = 0, LLPAG = 0;

/* ---------------- factura en PDF (mismo formato que Holded) ---------------- */






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

async function pintarEmpresaBase2() {
  await pintarEmpresaBase();
  if ($('em_web')) return;
  const e = AJUSTES.empresa || {};
  $('em_email').closest('.g2').insertAdjacentHTML('afterend', `<div class="g2"><div><label for="em_web">Web</label><input id="em_web" value="${esc(e.web || '')}" placeholder="www.tuempresa.com"></div><div></div></div>`);
  const ok = $('emok').onclick;
  $('emok').onclick = async () => { await ok(); AJUSTES.empresa = Object.assign({}, AJUSTES.empresa, { web: $('em_web').value.trim() });
    await db.rpc('guardar_ajuste', { p_clave: 'empresa', p_valor: AJUSTES.empresa }); };
}

/* ---------------- manual de uso renovado ---------------- */

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






/* ---------------- ayudas ---------------- */

AYUDA.facturacion[2].push('<b>⬇ PDF</b> descarga la factura en PDF, lista para enviar. <b>✉️ Enviar por email</b> la manda al cliente con el PDF adjunto desde el correo de la empresa.');
AYUDA.ventas[2].push('El listado va por páginas y se guarda en el dispositivo: si vuelves a él, aparece al momento mientras se actualiza. Filtra por operativa para ver los pendientes de cobro, paquetes por preparar o facturas por enviar.');

// Aviso de punto de salida en el plan y en «Tu día»


