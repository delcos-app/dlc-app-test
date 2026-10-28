// @ts-check
// componentes/selector_fecha.js · el calendario, el reloj y la mejora de los campos de fecha, hora, mes y número están en
// src/app/components/date-picker (v2.416.0). Estos nombres se quedan: las escuchas de legado 001, 019, 035, 037, 071 y 078, la
// ficha y las ventanas los usan.

function sinSelectorDelSistema(raiz) { if (raiz && raiz.querySelectorAll) window.delcos.components.withoutSystemPicker(raiz); }
