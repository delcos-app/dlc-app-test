document.addEventListener('visibilitychange', () => { if (!document.hidden) comprobarVersion(); });
setInterval(comprobarVersion, 10 * 60 * 1000);

/* v2.185.0 · Citas aplazadas sin duplicar y fechas en el móvil (avisos de Eric):
   1. Una cita aplazada o descartada de hoy en adelante tiene en «⋯» (y en su detalle) «Volver a planificarla» (reabrir_cita, SQL 116: vuelve a
      Planificada y quita la cita que se creó al aplazarla). Volver a poner una cita ese día reutiliza la aplazada (aplazar_cita y guardar_cita).
   2. En pantallas táctiles los campos de fecha y hora son `inert`: no pueden tomar el foco, así que iOS ya no abre su rueda (lo hacía cuando la
      ventana enfocaba el campo al abrirse y cuando el calendario de delcos le devolvía el foco al elegir el día). El toque lo recoge el envoltorio. */
menuCita = (orig => function (boton, c) {
  if (CITA_ABIERTA.includes(c.estado) || !['Aplazada', 'Descartada'].includes(c.estado) || c.fecha < hoyISO()) return orig.call(this, boton, c);
  document.querySelectorAll('.tdmenu').forEach(m => m.remove());
  const m = document.createElement('div');
  m.className = 'tdmenu'; m.__t = Date.now();
  m.innerHTML = `<button data-tdop="rehacer"><b>Volver a planificarla</b><span>Vuelve a este día${c.estado === 'Aplazada' ? '; si la pasaste a otro, esa se quita' : ''}</span></button>`;
  document.body.appendChild(m);
  const r = boton.getBoundingClientRect();
  m.style.top = Math.min(window.innerHeight - m.offsetHeight - 10, r.bottom + 6) + 'px';
  m.style.left = Math.max(10, Math.min(window.innerWidth - m.offsetWidth - 10, r.right - m.offsetWidth)) + 'px';
  m.querySelector('[data-tdop]').onclick = () => { m.remove(); accionCita('rehacer', c); };
})(menuCita);

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

// Cambiar la hora: la cita se coloca por su hora entre las demás (y se guarda ese orden)
cambiarHoraCita = async function (id, hora) {
  const h = await appVentana({ titulo: 'Hora de la cita', ok: 'Guardar', campo: { valor: hora || '', tipo: 'time' } });
  if (h === null) return;
  const { error } = await db.from('agenda').update({ hora: h || null }).eq('id', id);
  if (error) { toast('No se ha podido: ' + error.message, true); return; }
  toast('Hora actualizada');
  const u = TD_ULTIMO && TD_ULTIMO.fecha === AG_FECHA ? TD_ULTIMO.data : null;
  if (TAB !== 'agenda' || !agUnida() || !u || !u.some(c => c.id === id)) { agRefrescoQuieto(id, { cifras: false }); return; }
  const data = u.map(c => c.id === id ? Object.assign({}, c, { hora: h || null }) : c);
  const mia = c => c.usuario_id === agUid(), abierta = c => mia(c) && CITA_ABIERTA.includes(c.estado);
  const ab = data.filter(abierta), yo = ab.find(c => c.id === id);
  let orden = ab;
  if (yo && h) {
    const hh = c => c.hora ? String(c.hora).slice(0, 5) : null;
    const resto = ab.filter(c => c.id !== id);
    let i = resto.findIndex(c => hh(c) && hh(c) > h);
    if (i < 0) { i = 0; resto.forEach((c, k) => { if (hh(c) && hh(c) <= h) i = k + 1; }); }
    resto.splice(i, 0, yo); orden = resto;
  }
  const cambia = orden.some((c, k) => c.id !== ab[k].id);
  const nueva = cambia ? [...data.filter(c => mia(c) && !abierta(c)), ...orden, ...data.filter(c => !mia(c))] : data;
  await repintarDiaSuave(id, nueva);
  if (cambia && !(await guardarOrden(orden))) agRefrescoQuieto(id);
};







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

