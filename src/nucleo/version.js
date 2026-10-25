// @ts-check
// nucleo/version.js · está en src/app/core/live.ts (v2.425.0). comprobarVersion y VERSION_VISTA se quedan: el arranque y las pruebas
// (que ponen VERSION_VISTA a 0) los usan. Normas: docs/normas_codigo.md.

function comprobarVersion() { return window.delcos.core.live.checkVersion(); }

/* v2.184.0 · La app se pone al día sola (aviso de Eric: con la base ya en nombres neutros, una pestaña abierta desde antes seguía con la app antigua y
   el buscador no encontraba nada hasta Ctrl+F5). Al volver a la pestaña y cada 10 minutos se mira qué versión está publicada (index.html sin caché);
   si es otra, la app se recarga sola cuando no hay nada a medias (ninguna ventana abierta ni un campo con el cursor) o, si lo hay, enseña el aviso
   «Hay una versión nueva» para que se recargue al terminar. */
let VERSION_VISTA = 0;
