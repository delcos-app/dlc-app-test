// Logotipo, lecturas lentas del iPhone, rutas que se rellenan y nombres del menú: en src/app/core/layers (v2.424.0).
window.delcos.layers.installMenuDetails();
window.delcos.layers.installSlowReadRetry();
let RM_MAPA = null, RM_ANIM = null;
let RN_LISTA = null, RN_MAPA_P = null;    // tarjetas de Mis rutas: [{r, ms}]
function aplicarEtiqueta(...a) { return window.delcos.layers.applyLabel(a); }
window.delcos.layers.installMenuNames();
window.delcos.layers.installSettingsSearchWords();
