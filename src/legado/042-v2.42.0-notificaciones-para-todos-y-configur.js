/* ============================================================
   v2.42.0 · Notificaciones para todos y configurables, Mi perfil,
   Rutas y Mensajes como apartados propios, Material de visita y
   Almacenes explicados, controles compactos en Configuración,
   navegación de Configuración sin desplazarse y alta con resumen
   ============================================================ */

/* ---------------- notificaciones ---------------- */

const TIPOS_NOTIF = [
  ['pauta', '💊', 'Pautas registradas', 'Cada vez que se registra, se corrige o se anula una pauta'],
  ['venta_cartera', '🛒', 'Pedidos de mi cartera', `Cuando se confirma un pedido de ${TT('medico', 's', 'un', 'l', 'l')} que llevas`],
  ['cartera', '🩺', 'Cambios en mi cartera', `Cuando te asignan ${TT('medico', 'p', '', 'l', 'l', 'nuevo')}`],
  ['cruce', '🔁', `${TT('visita', 'p', '', 'l', 'C')} de otros a mi cartera`, `Cuando otra persona ${TT('visita', 's', '', 'l', 'l')} a ${TT('medico', 's', 'un', 'l', 'l')} que llevas`],
  ['pedido_validado', '📦', 'Pedidos confirmados', 'Cada pedido que se confirma (menos los tuyos)']
];
// (v2.183.0: aquí iba la primera versión de panelNotificaciones; se redefine entera más abajo)

// v2.242.0: aquí iba panelNotificacionesPaso1 (nadie la usaba)

// v2.242.0: aquí iba panelNotificacionesPaso2 (nadie la usaba)

// v2.242.0: aquí iba panelNotificacionesBase (nadie la usaba)
window.delcos.legacyB.pollBell();

/* ---------------- Mi perfil ---------------- */

// Al entrar, se abre el módulo elegido
