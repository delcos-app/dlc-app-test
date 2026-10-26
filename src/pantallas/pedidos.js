// @ts-check
// pantallas/pedidos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function nuevaVenta(pre) { return editorOportunidad(pre || null); }

// Al volver de Stripe: se espera a que llegue el aviso y el plan quede activo

// ---- Cobros y suscripciones: el estado de pago de cada empresa (de ajustes.plan, que mantiene el aviso de Stripe)

function pedsecVista() { return PEDSEC_CARGA || PEDSEC; }

const veVentas = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).V || 0) >= 1 || puede('cartera'));

let VSEC = 'pedidos';

const txtVentanas = v => v && v.length ? v.map(([a, b]) => `${txtMin(a)}–${txtMin(b)}`).join(' y ') : '';

 // v2.440.0: PEDPAG → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: PEDF → estado de src/app (plan 6.6), accesible en window   // v2.88.0: filtros por campos del pedido (Clasificadores)

// Pedidos, Oportunidades, Compras y Proveedores: cada uno su entrada en el menú (por dentro, el mismo módulo con su sección)
const ALIAS_PEDIDOS = { oportunidades: 'llamadas', compras: 'compras', proveedores: 'proveedores' };

const TITULO_PEDSEC = { ventas: ['Pedidos', window.delcos.t('legacyTexts.orderPages.sales')], llamadas: ['Oportunidades', window.delcos.t('legacyTexts.orderPages.opportunities')],
  compras: ['Compras', window.delcos.t('legacyTexts.orderPages.purchases')], proveedores: ['Proveedores', window.delcos.t('legacyTexts.orderPages.suppliers')] };

/* v2.162.0 · Suscripciones y pagos con Stripe (decisiones de Eric, 4/10/2026). «Plan y suscripción» ya no manda correos: «Contratar»
   abre el pago seguro de Stripe (tarjeta), «Cambiar a…» y «Añadir o quitar usuarios» cambian la suscripción con
   prorrateo y «Gestionar el pago» abre el portal de Stripe (tarjeta, recibos, cancelar). Todo pasa por la función de Supabase
   «pagos»; Stripe avisa a «stripe-webhook» y la base (aplicar_suscripcion, SQL 102) activa o cambia el plan. Si un cobro falla, aviso
   arriba durante 14 días y después la empresa queda en solo lectura (la base no deja crear, cambiar ni borrar) hasta que pague. */
const PAGO_PLANES = ['campo', 'comercial', 'empresa'];

 // v2.440.0: PAGO_ESTADO → estado de src/app (plan 6.6), accesible en window   // la respuesta de plan_uso (plan, usuarios, solo_lectura)

const pagoAlPlan = () => {
  PAGO_IR_PLAN = false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
};

/* v2.173.0 · El próximo recibo con IVA en «Plan y suscripción» (petición de Eric por la sesión de la web: que la web, Stripe y la app digan lo mismo).
   Durante la prueba: hoy 0 €, el primer recibo con IVA (con la puesta en marcha si el pago es mensual) y lo que viene después; fuera de ella, el
   próximo recibo y su fecha. Se pinta al momento con la misma cuenta que la web (IVA = redondeo de base × 21 / 100) y, si la función «pagos»
   devuelve el recibo de Stripe (acción datos, campo proximo), se cambia por ese (lleva descuentos y lo ya apuntado). */
let PAGO_PROXIMO = null;

// Pedidos: el precio del contrato en vigor de la ficha (editorPedido lo consulta en su sitio)
 // v2.440.0: PED_PRECIOS → estado de src/app (plan 6.6), accesible en window

/* v2.230.0 · KPIs de Pedidos y Analítica (Eric eligió la A de https://claude.ai/artifact/PTBZBvZ3yZrQxpxXCNKyrs).
   - Pedidos: #operativa deja de ser el cartel con los avisos desplegables y pasa a tres tarjetas vivas (pagos por validar, paquetes por
     preparar y facturas por enviar) con su número que cuenta, una frase y la entrada de los últimos 10 días. Pulsar una pone el filtro
     «Operativa» (#popf) de la tabla; volver a pulsarla lo quita. Las cifras son las de la tabla (todos los pendientes). El engranaje
     (#opcfg) sigue eligiendo qué tarjetas se ven.
   - Analítica: cada indicador cuenta hasta su cifra y dibuja la línea de los últimos seis meses (analitica_kpis_periodo por mes, con
     el filtro propio del indicador). Sin línea los de «a día de hoy» y los de texto. */
