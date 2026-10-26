// @ts-check
// servicios/exportar.js · el lector de Excel está en src/app/services/files.ts (v2.425.0). El nombre se queda: Importar lo usa.
// Normas: docs/normas_codigo.md.

// Lector de Excel y CSV (se carga solo al usarlo)
function cargarLectorExcel() { return window.delcos.core.files.loadExcelReader(); }
