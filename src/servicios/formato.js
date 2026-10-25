// @ts-check
// servicios/formato.js · está en src/app/services/money.ts (v2.425.0). Estos nombres se quedan: todo el código viejo los usa.
// Normas: docs/normas_codigo.md.

function num(n) { return window.delcos.core.money.number(n); }
function durTxt(ms) { return window.delcos.core.money.duration(ms); }
function eur(n) { return window.delcos.core.money.euros(n); }
function r2(n) { return window.delcos.core.money.round2(n); }
function eurI(n) { return window.delcos.core.money.eurosRounded(n); }
function txtMin(m) { return window.delcos.core.calendar.minutesToTime(m); }
function pct(a, b) { return window.delcos.core.money.percent(a, b); }
// IVA: siempre una lista con los tipos legales, en cualquier ventana (se detecta por su nombre o su etiqueta)
function ES_IVA(i) { return window.delcos.core.money.isVatField(i); }
function ivaDe(x) { return window.delcos.core.money.vatOf(x); }
function eurW(n) { return window.delcos.core.money.eurosWeb(n); }

const TIPOS_IVA = window.delcos.core.money.VAT_RATES;

const ES_IMPORTE = window.delcos.core.money.AMOUNT_FIELD;
