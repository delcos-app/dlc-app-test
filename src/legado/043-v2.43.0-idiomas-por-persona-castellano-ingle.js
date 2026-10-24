/* ============================================================
   v2.43.0 · Idiomas por persona (castellano, inglés, alemán,
   francés e italiano), precios alineados con el mercado, paquete
   ampliado de notificaciones, logo neutro y ayudas «i» renovadas
   ============================================================ */

/* ---------------- logo: el de la empresa o uno neutro ---------------- */

;

/* ---------------- planes alineados con el mercado ---------------- */

PLANES.splice(0, PLANES.length,
  { id: 'esencial', nombre: 'Esencial', precio: 29, incluidos: 2, bloque: [1, 10], medicos: 0, para: `Para empezar a ordenar ${TT('visita', 'p', 'el', 'l', 'l')}`,
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento'],
    ventajas: [`Directorio de ${TT('medico', 'p', '', 'l', 'l')} y centros`, `Agenda, «Tu día» y registro de ${TT('visita', 'p', '', 'l', 'l')}`, 'Rutas optimizadas y planificación semanal', 'App móvil instalable'] },
  { id: 'profesional', nombre: 'Profesional', precio: 59, incluidos: 4, bloque: [1, 10], medicos: 0, para: 'Para equipos que venden y miden',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica'],
    ventajas: ['Todo lo de Esencial', 'Pedidos, clientes y llamadas', 'Productos y stock por lotes', 'Analítica, ranking y comisiones'] },
  { id: 'avanzado', nombre: 'Avanzado', precio: 99, incluidos: 7, bloque: [1, 10], medicos: 25, para: 'Con facturación y varios comerciales',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Profesional', 'Facturación con VeriFactu y cobros', 'Compras, proveedores y trazabilidad', `Zonas, supervisión y espacio ${TT('medico', 's', 'del', 'l', 'l')} (25)`] },
  { id: 'premium', nombre: 'Premium', precio: 179, incluidos: 15, bloque: [1, 8], medicos: null, para: 'Redes comerciales completas',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Avanzado', `Espacio ${TT('medico', 's', 'del', 'l', 'l')} sin límite`, 'Impersonalización de usuarios y auditoría', 'Soporte prioritario y ayuda con la migración'] });
async function pintarPlan2() {
  await pintarPlan2Base();
  const c = $('cfgcuerpo'); if (!c) return;
  // Textos del modelo por usuario (en lugar de bloques)
  c.querySelectorAll('.plan .sm').forEach(s => { s.textContent = s.textContent.replace(/\+1 usuarios por (.+?)\/mes/, 'usuario extra: $1/mes'); });
  const b = $('plbloque'); if (b) b.textContent = b.textContent.replace(/Añadir un bloque de 1 usuarios \((.+)\)/, 'Añadir un usuario extra ($1)');
  c.querySelectorAll('.manlist li span:last-child').forEach(li => {
    if (/bloques de usuarios/.test(li.textContent)) li.textContent = 'Cada plan incluye usuarios; si el equipo crece, se añaden usuarios sueltos sin cambiar de plan.';
    if (/dos meses gratis/.test(li.textContent)) li.textContent = 'Pago mensual con tarjeta, sin permanencia.';
  });
  const act = c.querySelector('.planact .sm'); if (act) act.textContent = act.textContent.replace(/ \+ (\d+) bloques? de 1/, ' + $1 extra');
}

/* ---------------- notificaciones ampliadas ---------------- */

TIPOS_NOTIF.push(
  ['citas_hoy', '📅', 'Mis citas de hoy', 'Al empezar el día, cuántas citas tienes'],
  ['sin_visitar', '⏳', `${TT('medico', 'p', '', 'l', 'C')} sin visitar`, `Los lunes, ${TT('medico', 'p', '', 'l', 'l')} de tu cartera con más de 60 días sin ${TT('visita', 's', '', 'l', 'l')}`],
  ['cliente_nuevo', '🧑‍⚕️', `${TT('paciente', 'p', '', 'l', 'C', 'nuevo')} de mi cartera`, `Cuando se da de alta un cliente que viene de ${TT('medico', 's', 'un', 'l', 'l', 'tuyo')}`],
  ['pago_recibido', '💳', 'Pagos de mis pedidos', 'Cuando se cobra un pedido que creaste'],
  ['borrador_nuevo', '✏️', 'Pedidos en borrador', 'Cuando alguien deja un pedido pendiente de confirmar'],
  ['seguimientos_hoy', '📞', 'Llamadas de seguimiento', 'Al empezar el día, las llamadas que tocan hoy'],
  ['pagos_pendientes', '⌛', 'Pagos pendientes', 'Al empezar el día, pedidos con el pago pendiente hace más de una semana'],
  ['facturas_vencidas', '🧾', 'Facturas vencidas', 'Al empezar el día, facturas vencidas sin cobrar'],
  ['stock_minimo', '📉', 'Stock bajo', 'Cuando un producto baja de su stock mínimo'],
  ['lotes_caducan', '⚠️', 'Lotes que caducan', 'Al empezar el día, lotes que caducan en 30 días'],
  ['compra_recibida', '🚚', 'Mercancía recibida', 'Cuando se registra la recepción de una compra'],
  ['rectificativa', '↩️', 'Facturas rectificativas', 'Cada rectificativa que se emite'],
  ['duplicado', '🧩', 'Posibles duplicados', 'Cuando una ficha se marca como posible duplicado'],
  ['usuario_nuevo', '👤', 'Usuarios nuevos', 'Cuando se da de alta una persona'],
  ['esquema', '€', 'Mi comisión', 'Cuando te asignan un esquema de comisión']);
// Resumen del día: se genera la primera vez que se abre la plataforma cada día
// Configuración de notificaciones agrupada

/* ---------------- idiomas ---------------- */

let IDIOMA = 'es', MAPA_I18N = null;
let TR_PEND = new Set(), TR_RAF = 0;
new MutationObserver(ms => {
  if (!MAPA_I18N) return;
  ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) TR_PEND.add(n); else if (n.nodeType === 3 && n.parentElement) TR_PEND.add(n.parentElement); }));
  if (TR_RAF) return;
  TR_RAF = 1; queueMicrotask(() => { TR_RAF = 0; const l = [...TR_PEND]; TR_PEND.clear(); l.forEach(n => n.isConnected && traducir(n)); });
}).observe(document.body, { childList: true, subtree: true });
// Fechas en el idioma elegido
fechaLarga = (orig => function (d) { return IDIOMA === 'es' ? orig(d) : new Date(d).toLocaleDateString(LOCALES[IDIOMA], { weekday: 'long', day: 'numeric', month: 'long' }); })(fechaLarga);
prepararIdioma((() => { try { return localStorage.getItem('app-idioma') || 'es'; } catch (e) { return 'es'; } })());
if (MAPA_I18N) traducir(document.body);
// Selector de idioma en Mi perfil


