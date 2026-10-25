/* ============================================================
   DLC OS 2.0 · v2.36.0 · Identidad visual, selectores propios de fecha,
   hora y número, espacio del médico con avisos, alertas en ventana,
   asignación de comisiones con fecha desde Comisiones y restablecer
   pruebas solo para la persona responsable
   ============================================================ */

Object.assign(RPC_TTL, { informe_cuenta: 60, mis_notificaciones: 20, asignaciones_esquema_lista: 30 });

/* ---------------- selectores propios: fecha, hora y número ---------------- */

let SELPOP = null, LOGO_CIRC = false;

// (v2.183.0: aquí iba la primera versión de abrirCalendario; se redefine entera más abajo)

// (v2.183.0: aquí iba la primera versión de abrirReloj; se redefine entera más abajo)

function valorVisibleBase(inp) { return window.delcos.legacyB.showVisibleValue(inp); }
window.delcos.legacyB.listenToPickers();

/* ---------------- espacio del médico ---------------- */

// Vincular un usuario de tipo Médico con su ficha (Administración → Usuarios → Editar)

MANUAL.push({ id: 'medico', t: `Espacio ${TT('medico', 's', 'del', 'l', 'l')}`, a: null, para: `${TT('medico', 'p', 'el', 'C', 'l')} con usuario ven su portal: cifras agregadas, sin importes ni datos de personas.`,
  hacer: [[3, 'Crear el usuario con un rol de portal y vincularlo a su ficha (Configuración → Usuarios → Editar)']],
  config: [`${TT('medico', 's', 'el', 'C', 'l')} ve unidades, ventas, ${TT('paciente', 'p', '', 'l', 'l')} (solo el número) y las llamadas de sus ${TT('paciente', 'p', '', 'l', 'l')}. Nunca importes ni nombres.`] });
ICONOS_MANUAL.medico = '🩺';
