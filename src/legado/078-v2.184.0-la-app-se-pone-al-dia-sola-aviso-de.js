/* v2.184.0 · La app se pone al día sola (aviso de Eric: con la base ya en nombres neutros, una pestaña abierta desde antes seguía con la app antigua y
   el buscador no encontraba nada hasta Ctrl+F5). Al volver a la pestaña y cada 10 minutos se mira qué versión está publicada (index.html sin caché);
   si es otra, la app se recarga sola cuando no hay nada a medias (ninguna ventana abierta ni un campo con el cursor) o, si lo hay, enseña el aviso
   «Hay una versión nueva» para que se recargue al terminar. */
let VERSION_VISTA = 0;
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
accionCita = (orig => async function (k, c) {
  if (k !== 'rehacer') return orig.call(this, k, c);
  const { data: r, error } = await db.rpc('reabrir_cita', { p_id: c.id });
  if (error || !r || r.ok === false) { toast(r && r.error === 'pasada' ? 'Solo se pueden volver a planificar citas de hoy en adelante' : 'No se ha podido volver a planificar', true); return; }
  toast(r.quitada ? 'Vuelve a estar planificada (se quita la del ' + fechaCorta(r.quitada) + ')' : 'Vuelve a estar planificada');
  agRefrescoQuieto(c.id);
})(accionCita);
verCita = (orig => function (c) {
  const r = orig.call(this, c);
  try {
    const caja = $('dbody') && $('dbody').querySelector('.vcacts');
    if (caja && ['Aplazada', 'Descartada'].includes(c.estado) && c.fecha >= hoyISO()) {
      caja.insertAdjacentHTML('beforeend', '<button type="button" class="btn sec" id="vcrehacer">Volver a planificarla</button>');
      $('vcrehacer').onclick = () => { $('dlg').close(); accionCita('rehacer', c); };
    }
  } catch (e) {}
  return r;
})(verCita);

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
async function repintarDiaSuave(id, data) {
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

/* v2.187.0 · Avisos de la esquina (petición de Eric): entran deslizándose también cuando uno sustituye a otro que sigue a la vista (antes el
   nuevo solo cambiaba el texto) y se van desvaneciéndose (.sale, 260 ms) en vez de desaparecer de golpe. */
toast = (orig => function (msg, err) {
  const r = orig.call(this, msg, err), v = $('toast');
  if (!v) return r;
  const t = v.cloneNode(true); t.classList.remove('sale'); v.replaceWith(t);   // un nodo nuevo vuelve a hacer la entrada aunque el anterior siga a la vista
  clearTimeout(tToast);
  tToast = setTimeout(() => { t.classList.add('sale'); tToast = setTimeout(() => { t.classList.add('hide'); t.classList.remove('sale'); }, 260); }, 3200);
  return r;
})(toast);

/* v2.189.0 · La consulta privada tiene su propia ficha (aviso de Eric: al elegir «Consulta privada (sin centro)» no se podía poner ni la dirección:
   esos datos de la consulta solo los rellenaba un centro). Ahora una consulta sin centro cuyo nombre empieza por «Consulta privada» se ve como tal
   (no como «Sin enlazar») y tiene «Editar la consulta» / «Añadir la dirección»: dirección, código postal, población, provincia y su punto en el mapa
   (buscando la dirección o con «Estoy aquí»). Planta, sala, indicaciones, teléfono y horario siguen debajo, como en cualquier consulta.
   Se guarda con la ficha (en la consulta del profesional; no crea un centro compartido). */
const esConsultaPrivada = c => { if (c && c.id) return false; const n = String((c && c.nombre) || '').trim().toLowerCase();   // v2.347.0: con cualquier palabra del vocabulario
  return /^(consulta|ubicaci[oó]n) privad[ao]/.test(n) || n.startsWith(consultaPrivada('l').toLowerCase()); };
tarjetaCentro = (orig => function (c, enlazado) {
  if (enlazado || !esConsultaPrivada(c)) return orig.call(this, c, enlazado);
  const dir = [c.direccion, [c.cp, c.municipio].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
  return `<div class="cpcard cppriv"><div class="cpcab"><b>${consultaPrivada()}</b><span class="pill p-est">Sin centro</span></div>
    <span class="sm">${esc(dir || 'Sin dirección todavía')}</span>
    ${c.lat ? '' : `<span class="sm" style="color:var(--warn)">${dir ? 'Sin ubicación: no saldrá en rutas ni en el mapa' : 'Añade la dirección para que salga en rutas y en el mapa'}</span>`}
    <div class="acts" style="margin:8px 0 0;flex-wrap:wrap">
      ${c.lat ? `<button type="button" class="btn sec" data-nav="${navAttr([+c.lat, +c.lon])}">Cómo llegar</button>` : ''}
      <button type="button" class="btn ${dir ? 'sec' : ''}" data-cpeditar>${dir ? 'Editar ' + TT('consulta', 's', 'el', 'l', 'l') : 'Añadir la dirección'}</button>
      <button type="button" class="btn sec" data-cpcambiar>Cambiar</button></div></div>`;
})(tarjetaCentro);
formCentro = (orig => function (box, i, c, aviso) {
  if (c && (c.privada || esConsultaPrivada(c))) return formPrivada(box, i);
  return orig.call(this, box, i, c, aviso);
})(formCentro);



/* v2.191.0 · Visita a distancia y fotos de la visita (primera tanda del estudio por sectores, SQL 118).
   - Al registrar una visita se elige cómo fue: Presencial (por defecto), Por teléfono o Por videollamada (actividades.modo). En el historial
     de la ficha, las que no son presenciales lo dicen.
   - Fotos de la visita (lineal, exposición, material colocado…): se reducen a 1600 px en JPEG como los justificantes y se guardan en
     actividad_fotos al registrar la visita. Sin conexión la visita se guarda igual y las fotos se añaden después desde su historial
     («📷 Fotos»), donde también se ven y se borran. */
const MODOS_VISITA = [['presencial', 'Presencial'], ['telefono', 'Teléfono'], ['video', 'Videollamada']];
const FOTOS_VISITA_MAX = 6;
let VISITA_ACTUAL = null;   // { id, modo, fotos } de la ventana «Registrar visita» abierta


abrirVisitaBase = (orig => async function (id, ...r) {
  const res = await orig.call(this, id, ...r);
  const d = $('dbody'), g = d && $('vguardar') && d.querySelector('.g2');
  if (!g || $('vmodo')) return res;
  VISITA_ACTUAL = { id, modo: 'presencial', fotos: [] };
  g.insertAdjacentHTML('afterend', `<label>Cómo fue</label>
    <div class="segs" id="vmodo" role="group" aria-label="Cómo fue">${MODOS_VISITA.map(([k, t]) => `<button type="button" data-vmodo="${k}" class="${k === 'presencial' ? 'on' : ''}" aria-pressed="${k === 'presencial'}">${t}</button>`).join('')}</div>`);
  d.querySelectorAll('[data-vmodo]').forEach(b => b.onclick = () => {
    if (!VISITA_ACTUAL) return;
    VISITA_ACTUAL.modo = b.dataset.vmodo;
    d.querySelectorAll('[data-vmodo]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  });
  const nota = $('vn');
  if (nota) nota.insertAdjacentHTML('afterend', `<div class="vfotosw"><label class="btn sec" id="vfotobtn" style="display:inline-flex">${svgIco(ICON_NOM.camera)} Añadir foto<input type="file" id="vfotof" accept="image/*" data-fp="1" hidden multiple></label>
    <span class="sm">Lineal, exposición, material colocado… (hasta ${FOTOS_VISITA_MAX})</span><div class="vfotos" id="vfotos"></div></div>`);
  const pintar = () => pintarFotosVisita($('vfotos'), VISITA_ACTUAL ? VISITA_ACTUAL.fotos : [], i => { VISITA_ACTUAL.fotos.splice(i, 1); pintar(); });
  if ($('vfotof')) $('vfotof').onchange = async e => {
    for (const f of [...e.target.files]) {
      if (!VISITA_ACTUAL) break;
      if (VISITA_ACTUAL.fotos.length >= FOTOS_VISITA_MAX) { toast(`Como mucho ${FOTOS_VISITA_MAX} fotos por ${TT('visita', 's', '', 'l', 'l')}`, true); break; }
      const j = await leerFotoVisita(f); if (j) VISITA_ACTUAL.fotos.push(j);
    }
    e.target.value = ''; pintar();
  };
  return res;
})(abrirVisitaBase);
$('dlg').addEventListener('close', () => { setTimeout(() => { if (!$('dlg').open) VISITA_ACTUAL = null; }, 0); });

escribirRpc = (orig => async function (fn, payload, ...a) {
  const va = VISITA_ACTUAL;
  if (fn !== 'registrar_actividad' || !va || !payload || !payload.p || payload.p.cuenta_id !== va.id) return orig.call(this, fn, payload, ...a);
  payload.p.modo = va.modo;
  VISITA_ACTUAL = null;
  const r = await orig.call(this, fn, payload, ...a);
  if (va.fotos.length && r && !r.error) {
    if (r.data && r.data.id) subirFotosVisita(r.data.id, va.fotos);
    else fotosGuardarPendientes(payload.p.op_id, va.fotos);   // v2.259.0: se suben con la visita
  }
  return r;
})(escribirRpc);

// Historial de la ficha: cuántas fotos tiene cada visita y la ventana para verlas, añadir o borrar
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    const filas = [...document.querySelectorAll('#fbody [data-vrow]')];
    if (filas.length) {
      const { data } = await db.from('actividad_fotos').select('actividad_id').in('actividad_id', filas.map(f => f.dataset.vrow));
      const n = {}; (data || []).forEach(x => { n[x.actividad_id] = (n[x.actividad_id] || 0) + 1; });
      filas.forEach(f => {
        if (f.querySelector('[data-vfotos]')) return;
        const k = n[f.dataset.vrow] || 0, sitio = f.querySelector('span');
        if (sitio && (k || f.querySelector('[data-editv]'))) sitio.insertAdjacentHTML('beforeend', `<div><button type="button" class="lnk vfotoslnk" data-vfotos="${f.dataset.vrow}">${svgIco(ICON_NOM.camera)} ${k ? (k === 1 ? '1 foto' : k + ' fotos') : 'Añadir fotos'}</button></div>`);
      });
      document.querySelectorAll('#fbody [data-vfotos]').forEach(b => b.onclick = () => verFotosVisita(b.dataset.vfotos, id));
    }
  } catch (e) {}
  return r;
})(abrirFicha);


/* v2.192.0 · Muestras con control legal (primera tanda del estudio por sectores, SQL 119; RD 1416/1994, art. 16).
   - Producto: «Muestra con control legal» con fecha de autorización (se pueden dar los 2 años siguientes) y máximo por profesional y año.
   - Registrar visita: si la empresa tiene productos regulados, bloque «Muestras de medicamento» con lo que queda este año para ese
     profesional; si se entrega alguna, pide la firma (con el dedo o el ratón) y el nombre de quien firma. Se comprueba antes de guardar
     la visita; después, registrar_muestras guarda todo o nada (también desde la cola sin conexión, enlazada por el op_id de la visita).
   - Ficha: «Muestras este año» con lo entregado y lo que queda de cada producto regulado. */
const MUESTRA_ERR = { firma: 'Falta la firma de quien recibe las muestras', profesional: 'Las muestras solo se entregan a profesionales, no a un centro',
  plazo: 'Ese producto ya no se puede dar como muestra (han pasado 2 años desde su autorización)', limite: 'Se pasa del máximo de muestras de este año',
  permiso: 'No puedes registrar muestras de esta ficha', producto: 'Producto no encontrado', no_existe: 'Ficha no encontrada' };
const muestraError = r => (MUESTRA_ERR[r && r.error] || 'No se han podido guardar las muestras') +
  (r && r.error === 'limite' ? ` (${r.producto}: quedan ${r.quedan} de ${r.max})` : r && r.error === 'plazo' ? ` (${r.producto})` : '');

// Producto: datos de la muestra regulada (solo administración; se guardan al cambiarlos)
editorProducto = (orig => function (p, ...r) {
  const x = orig.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !$('dbody') || !$('prok') || $('prmuestra')) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    if (!p || !p.id) { ref.insertAdjacentHTML('beforebegin', '<div class="blk" id="prmuestra"><h3>Muestras con control legal</h3><p class="sm">Guarda el producto y vuelve a abrirlo para marcarlo como muestra con control legal.</p></div>'); return; }
    const { data: m } = await db.from('productos').select('muestra_regulada,muestra_desde,muestra_max').eq('id', p.id).maybeSingle();
    if (!$('dbody') || $('prmuestra')) return;
    const d = m || {};
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prmuestra"><h3>Muestras con control legal</h3>
      <label class="opt"><input type="checkbox" id="prmreg" ${d.muestra_regulada ? 'checked' : ''}> Es un medicamento: sus muestras llevan firma y límite</label>
      <div class="g2 ${d.muestra_regulada ? '' : 'hide'}" id="prmdat">
        <div><label for="prmdesde">Autorizado el</label><input id="prmdesde" type="date" value="${esc(d.muestra_desde || '')}"></div>
        <div><label for="prmmax">Máximo por profesional y año</label><input id="prmmax" type="number" min="1" max="10" step="1" value="${d.muestra_max || 10}"></div></div>
      <p class="sm">La ley permite como mucho 10 muestras por medicamento, profesional y año, durante los 2 años siguientes a su autorización, y con la solicitud firmada.</p></div>`);
    const guardar = async () => {
      const reg = $('prmreg').checked, max = Math.min(10, Math.max(1, +$('prmmax').value || 10));
      $('prmdat').classList.toggle('hide', !reg);
      const { error } = await db.from('productos').update({ muestra_regulada: reg, muestra_desde: $('prmdesde').value || null, muestra_max: max }).eq('id', p.id);
      toast(error ? 'No se ha podido guardar: ' + error.message : 'Muestras: guardado', !!error);
    };
    ['prmreg', 'prmdesde', 'prmmax'].forEach(k => $(k).addEventListener('change', guardar));
  }, 120);
  return x;
})(editorProducto);


abrirVisitaBase = (orig => async function (id, ...r) {
  const res = await orig.call(this, id, ...r);
  const d = $('dbody'), nota = $('vn');
  if (!d || !nota || !$('vguardar') || $('vmuestras') || !VISITA_ACTUAL || VISITA_ACTUAL.id !== id) return res;
  if (!navigator.onLine) return res;   // v2.259.0: sin red no hay muestras (y db.from tardaba más de 10 s en rendirse)
  try { const { data: ct } = await db.from('cuentas').select('tipo').eq('id', id).maybeSingle(); if (ct && ct.tipo === 'Centro') return res; } catch (e) {}   // v2.203.0
  const { data: l } = await db.rpc('muestras_de_cuenta', { p_cuenta: id });
  if (!Array.isArray(l) || !l.length || !$('vn') || $('vmuestras')) return res;
  const nombre = (d.querySelector('.fh .sm') || {}).textContent || '';
  const lab = nota.previousElementSibling && nota.previousElementSibling.tagName === 'LABEL' ? nota.previousElementSibling : nota;
  lab.insertAdjacentHTML('beforebegin', `<div class="vmuestras" id="vmuestras"><label>Muestras de medicamento</label>
    ${l.map(x => `<div class="vmrow ${x.en_plazo && x.quedan ? '' : 'agotada'}"><span><b>${esc(x.nombre)}</b><span class="sm">${!x.en_plazo ? 'Ya no se puede dar: el plazo acabó el ' + fechaCorta(x.hasta)
      : `Quedan ${x.quedan} de ${x.max} este año${x.hasta ? ' · hasta el ' + fechaCorta(x.hasta) : ''}`}</span></span>
      <input type="number" min="0" max="${x.en_plazo ? x.quedan : 0}" step="1" value="0" data-vmprod="${x.producto_id}" aria-label="Muestras de ${esc(x.nombre)}" ${x.en_plazo && x.quedan ? '' : 'disabled'}></div>`).join('')}
    <div class="vmfirma hide" id="vmfirma"><label>Firma de quien las recibe <span class="sm">· solicitud de muestras con fecha de hoy</span></label>
      <canvas id="vmcanvas" aria-label="Espacio para firmar"></canvas>
      <div class="vmfpie"><input id="vmfirmante" value="${esc(nombre)}" aria-label="Nombre de quien firma" placeholder="Nombre de quien firma"><button type="button" class="lnk" id="vmborrar">Borrar la firma</button></div></div></div>`);
  let pad = null;
  const items = () => [...d.querySelectorAll('[data-vmprod]')].map(i => ({ producto_id: i.dataset.vmprod, unidades: Math.max(0, Math.floor(+i.value || 0)), max: +i.max })).filter(x => x.unidades > 0);
  const ver = () => { const hay = items().length > 0; $('vmfirma').classList.toggle('hide', !hay); if (hay && !pad) pad = padFirma($('vmcanvas')); };
  d.querySelectorAll('[data-vmprod]').forEach(i => i.addEventListener('input', ver));
  $('vmborrar').onclick = () => pad && pad.borrar();
  VISITA_ACTUAL.muestras = {
    items, firmante: () => $('vmfirmante') ? $('vmfirmante').value.trim() : '', firma: () => (pad ? pad.imagen() : null),
    validar: () => {
      const it = items();
      if (!it.length) return null;
      const pasa = it.find(x => x.unidades > x.max);
      if (pasa) return 'Se pasa del máximo de muestras de este año';
      if (!pad || pad.vacia()) return 'Falta la firma de quien recibe las muestras';
      return null;
    }
  };
  return res;
})(abrirVisitaBase);
// Antes de guardar la visita se comprueban las muestras (si algo falla, no se guarda nada)
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#vguardar');
  if (!b || !VISITA_ACTUAL || !VISITA_ACTUAL.muestras) return;
  const msg = VISITA_ACTUAL.muestras.validar();
  if (msg) { e.stopImmediatePropagation(); e.preventDefault(); toast(msg, true); }
}, true);
escribirRpc = (orig => async function (fn, payload, ...a) {
  const va = VISITA_ACTUAL;
  if (fn !== 'registrar_actividad' || !va || !va.muestras || !payload || !payload.p || payload.p.cuenta_id !== va.id) return orig.call(this, fn, payload, ...a);
  const items = va.muestras.items().map(x => ({ producto_id: x.producto_id, unidades: x.unidades }));
  const firma = va.muestras.firma(), firmante = va.muestras.firmante();
  const r = await orig.call(this, fn, payload, ...a);
  if (items.length && r && !r.error) {
    const pm = { cuenta_id: payload.p.cuenta_id, fecha: payload.p.fecha, items, firma, firmante, op_id: 'm-' + payload.p.op_id,
      ...(r.data && r.data.id ? { actividad_id: r.data.id } : { actividad_op: payload.p.op_id }) };
    const rm = await orig.call(this, 'registrar_muestras', { p: pm });
    if (rm && !rm.error && rm.data && rm.data.ok === false) setTimeout(() => toast(`${TT('visita', 's', '', 'l', 'C', 'guardado')}, pero las muestras no: ${muestraError(rm.data)}`, true), 2600);
    else if (rm && rm.error) setTimeout(() => toast(`${TT('visita', 's', '', 'l', 'C', 'guardado')}, pero las muestras no se han podido guardar`, true), 2600);
  }
  return r;
})(escribirRpc);

// Ficha: lo entregado este año de cada producto regulado
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    const sitio = $('fzcampos'); if (!sitio || $('fmuestras')) return r;
    const { data: l } = await db.rpc('muestras_de_cuenta', { p_cuenta: id });
    if (!Array.isArray(l) || !l.length || !$('fzcampos') || $('fmuestras') || FICHA_ID !== id) return r;
    $('fzcampos').insertAdjacentHTML('beforebegin', `<div class="blk" id="fmuestras"><h3>Muestras este año</h3>
      ${l.map(x => `<div class="fmrow"><span>${esc(x.nombre)}</span><b>${x.entregadas} de ${x.max}</b>${!x.en_plazo ? '<span class="pill p-anu">Fuera de plazo</span>' : !x.quedan ? '<span class="pill p-warn">Sin muestras este año</span>' : ''}</div>`).join('')}</div>`);
  } catch (e) {}
  return r;
})(abrirFicha);

/* v2.193.0 · Pedido a través del distribuidor (primera tanda del estudio por sectores, SQL 120; decisiones de Eric: quién factura se elige
   en cada pedido, el pedido del distribuidor no saca stock de nuestro almacén y le llega por correo).
   - Editor del pedido: «Lo sirve» Nosotros / Un distribuidor; con distribuidor, cuál, el código del cliente en él y «Lo factura el
     distribuidor». La administración añade distribuidores desde ahí mismo («+ Nuevo distribuidor»).
   - Ver pedido: bloque «Distribuidor» con «Preparar correo al distribuidor» (el correo de la persona, con las líneas y el código del
     cliente, como los de factura y pago) que deja apuntado que se ha enviado; si lo factura el distribuidor, no se ofrece «Emitir factura». */
let DISTRIBUIDORES = null, PED_DIST = null;
editorPedido = (orig => async function (pedido, ...a) {
  const ped = pedido && pedido.pedido ? pedido.pedido : null;
  PED_DIST = { on: !!(ped && ped.distribuidor_id), id: (ped && ped.distribuidor_id) || '', codigo: (ped && ped.distribuidor_codigo) || '',
    factura: ped && ped.distribuidor_id ? !!ped.factura_distribuidor : true };
  await cargarDistribuidores().catch(() => []);
  return orig.call(this, pedido, ...a);
})(editorPedido);
new MutationObserver(() => { if ($('porig') && !$('pdist')) pintarBloqueDistribuidor(); }).observe($('dbody'), { childList: true, subtree: true });


// Al guardar el pedido desde su editor, va también quién lo sirve
db.rpc = (orig => function (fn, params, ...a) {
  if (fn === 'guardar_pedido' && params && params.p && $('pdist') && PED_DIST) {
    const on = PED_DIST.on && !!PED_DIST.id;
    Object.assign(params.p, { distribuidor_id: on ? PED_DIST.id : '', distribuidor_codigo: on ? PED_DIST.codigo : '', factura_distribuidor: on && PED_DIST.factura });
  }
  return orig.call(this, fn, params, ...a);
})(db.rpc);

// Ver pedido: distribuidor, correo para él y sin «Emitir factura» si factura él
verPedido = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    if (!$('dlg').open || $('pddist')) return r;
    const { data } = await RPC_ORIG('pedido_detalle', { p_id: id });
    const p = data && data.pedido; if (!p || !p.distribuidor_id || !$('dlg').open || $('pddist')) return r;
    const d = (await cargarDistribuidores()).find(x => x.id === p.distribuidor_id) || (await cargarDistribuidores(true)).find(x => x.id === p.distribuidor_id) || { nombre: 'Distribuidor' };
    if (p.factura_distribuidor && $('pvemitir')) $('pvemitir').remove();
    const cli = data.contacto || {}, l = data.lineas || [];
    const cuerpo = [`Pedido ${p.numero || ''} de ${nombreApp()}`, '', `Cliente: ${cli.nombre || p.cuenta_texto || ''}${p.distribuidor_codigo ? ' · código ' + p.distribuidor_codigo : ''}`,
      cli.direccion ? `Dirección: ${[cli.direccion, cli.cp, cli.municipio].filter(Boolean).join(', ')}` : '', '',
      ...l.map(x => `- ${x.unidades} × ${x.producto || x.nombre || ''}`), '', p.factura_distribuidor ? 'Lo factura el distribuidor.' : 'Lo factura ' + nombreApp() + '.',
      p.nota ? '\nNota: ' + p.nota : ''].filter(x => x !== null).join('\n');
    const asunto = `Pedido ${p.numero || ''} · ${cli.nombre || p.cuenta_texto || ''}`;
    const sitio = $('pdpago') || $('dbody').querySelector('.acts:last-of-type'); if (!sitio) return r;
    sitio.insertAdjacentHTML('beforebegin', `<div class="blk" id="pddist"><h3>Distribuidor</h3>
      <p>Lo sirve <b>${esc(d.nombre)}</b>${p.distribuidor_codigo ? ` · código del cliente <b>${esc(p.distribuidor_codigo)}</b>` : ''} · ${p.factura_distribuidor ? 'lo factura el distribuidor' : 'lo facturamos nosotros'}</p>
      ${p.estado === 'Confirmado' ? `<div class="acts" style="justify-content:flex-start;margin-top:6px">${d.email ? `<a class="btn sec" id="pdmaild" href="mailto:${esc(d.email)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}">Preparar correo al distribuidor</a>` : '<span class="sm">El distribuidor no tiene correo: añádelo en sus datos.</span>'}
        <span class="sm" id="pdmailest">${p.transfer_enviado_en ? 'Correo preparado el ' + fechaCorta(String(p.transfer_enviado_en).slice(0, 10)) : 'Correo sin preparar'}</span></div>` : '<p class="sm">Al confirmarlo podrás preparar el correo al distribuidor.</p>'}</div>`);
    trfPoner(id, p, d, data);   // v2.265.0
    if ($('pdmaild')) $('pdmaild').addEventListener('click', async () => {
      const { data: m } = await db.rpc('marcar_transfer_enviado', { p_id: id });
      if (m && m.ok && $('pdmailest')) $('pdmailest').textContent = 'Correo preparado el ' + fechaCorta(hoyISO());
    });
  } catch (e) {}
  return r;
})(verPedido);

/* v2.194.0 · Sin «recomendación» en los textos (decisión de Eric, 6/10/2026: puede leerse como una contrapartida con los profesionales).
   El canal del pedido «Recomendación a paciente» pasa a «Venta al paciente» (frente a «Venta a centro»), y «… que lo recomienda» /
   «Quién los recomienda» pasan a «… de referencia», con el vocabulario de cada empresa; «Recomendaciones de rutas» pasa a «Rutas
   sugeridas». Cambiado en su sitio (reemplazos2194). Las demos (sql/demo/generar_demos.py) usan «Activo» y «Visita con pedido». */

