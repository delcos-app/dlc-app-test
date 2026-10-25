/* ============================================================
   DLC OS 2.0 · v2.35.0 · Pedidos paginados y guardados en el dispositivo,
   factura en PDF como la de Holded y envío por email con el PDF adjunto,
   manual renovado y punto de salida sin valor por defecto
   ============================================================ */

Object.assign(RPC_TTL, { pedidos_pagina: 30 });

/* ---------------- punto de salida: cada persona configura el suyo ---------------- */

window.delcos.legacyB.listenToOrderListLinks();

/* ---------------- Pedidos → Ventas: por páginas y guardado en el dispositivo ---------------- */

// Cualquier cambio de filtro vuelve a la primera página

/* ---------------- paginación también en facturas y llamadas ---------------- */

let FACPAG = 0, LLPAG = 0;

/* ---------------- email con los datos de pago: envío directo si está configurado ---------------- */

window.delcos.legacyB.listenToPaymentEmailLinks();

/* ---------------- datos fiscales: web de la empresa para el pie de la factura ---------------- */

function pintarEmpresaBase2() { return window.delcos.legacyB.paintCompanyData(); }

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
