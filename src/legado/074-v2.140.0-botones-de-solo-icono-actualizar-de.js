// legado 074 · v2.140.0 botones de solo icono y filtros en el panel: plegado en src/app/core/legacy-c (v2.425.0). Aquí queda su arranque, en el mismo sitio del orden de carga,
// y los nombres que siguen usando otros archivos o las pruebas.
async function conCarga(btn, texto, fn) { return window.delcos.legacyC.withLoading(btn, texto, fn); }
window.delcos.legacyC.start074();
