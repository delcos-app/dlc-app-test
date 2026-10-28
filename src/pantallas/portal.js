// @ts-check
// pantallas/portal.js · el portal del profesional y del centro está en src/app/screens/portal (v2.413.0).
// Aquí quedan el pago del plan desde el portal (Configuración y Pedidos), la «i» que usan muchas pantallas y los nombres que
// usan la tabla de pantallas (legado 001), los avisos en vivo, Configuración y las pruebas.

async function pagoPortal(boton) { const d = await window.delcos.screens.orders.callPayments({ accion: 'portal' }, boton || null); if (d && d.url) location.href = d.url; }

const pmAyu = (t, x) => `<button type="button" class="ai" data-ayuda-tit="${window.delcos.core.escapeText(t)}" data-ayuda-txt="${window.delcos.core.escapeText(x)}" aria-label="Qué es">i</button>`;

// Las pruebas leen PM.ficha y PM.tab
const PM = { get ficha() { return window.delcos.screens.portal.portalState.form; }, get tab() { return window.delcos.screens.portal.portalState.tab; } };
