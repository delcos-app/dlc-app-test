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

let MAPA_I18N = null;   // (IDIOMA está en nucleo/idioma.js)
window.delcos.legacyB.watchTranslations();
// Selector de idioma en Mi perfil
