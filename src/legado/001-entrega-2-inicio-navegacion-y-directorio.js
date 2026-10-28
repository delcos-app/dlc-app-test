// @ts-check
/* ============================================================
   DLC OS 2.0 · Entrega 2: inicio, navegación y directorio
   v2.424.0: lo que hacía este archivo está en src/app (core/legacy-a: arranque, base de datos, cambio de pantalla y escuchas
   del marco). Aquí queda el estado global que lee el resto del código antiguo y las llamadas en su sitio del orden de carga.
   ============================================================ */

const CFG = window.DLC_CONFIG;
// Enlace del correo de recuperación o de bienvenida (invitación): se detecta antes de que se procese
const INVITACION_URL = window.delcos.legacyA.linkKind.invitation();
const RECUPERACION_URL = window.delcos.legacyA.linkKind.recovery();
const ENLACE_CADUCADO = window.delcos.legacyA.linkKind.expired();
window.delcos.legacyA.forgetUnrememberedSession();

const FN_NEUTRAS = new Set(['actividad_mensual', 'agenda_metricas', 'analitica_kpis', 'analitica_kpis_periodo', 'analitica_v2', 'buscar_centros', 'buscar_cuentas',
  'buscar_global', 'cartera_usuario', 'clientes_lista', 'constancia_pacientes', 'contacto_detalle', 'contactos_lista', 'ficha_centro', 'ficha_cuenta', 'guardar_cuenta',
  'importar_lote', 'informe_cuenta', 'llamadas_lista', 'llamadas_resumen', 'llamadas_seguimiento', 'panel_inicio', 'pedido_detalle', 'pedidos_lista',
  'pedidos_pagina', 'pedidos_pagina_base', 'plan_uso', 'resumen_inicio', 'resumen_seguimiento', 'rutas_candidatos', 'seguimiento_lista',
  'sugerencias_centros', 'supervision_equipo', 'toca_actividad', 'trazabilidad_lote', 'usuarios_lista', 'usuarios_resumen', 'zonas_resumen']);
const RE_NEUTRAS = new RegExp('"(' + Object.keys(CLAVES_NEUTRAS).join('|') + ')"\\s*:');

const db = window.supabase.createClient(CFG.url, CFG.anon, window.delcos.legacyA.databaseOptions());

 // v2.440.0: PERFIL, TAB → estado de src/app (plan 6.6), accesible en window

TERMINOS = window.delcos.legacyA.storedObject(TERMKEY);
ROLES_DEF = window.delcos.legacyA.storedList(ROLKEY);
ESTADOS_DEF = window.delcos.legacyA.storedList(ESTKEY);

// Acceso, menú de usuario, menú principal, tarjetas de Inicio, buscador, filtros y fichas del directorio
window.delcos.legacyA.startShell();

/* irBase: el cambio de pantalla en sí, ya en src/app/core/legacy-a/switch-screen.ts. ir(): las reglas (redirecciones, bloqueos y
   lo que pasa antes y después) están en src/app/core/navigation (v2.386.0). Los dos nombres se quedan para el código antiguo. */

let UDS_SERIE = (() => { try { const v = localStorage.getItem('dlc-uds-serie'); return ['semana', 'mes', 'anio'].includes(v) ? v : 'mes'; } catch (e) { return 'mes'; } })();
const leyendaUnidades = k => window.delcos.legacyA.unitsLegend(k);

window.delcos.legacyA.registerServiceWorker();
