// @ts-check
// servicios/planes.js · está en src/app/core/plans.ts y core/permissions.ts (v2.425.0). El plan de la empresa (PLAN_ACTUAL, que cambian el
// arranque, Configuración y las pruebas) se queda aquí, y estos nombres también. Normas: docs/normas_codigo.md.

function verImportes() { return window.delcos.core.permissions.canSeeAmounts(); }

// Qué permiso abre cada módulo
const MODULO_AREA = window.delcos.core.permissions.MODULE_AREA;

let PLAN_ACTUAL = { plan: 'medida' };   // v2.117.0: hasta que llega el de la base, el completo

function planDe(id) { return window.delcos.core.plans.planOf(id); }
// v2.165.0: sin Facturación en el plan pero con facturas, se entra en solo consulta (facConsulta)
function planIncluye(mod) { return window.delcos.core.plans.planIncludes(mod); }
function planMinimo(mod) { return window.delcos.core.plans.minimumPlan(mod); }
function tiposDeMiRol() { return window.delcos.core.plans.notificationTypesOfRole(); }
// Filas de la comparativa: [nombre, detalle, planes que lo incluyen]
function PLAN_FILAS() { return window.delcos.core.plans.planRows(); }
function planIncluyeSeccion(t) { return window.delcos.core.plans.planIncludesSection(t); }
function PLAN_NOMBRE() { return window.delcos.core.plans.currentPlanName(); }
function rangoPlan(k) { return window.delcos.core.plans.planRank(k); }
// Igual que la función «pagos»: plan menor, menos usuarios o de anual a mensual
function esBajada(de, a) { return window.delcos.core.plans.isDowngrade(de, a); }
function avisoPlan(mod) { return window.delcos.core.plans.planNotice(mod); }

/* v2.158.0 · Oportunidades y el portal entran en los planes (decisión de Eric, 3/10/2026; los precios no cambian). Oportunidades en
   Comercial, Empresa y A medida; el portal del profesional y del centro en Empresa (hasta 50) y A medida (sin límite). El plan los
   activa y el botón «Extras» del panel delcos queda para excepciones (tiene_extra, SQL 99, hace lo mismo en la base). */
const PLAN_EXTRAS = window.delcos.core.plans.PLAN_EXTRAS;

/* v2.163.0 · Compras y Proveedores son del plan Empresa (y A medida): en Campo y Comercial salen con candado y explican cómo
   conseguirlos, igual que Facturación. Con el plan A medida no se contrata ni se cambia en línea (presupuesto: lo lleva delcos). */
const PLAN_SECCIONES = window.delcos.core.plans.PLAN_SECTIONS;
