// @ts-check
// v2.345.0: solo en pruebas hasta tener el terminal del banco (decisión de Eric); para abrirlo en producción, TPV_VISIBLE = true
const TPV_VISIBLE = EN_PRUEBAS || /^(localhost|127\.)/.test(location.hostname);   // en local, para la batería