const PK_TARJ = [['pago', 'pago', window.delcos.t('legacyTexts.orderCards.payment'), 'credit-card'], ['paquete', 'paquete', window.delcos.t('legacyTexts.orderCards.parcel'), 'package'],
  ['email_factura', 'email', window.delcos.t('legacyTexts.orderCards.invoiceEmail'), 'mail']];

// Aviso arriba si hay un cobro pendiente o la cuenta está en solo lectura

// En los 7 últimos días de la prueba, aviso arriba (no tapa los de impago o solo lectura)

// Se sabe al entrar (plan_uso): en la de plataforma, a Clientes

// Ventana de contratar o cambiar (la de la v2.162.0, con la bajada al final del periodo y lo que se pierde)

// Pedidos está en src/app/screens/orders (v2.414.0). Estos nombres se quedan: el editor del pedido y el cobro con tarjeta (aquí),
// otras pantallas, legado 001/034/057/058/073/082/089/105/139, «‹ Volver» y las pruebas los usan.
function cargarVentas() { return window.delcos.screens.orders.loadSales(); }
function listaPedidos() { return window.delcos.screens.orders.paintOrderList(); }
function verPedido(id) { return window.delcos.screens.orders.showOrder(id); }
function pintarDistribuidores() { return window.delcos.screens.orders.paintDistributors(); }
function configurarAvisosPedidos(oblig) { return window.delcos.screens.orders.configureAlerts(oblig || []); }
function enviarDatosPago(id) { return window.delcos.screens.orders.sendPaymentDetails(id); }
function totalesPedido(lineas, d, dt, env) { return window.delcos.screens.orders.orderTotals(lineas, d, dt, env); }
function lineaDesglose(l) { return window.delcos.screens.orders.lineBreakdown(l); }
function bloqueTotales(t) { return window.delcos.screens.orders.totalsHtml(t); }
function esTransferencia(fp) { return window.delcos.screens.orders.isBankTransfer(fp); }
function sinCargoP(p, total) { return window.delcos.screens.orders.isFree(p, total); }
function pasoPedido(p) { return window.delcos.screens.orders.orderStep(p); }
function pillPaso(p) { return window.delcos.screens.orders.stepPill(p); }
function pillEstado(e) { return window.delcos.screens.orders.statePill(e); }
function asuntoEmailPago(p, total, cliente) { return window.delcos.screens.orders.paymentSubject(p, total, cliente); }
function textoEmailPago(p, total, cliente) { return window.delcos.screens.orders.paymentText(p, total, cliente); }

// El editor del pedido, el cobro con tarjeta, las suscripciones y las tarjetas están en src/app/screens/orders (v2.417.0). Estos nombres
// se quedan: legado 058 (ventana amplia), 073, 075, 076, 147, Clientes, Configuración, el Panel delcos, Portal y las pruebas los usan.
function editorPedido(pedido) { return window.delcos.screens.orders.editOrder(pedido || null); }
function pintarTpv() { return window.delcos.screens.orders.paintTpvSettings(); }
function pagoLlamar(cuerpo, boton) { return window.delcos.screens.orders.callPayments(cuerpo, boton || null); }
function pagoEsperarActivo() { return window.delcos.screens.orders.waitUntilActive(); }
function pagoEsperarBaja() { return window.delcos.screens.orders.waitUntilCancelled(); }
function pagoAviso() { return window.delcos.screens.orders.paintPaymentNotices(); }
function pagoCargarEstado() { return window.delcos.screens.orders.loadPaymentState(); }
function elegirPago(planIni) { return window.delcos.screens.orders.choosePlan(planIni); }
function pdCobroEstado(o) { return window.delcos.screens.orders.companyPaymentState(o); }
function pdMensual(p) { return window.delcos.screens.orders.monthlyAmount(p); }
function pdHace(v) { return window.delcos.screens.orders.ago(v); }
function pdKpis(l) { return window.delcos.screens.orders.kpiTiles(l); }
function pdEsqueleto() { return window.delcos.screens.orders.billingSkeleton(); }
function pkMarcar() { return window.delcos.screens.orders.markChosenCard(); }
function pkFestivo(iso) { return window.delcos.screens.orders.isHoliday(iso); }
function pkLibre(iso) { return window.delcos.screens.orders.isDayOff(iso); }
function pkDia(iso, n, hoy) { return window.delcos.screens.orders.dayHtml(iso, n, hoy); }
function pkContar(els, fmt) { return window.delcos.screens.orders.countUp(els, fmt); }
function menuPedidos2139() { return window.delcos.screens.orders.addOrderMenuEntries(); }
function abrirKpis() { return window.delcos.screens.home.openIndicatorSettings(); }
function esPorcentajeIva(i) { return window.delcos.screens.orders.isVatPercentField(i); }
