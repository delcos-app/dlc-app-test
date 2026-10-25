// componentes/selector_fecha.js · el calendario, el reloj y la mejora de los campos de fecha, hora, mes y número están en
// src/app/components/date-picker (v2.416.0). Estos nombres se quedan: las escuchas de legado 001, 019, 035, 037, 071 y 078, la
// ficha y las ventanas los usan.

function mejorarCampos(raiz) { window.delcos.components.enhanceFields(raiz); }
function mejorarCamposNuevos(raiz) { window.delcos.components.enhanceNewFieldKinds(raiz && raiz.querySelectorAll ? raiz : document); }
function sinSelectorDelSistema(raiz) { if (raiz && raiz.querySelectorAll) window.delcos.components.withoutSystemPicker(raiz); }
function cerrarPickers(salvo) { window.delcos.components.closePickers(salvo); }
function cerrarSelector() { window.delcos.components.closePicker(); }
function abrirCalendario(inp, o) { window.delcos.components.openCalendar(inp, o || {}); }
function abrirReloj(inp, o) { window.delcos.components.openClock(inp, o || {}); }
function selTipo(inp) { return window.delcos.components.kindOf(inp); }
