// pantallas/panel_delcos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// (v2.183.0: aquí iba la primera versión de reportarProblema; se redefine entera más abajo)
// Configuración → Seguridad y registro → Errores (administración)

/* ============================================================
   v2.86.0 · Organizaciones de la plataforma (fase 4): alta de empresas nuevas
   Solo quien tiene la capacidad «gestionar_plataforma» (el Administrador de la
   organización principal). Cada organización nace con sus roles, catálogos,
   series y ajustes, y su administrador queda invitado.
   ============================================================ */

// v2.117.0 · Organizaciones: plan de cada empresa, estado (prueba, terminada, desactivada), descargar sus datos y borrar las de prueba

// Menú de usuario: una sola entrada «Organización» en lugar de Empresa y Plan
function menuOrganizacion() { window.delcos.leftovers.menuOrganization(); }

// Organizaciones: los extras de cada empresa (los activa la plataforma)

// ---- Altas desde la web: completadas (con su empresa y si ya ha entrado) y a medias (empezaron el pago y no lo terminaron)

/* v2.125.0 · Nueva venta y Oportunidades. Un solo recorrido para vender (antes «Registrar llamada» y «+ Nuevo pedido» por separado):
   1 cliente (buscar o ficha nueva, con lo que ya sabemos de él), 2 qué quiere (productos y unidades, médico de referencia, cómo llegó),
   3 cómo termina (pedido o motivo de no compra y cuándo volver a llamar). Con el extra «Oportunidades» de la organización, cada venta
   queda registrada con su día y hora, lo que quería y cuánto, se cierre con pedido o no; sin él, el recorrido lleva al pedido. */
// v2.242.0: aquí iba la primera versión de hayOportunidades (se redefine entera más abajo)

// Panel delcos → Solicitudes

// Empresa y Plan (y los apartados de Configuración que se han movido) llevan a su pestaña de Organización
const ORG_DESDE = { marca: 'marca', correo: 'correo', copias: 'copias', __empresa: 'marca', empresa: 'marca', plan: 'plan', fact: 'fiscal', fiscal: 'fiscal',
  series: 'series', vf: 'vf', pdf: 'pdf', orgs: 'orgs' };

/* v2.171.0 · Panel delcos fuera de las empresas (decisión de Eric, 4/10/2026). El equipo de delcos entra con su propio usuario, que vive en
   la organización de plataforma (SQL 107); allí la app enseña SOLO el Panel delcos, con su menú: Clientes, Solicitudes, Errores, Accesos,
   Auditoría, Equipo delcos y Plantilla (roles y catálogos que reciben las empresas nuevas). Para ayudar a una empresa, «Entrar» desde
   Clientes (la app normal de esa empresa, con la franja «Estás viendo…») y «Salir» vuelve al panel. plan_uso dice si es la de plataforma. */
let MODO_PLATAFORMA = false;

const PANEL_SECCIONES = [['pd-orgs', 'orgs', 'Clientes', 'building-2'], ['pd-solicitudes', 'solicitudes', 'Solicitudes', 'mail'],
  ['pd-errores', 'errores', 'Errores', 'bug'], ['pd-accesos', 'accesos', 'Accesos', 'lock-keyhole'], ['pd-auditoria', 'auditoria', 'Auditoría', 'history'],
  ['pd-equipo', 'equipo', 'Equipo delcos', 'users'], ['pd-plantilla', 'plantilla', 'Plantilla', 'clipboard-list']];

const PANEL_DESC = { orgs: 'Las empresas que usan delcos: plan, dominios, extras y entrar a ayudarlas', cobros: 'Quién paga, quién está en prueba y qué recibos vienen',
  altas: 'Empresas que se han dado de alta desde www.delcos.app', solicitudes: 'Presupuestos A medida y conversaciones sobre el contrato',
  errores: 'Errores de la plataforma agrupados, de todas las empresas', estado: 'Versiones en uso, SQL aplicado y cifras generales',
  accesos: 'Entradas y salidas de la plataforma', auditoria: 'Cambios hechos en el panel', equipo: 'Las personas de delcos con acceso al panel',
  plantilla: 'Roles y catálogos que recibe cada empresa nueva' };

// Organizaciones (panel delcos): impago y cancelada a la vista

// ---- Estado de la plataforma: SQL aplicado, versión publicada y versiones que usa cada empresa

// ---- Uso del servicio de rutas en Estado de la plataforma

// Panel delcos → Organizaciones → Plan: fecha de compromiso (A medida), lo que pierde al bajar y aviso si paga con Stripe

// Panel delcos → Organizaciones: desactivar o volver a activar

// Panel delcos está en src/app/screens/platform (v2.413.0). Estos nombres se quedan: las pestañas del panel (legado 073, 075 y 076),
// Configuración → Errores, el arranque (franjaVista) y las pruebas los usan.
function pintarOrganizaciones() { return window.delcos.screens.platform.paintOrganizations(); }
function pintarCobrosDelcos() { return window.delcos.screens.platform.paintBilling(); }
function pintarAltasDelcos() { return window.delcos.screens.platform.paintSignups(); }
function pintarSolicitudesPlan() { return window.delcos.screens.platform.paintRequests(); }
function pintarErroresDelcos() { return window.delcos.screens.platform.paintPlatformErrors(); }
function pintarEstadoDelcos() { return window.delcos.screens.platform.paintStatus(); }
function pintarPlantillaDelcos(sub) { return window.delcos.screens.platform.paintTemplate(sub); }
function pintarErrores() { return window.delcos.screens.platform.paintCompanyErrors(); }
function franjaVista() { return window.delcos.screens.platform.paintViewBand(); }

// La ventana dentro del panel está en src/app/components/embedded-window (v2.422.0); este nombre se queda: Configuración y legado 001 lo usan.
function salirPanel() { return window.delcos.components.embeddedWindow.leavePanel(); }
