// @ts-check
// pantallas/portal.js · el portal del profesional y del centro está en src/app/screens/portal (v2.413.0).
// Aquí quedan el pago del plan desde el portal (Configuración y Pedidos), la «i» que usan muchas pantallas y los nombres que
// usan la tabla de pantallas (legado 001), los avisos en vivo, Configuración y las pruebas.

async function pagoPortal(boton) { const d = await pagoLlamar({ accion: 'portal' }, boton); if (d && d.url) location.href = d.url; }

const pmAyu = (t, x) => `<button type="button" class="ai" data-ayuda-tit="${esc(t)}" data-ayuda-txt="${esc(x)}" aria-label="Qué es">i</button>`;

// Las pruebas leen PM.ficha y PM.tab
const PM = { get ficha() { return window.delcos.screens.portal.portalState.form; }, get tab() { return window.delcos.screens.portal.portalState.tab; } };
function cargarInforme() { return window.delcos.screens.portal.loadReport(); }
function portalMedico() { return window.delcos.screens.portal.paintMaterial(); }
function centroPintar() { return window.delcos.screens.portal.paintCentre(); }
function pmTab(k) { window.delcos.screens.portal.showTab(k); }
function pmRepintarConsultas() { window.delcos.screens.portal.repaintPlaces(); }
function pintarCfgPortal() { return window.delcos.screens.portal.paintPortalSettings(); }
