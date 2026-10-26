// @ts-check
// servicios/camara.js · leer lotes y números de serie con la cámara está en src/app/services/scanner (v2.427.0). Estos nombres
// se quedan: la capa de dispositivos (legado 156) los usa y la prueba de la cámara lee códigos con leerGS1.
function leerGS1(txt) { return window.delcos.leftovers.readGs1(txt); }

 // v2.440.0: ESC_PEND → estado de src/app (plan 6.6), accesible en window
