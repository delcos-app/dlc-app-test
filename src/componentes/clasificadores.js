// @ts-check
// componentes/clasificadores.js · los campos propios (clasificadores) como filtro, chip y columna están en
// src/app/components/classifiers (v2.416.0). Sus nombres se quedan como adaptadores: Cuentas, Clientes, Pedidos, Productos,
// el panel de filtros y Configuración los usan. Aquí siguen las tablas de cada ámbito y los tipos de campo (Configuración).

const CAMPO_TABLA = { medico: 'cuentas', cliente: 'contactos', producto: 'productos', pedido: 'pedidos' };

const TIPOS_CAMPO = [['lista', window.delcos.t('legacyTexts.fieldTypes.list')], ['texto', window.delcos.t('legacyTexts.fieldTypes.text')], ['numero', window.delcos.t('legacyTexts.fieldTypes.number')], ['fecha', window.delcos.t('legacyTexts.fieldTypes.date')], ['si_no', window.delcos.t('legacyTexts.fieldTypes.yesNo')]];

/** @param {Element | null} cont @param {string} amb @param {any} estado @param {() => void} alCambiar @param {() => void} alColumna @param {string} [titulo] */
function clasPintar(cont, amb, estado, alCambiar, alColumna, titulo) {
  return window.delcos.components.paintClassifiers(cont, amb, { state: estado, onChange: alCambiar, onColumn: alColumna, heading: titulo });
}
