document.addEventListener('visibilitychange', () => { if (!document.hidden) comprobarVersion(); });
setInterval(comprobarVersion, 10 * 60 * 1000);


// Fechas y horas en pantallas táctiles: sin foco, sin selector del sistema
const PANTALLA_TACTIL = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
sinSelectorDelSistema(document);

/* v2.186.0 · Editar una cita no rehace la Agenda (aviso de Eric: al editar una cita se movía todo el panel). Antes, cerrar cualquier ventana en la
   Agenda (detalle de la cita, notas, tareas) y cada cambio de la cita (hora, confirmar, aplazar, descartar…) volvían a cargar la pantalla entera:
   métricas, semana, mes, sugerencias y «Tu día». Ahora:
   - Solo se repinta «Tu día» con lo que ya hay (o con los datos nuevos de ese día) y cada cita que cambia de sitio se desliza hasta él (FLIP),
     quedando resaltada; la página no salta ni cambia de tamaño mientras se repinta.
   - Al cambiar la hora, la cita se coloca por su hora entre las demás y ese orden se guarda.
   - Las métricas, la semana y el mes solo cambian sus cifras (sin animación ni recarga) cuando cambia el estado o el día de una cita.
   - Cerrar una ventana solo refresca si dentro se ha guardado algo con la base (p. ej. registrar la visita). */
let AGQ_T = null, AGQ_ID = null, DLG_EPOCA = 0;
new MutationObserver(() => { if ($('dlg').open) DLG_EPOCA = RC_EPOCA; }).observe($('dlg'), { attributes: true, attributeFilter: ['open'] });









$('dlg').addEventListener('close', () => { setTimeout(() => { if (!$('dlg').open) VISITA_ACTUAL = null; }, 0); });







// Antes de guardar la visita se comprueban las muestras (si algo falla, no se guarda nada)
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#vguardar');
  if (!b || !VISITA_ACTUAL || !VISITA_ACTUAL.muestras) return;
  const msg = VISITA_ACTUAL.muestras.validar();
  if (msg) { e.stopImmediatePropagation(); e.preventDefault(); toast(msg, true); }
}, true);


/* v2.193.0 · Pedido a través del distribuidor (primera tanda del estudio por sectores, SQL 120; decisiones de Eric: quién factura se elige
   en cada pedido, el pedido del distribuidor no saca stock de nuestro almacén y le llega por correo).
   - Editor del pedido: «Lo sirve» Nosotros / Un distribuidor; con distribuidor, cuál, el código del cliente en él y «Lo factura el
     distribuidor». La administración añade distribuidores desde ahí mismo («+ Nuevo distribuidor»).
   - Ver pedido: bloque «Distribuidor» con «Preparar correo al distribuidor» (el correo de la persona, con las líneas y el código del
     cliente, como los de factura y pago) que deja apuntado que se ha enviado; si lo factura el distribuidor, no se ofrece «Emitir factura». */
let DISTRIBUIDORES = null;   // v2.417.0: el bloque «Lo sirve» lo pinta y lo guarda el editor (src/app/screens/orders/editor/distributor.ts)




/* v2.194.0 · Sin «recomendación» en los textos (decisión de Eric, 6/10/2026: puede leerse como una contrapartida con los profesionales).
   El canal del pedido «Recomendación a paciente» pasa a «Venta al paciente» (frente a «Venta a centro»), y «… que lo recomienda» /
   «Quién los recomienda» pasan a «… de referencia», con el vocabulario de cada empresa; «Recomendaciones de rutas» pasa a «Rutas
   sugeridas». Cambiado en su sitio (reemplazos2194). Las demos (sql/demo/generar_demos.py) usan «Activo» y «Visita con pedido». */

