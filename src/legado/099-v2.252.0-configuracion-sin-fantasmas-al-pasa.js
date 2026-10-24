/* ============================================================
   v2.252.0 · Configuración sin fantasmas. Al pasar de un apartado a otro, la página nueva salía vacía y se iba llenando
   (14 de 26 apartados se veían en varios pasos: «Tus datos», «Punto de salida», Roles…). Ahora el apartado de antes se queda
   fijo y atenuado (la copia de congelar, como en las pestañas) hasta que el nuevo está entero.
   Usuarios y Calidad del dato ya llegaban y cambiaban de una vez (pruebas usuarios2252).
   ============================================================ */
document.addEventListener('click', e => {
  const b = e.target.closest('#v-config .cfuidx [data-ck], #v-config .cfucab [data-cks]'); if (!b || TAB !== 'config' || b.classList.contains('on')) return;
  const p = document.querySelector('#v-config .cfupag');
  if (p && p.offsetParent && !ES_MOVIL()) congelar(p); else congelar($('v-config'));   // en el móvil el índice tapa la página: toda la pantalla
}, true);


/* v2.253.0 · Inicio sin fantasmas: el mosaico, la cabecera y los indicadores ya llegaban y cambiaban de una vez (prueba inicio2253, como
   comercial, administración y dirección). En el móvil, la cabecera guardaba 100 px a la derecha de cuando los botones iban arriba: con
   «Buenas tardes» la «i» bajaba sola a otra línea. Solo estilo. */


/* v2.254.0 · Rutas sin fantasmas: la lista de rutas, «Tu día en el mapa» y los pasos del editor llegan de una vez (prueba rutas2254). En el
   ordenador, la caja del paso 1 crecía con los resultados hasta su máximo y empujaba la barra de abajo («Siguiente») al filtrar: ahora tiene
   alto fijo y la lista se desplaza dentro. Solo estilo. */


