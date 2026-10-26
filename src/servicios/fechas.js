// @ts-check
// servicios/fechas.js · está en src/app/services/calendar.ts (v2.425.0). Estos nombres se quedan: todo el código viejo y las pruebas los
// usan. Normas: docs/normas_codigo.md.

function rangoPeriodo(k) { return window.delcos.core.calendar.periodRange(k); }
// Avisos de Pedidos (v2.330.0): festivos nacionales, con el Viernes Santo
function mesesEntre(d, h) { return window.delcos.core.calendar.monthsBetween(d, h); }
// Fechas SIEMPRE en hora local (España): convertir a hora universal restaba un día de 00:00 a 02:00
function hoyISO() { return window.delcos.core.calendar.today(); }
function isoMas(iso, n) { return window.delcos.core.calendar.plusDays(iso, n); }
function lunesDe(iso) { return window.delcos.core.calendar.mondayOfWeek(iso); }
function hm(m) { return window.delcos.core.calendar.minutesToTime(m); }
function pedirFecha(msg, valor, o) { return window.delcos.core.calendar.askDate(msg, valor, o || {}); }
function periodoActual() { return window.delcos.core.calendar.currentPeriod(); }
function periodoTxt(p) { return window.delcos.core.calendar.periodText(p); }
function siguienteLaborable() { return window.delcos.core.calendar.nextWorkingDay(); }
function LETRA_DIA(f) { return window.delcos.core.calendar.dayLetter(f); }
function txtReciente(l) { return window.delcos.core.calendar.recentText(l); }
function hoyLetra() { return window.delcos.core.calendar.todayLetter(); }
function diasHasta(f) { return window.delcos.core.calendar.daysUntil(f); }   // días de calendario
function lunesCinta(f) { return window.delcos.core.calendar.mondayOfWeek(f); }
function diasMas(f, n) { return window.delcos.core.calendar.plusDays(f, n); }

const DIAS = window.delcos.core.calendar.WORK_DAYS;

const DIAN = window.delcos.core.calendar.WORK_DAY_NAMES;

const HM = window.delcos.core.calendar.DEFAULT_HOURS;

const PERIODOS = window.delcos.core.calendar.PERIODS;

const MESES_C = window.delcos.core.calendar.MONTHS_SHORT;

const MESES_L = window.delcos.core.calendar.MONTHS_LONG;

const DIAS_SEM = window.delcos.core.calendar.WEEK_DAYS;

const MESES_CORTOS = window.delcos.core.calendar.SHORT_MONTH_NUMBERS;
