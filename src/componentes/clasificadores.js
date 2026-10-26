// @ts-check
// componentes/clasificadores.js · los campos propios (clasificadores) como filtro, chip y columna están en
// src/app/components/classifiers (v2.416.0). Sus nombres se quedan como adaptadores: Cuentas, Clientes, Pedidos, Productos,
// el panel de filtros y Configuración los usan. Aquí siguen las tablas de cada ámbito y los tipos de campo (Configuración).

const CAMPO_TABLA = { medico: 'cuentas', cliente: 'contactos', producto: 'productos', pedido: 'pedidos' };

const TIPOS_CAMPO = [['lista', window.delcos.t('legacyTexts.fieldTypes.list')], ['texto', window.delcos.t('legacyTexts.fieldTypes.text')], ['numero', window.delcos.t('legacyTexts.fieldTypes.number')], ['fecha', window.delcos.t('legacyTexts.fieldTypes.date')], ['si_no', window.delcos.t('legacyTexts.fieldTypes.yesNo')]];

/** @param {any} v @param {any} f */
function clasCumple(v, f) { return window.delcos.components.matchesFilters(v, f); }
/** @param {string} amb */
function clasVisibles(amb) { return window.delcos.components.visibleFields(amb); }
/** @param {HTMLElement | null} g @param {number} n */
function clasRejilla(g, n) { window.delcos.components.widenGrid(g, n); }
/** @param {Element | null} cont @param {string} amb @param {any} estado @param {() => void} alCambiar @param {() => void} alColumna @param {string} [titulo] */
function clasPintar(cont, amb, estado, alCambiar, alColumna, titulo) {
  return window.delcos.components.paintClassifiers(cont, amb, { state: estado, onChange: alCambiar, onColumn: alColumna, heading: titulo });
}
/** @param {Element} sec */
function clasPintarLateral(sec) { window.delcos.components.paintSidePanelClassifiers(sec); }
/** @param {Element | null | undefined} sec */
function clasPantalla(sec) { return window.delcos.components.screenOf(sec); }
/** @param {unknown} s */
function clasNorm(s) { return window.delcos.components.normalise(s); }
/** @param {any[]} cols */
function clasCabeceras(cols) { return window.delcos.components.columnHeaders(cols); }
/** @param {any[]} cols @param {any} v */
function clasCeldas(cols, v) { return window.delcos.components.columnCells(cols, v); }
/** @param {string} amb @param {any} estado */
function clasChips(amb, estado) { return window.delcos.components.filterChips(amb, estado); }
/** @param {any} c @param {unknown} v */
function campoTexto(c, v) { return window.delcos.components.fieldText(c, v); }
