/* ============================================================
   v2.42.0 · Notificaciones para todos y configurables, Mi perfil,
   Rutas y Mensajes como apartados propios, Material de visita y
   Almacenes explicados, controles compactos en Configuración,
   navegación de Configuración sin desplazarse y alta con resumen
   ============================================================ */

/* ---------------- notificaciones ---------------- */

const TIPOS_NOTIF = window.delcos.content.notificationTypes();
// (v2.183.0: aquí iba la primera versión de panelNotificaciones; se redefine entera más abajo)

// v2.242.0: aquí iba panelNotificacionesPaso1 (nadie la usaba)

// v2.242.0: aquí iba panelNotificacionesPaso2 (nadie la usaba)

// v2.242.0: aquí iba panelNotificacionesBase (nadie la usaba)
window.delcos.legacyB.pollBell();

/* ---------------- Mi perfil ---------------- */

// Al entrar, se abre el módulo elegido
