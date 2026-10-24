document.addEventListener('visibilitychange', () => { if (!document.hidden) comprobarVersion(); });
setInterval(comprobarVersion, 10 * 60 * 1000);


// Fechas y horas en pantallas táctiles: sin foco, sin selector del sistema
const PANTALLA_TACTIL = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
mejorarCampos = (orig => function (raiz) { const r = orig(raiz); try { sinSelectorDelSistema(raiz || document); } catch (e) {} return r; })(mejorarCampos);
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

// Repinta «Tu día» sin saltos: las citas que cambian de sitio se deslizan y la tocada queda resaltada un momento
async function repintarDiaSuaveBase(id, data) {
  // v2.246.0: el deslizamiento de las tarjetas lo pone la envoltura de la v2.244.0 (aquí animaba las filas ocultas)
  agOlvidarAgenda();
  if (data) { TD_PRESET = { fecha: AG_FECHA, data }; TD_ULTIMO = { fecha: AG_FECHA, data }; }
  const cuerpo = $('agcuerpo'), alto = cuerpo ? cuerpo.offsetHeight : 0, y = window.scrollY;
  if (cuerpo) cuerpo.style.minHeight = alto + 'px';           // mientras se repinta, la caja no encoge
  try { await pintarTuDia(); } finally { if ($('agcuerpo')) $('agcuerpo').style.minHeight = ''; }
  window.scrollTo({ top: y });
}








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
let DISTRIBUIDORES = null, PED_DIST = null;
new MutationObserver(() => { if ($('porig') && !$('pdist')) pintarBloqueDistribuidor(); }).observe($('dbody'), { childList: true, subtree: true });


// Al guardar el pedido desde su editor, va también quién lo sirve
db.rpc = (orig => function (fn, params, ...a) {
  if (fn === 'guardar_pedido' && params && params.p && $('pdist') && PED_DIST) {
    const on = PED_DIST.on && !!PED_DIST.id;
    Object.assign(params.p, { distribuidor_id: on ? PED_DIST.id : '', distribuidor_codigo: on ? PED_DIST.codigo : '', factura_distribuidor: on && PED_DIST.factura });
  }
  return orig.call(this, fn, params, ...a);
})(db.rpc);


/* v2.194.0 · Sin «recomendación» en los textos (decisión de Eric, 6/10/2026: puede leerse como una contrapartida con los profesionales).
   El canal del pedido «Recomendación a paciente» pasa a «Venta al paciente» (frente a «Venta a centro»), y «… que lo recomienda» /
   «Quién los recomienda» pasan a «… de referencia», con el vocabulario de cada empresa; «Recomendaciones de rutas» pasa a «Rutas
   sugeridas». Cambiado en su sitio (reemplazos2194). Las demos (sql/demo/generar_demos.py) usan «Activo» y «Visita con pedido». */

