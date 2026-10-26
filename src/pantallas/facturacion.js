// @ts-check
// pantallas/facturacion.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function emitir(inp) { inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); }

// v2.113.0 · Unidades de la ficha por semana (12), mes (12) o año (5)

const UDS_SERIES = [['semana', window.delcos.t('legacyTexts.billingSettings.week')], ['mes', window.delcos.t('legacyTexts.billingSettings.month')], ['anio', window.delcos.t('legacyTexts.billingSettings.year')]];

 // v2.440.0: FSEC → estado de src/app (plan 6.6), accesible en window

const fac = fn => () => { $('cfgcuerpo').innerHTML = '<div id="fcuerpo"></div>'; fn(); };

const FAC_CONFIG = [['empresa', window.delcos.t('legacyTexts.billingSettings.companyData')], ['series', window.delcos.t('legacyTexts.billingSettings.series')], ['verifactu', 'VeriFactu'], ['registro', window.delcos.t('legacyTexts.billingSettings.log')]];

 // v2.440.0: FAC_ULTIMA → estado de src/app (plan 6.6), accesible en window

/* v2.121.0 · Página «Organización» (menú de usuario, arriba): marca, correo, copias, plan y facturación de la empresa, solo para el
   Propietario (configurar_organizacion) y el Administrador de la plataforma (gestionar_plataforma). Empresa y Plan pasan a ser
   pestañas suyas; Configuración se queda con lo del día a día. Y en escritorio, las ventanas de Configuración y de estas páginas
   se abren dentro del área de contenido, no por encima. */
// Las pestañas de facturación usan #fcuerpo, como el módulo Facturación: su pantalla se vacía para no tener dos (se rehace al volver)

const facOrg = fn => () => { const v = $('v-facturacion'); if (v) v.innerHTML = ''; fac(fn)(); };

const facSinPlan = () => { try { return !['empresa', 'medida'].includes((PLAN_ACTUAL || {}).plan); } catch (e) { return false; } };

/* ---------------- Analítica: cifras que cuentan y línea de seis meses ---------------- */

const AN_SERIE = new Map();

// Facturación está en src/app/screens/billing (v2.413.0). Estos nombres se quedan: el menú, la caché de pantallas (legado 057),
// la barra de configuración, Configuración, Organización, Pedidos, «‹ Volver» (legado 089), la ventana amplia y las pruebas los usan.
function cargarFacturacion() { return window.delcos.screens.billing.loadBilling(); }
function verFactura(id) { return window.delcos.screens.billing.showInvoice(id); }
function pintarSeries() { return window.delcos.screens.billing.paintSeries(); }
function pintarVerifactu() { return window.delcos.screens.billing.paintVerifactu(); }

// Emitir, la vista previa, las facturas del pedido y el correo están en src/app/screens/billing/issue (v2.427.0). Estos nombres
// se quedan: Pedidos, el plan, Organización y la capa de pantallas los usan.
function facConsulta() { return window.delcos.screens.billing.readOnlyBilling(); }
function cobroDe(p) { return window.delcos.screens.billing.paymentStateOf(p); }
function ajustarFacturacion() { return window.delcos.screens.billing.arrangeBilling(); }
function pedidoFacturas(id) { return window.delcos.screens.billing.paintOrderInvoices(id); }
function enviarFacturaEmail(f, rn) { return window.delcos.screens.billing.sendInvoiceByEmail(f, rn); }
