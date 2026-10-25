/* ============================================================
   DLC OS 2.0 · v2.17.0 · Velocidad, ventanas, paginación,
   duplicados, auditoría y ayudas
   ============================================================ */

/* ---------------- caché de peticiones ----------------
   Lo ya recibido se reutiliza durante unos segundos o minutos según el dato.
   Dos peticiones iguales a la vez se unifican en una sola.
   Cualquier escritura vacía la caché para que lo siguiente que se lea sea actual. */

const RPC_ORIG = db.rpc.bind(db);
const FROM_ORIG = db.from.bind(db);

const RC = new Map(), RC_VUELO = new Map();


db.rpc = function (fn, params, opts) {
  if (RPC_ESCRITURA.test(fn)) { invalidarCache(); return conCatch(RPC_ORIG(fn, params, opts)); }
  const ttl = RPC_TTL[fn];
  if (!ttl || !navigator.onLine) return conCatch(RPC_ORIG(fn, params, opts));

  const k = fn + '|' + JSON.stringify(params || {});
  let e = RC.get(k);
  if (!e && ttl >= 300) {           // los datos que cambian poco se guardan también en el dispositivo
    try { e = JSON.parse(localStorage.getItem(rcLS(k)) || 'null'); if (e) RC.set(k, e); } catch (err) { e = null; }
  }
  if (e && Date.now() - e.t < ttl * 1000) return Promise.resolve(rcCopia(e.r));
  if (RC_VUELO.has(k)) return RC_VUELO.get(k).then(rcCopia);

  const epoca = RC_EPOCA;
  const p = Promise.resolve(RPC_ORIG(fn, params, opts)).then(r => {
    RC_VUELO.delete(k);
    if (!r.error && epoca === RC_EPOCA) {
      const x = { t: Date.now(), r: { data: r.data, error: null } };
      RC.set(k, x);
      if (ttl >= 300) { try { localStorage.setItem(rcLS(k), JSON.stringify(x)); } catch (err) {} }
    }
    return r;
  }, err => { RC_VUELO.delete(k); throw err; });
  RC_VUELO.set(k, p);
  return p.then(rcCopia);
};

db.from = function (tabla) {
  const q = FROM_ORIG(tabla);
  ['insert', 'update', 'upsert', 'delete'].forEach(m => {
    const f = q[m];
    if (typeof f === 'function') q[m] = (...a) => { invalidarCache(); return f.apply(q, a); };
  });
  return q;
};

/* ---------------- navegación: recordar de dónde venimos ---------------- */


/* ---------------- inicio: un único cargador hasta tenerlo todo ---------------- */

let INI_LISTO = false, DUP_RES = null;



/* ---------------- ventanas y paneles: se cierran al pulsar fuera ---------------- */

let PTR_ABAJO = null, TRAGAR_CLIC = false;
document.addEventListener('click', e => {
  if (!TRAGAR_CLIC) return;
  TRAGAR_CLIC = false; e.preventDefault(); e.stopPropagation();
}, true);
document.addEventListener('pointerdown', e => {
  PTR_ABAJO = e.target;
  const t = $('tools');
  if (t.classList.contains('abierto') && !t.contains(e.target) && !e.target.closest('#tools2')
      && !e.target.closest('#dirtools, #segtools, #antools, .htbtn') && !document.querySelector('dialog[open]')) {
    t.classList.remove('abierto');
    TRAGAR_CLIC = true;              // el clic que cierra el panel no activa lo que hay debajo
  }
  const pop = document.querySelector('.aipop');
  if (pop && !pop.contains(e.target) && !e.target.closest('.ai')) pop.remove();
}, true);

// Solo cierra si el clic empieza y acaba fuera (así no se cierra al seleccionar texto y soltar fuera).
['ficha', 'dlg', 'dlg2'].forEach(id => {
  const d = $(id);
  d.addEventListener('click', e => { if (e.target === d && PTR_ABAJO === d) { if (id === 'ficha') d.close(); else intentarCerrar(d); } });
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  $('tools').classList.remove('abierto');
  const pop = document.querySelector('.aipop'); if (pop) pop.remove();
});

/* ---------------- paginación ---------------- */






let T_OBS = null;
new MutationObserver(muts => {
  if (muts.every(m => m.target.nodeType === 1 && m.target.closest('.pag, .aipop'))) return;
  clearTimeout(T_OBS);
  T_OBS = setTimeout(() => { paginarListas(); ponerAyudas(); }, 40);
}).observe(document.body, { childList: true, subtree: true });

/* ---------------- auditoría con filtro por usuario ---------------- */


/* ---------------- ayudas (i) en pantallas, tarjetas e indicadores ---------------- */

const AYUDA_KPI = {
  citas: 'Citas de hoy que ya están marcadas como visitadas, sobre el total de citas del día. Las descartadas no cuentan.',
  urgentes: `${TT('medico', 'p', '', 'l', 'C', 'marcado')} como urgentes que todavía no tienen ${TT('visita', 's', 'ningun', 'l', 'l')}. Pulsa para verlos en el Directorio.`,
  visitas_sem: `${TT('visita', 'p', '', 'l', 'C', 'registrado')} desde el lunes de esta semana.`,
  visitas_mes: `${TT('visita', 'p', '', 'l', 'C', 'registrado')} desde el día 1 de este mes.`,
  interesados: `${TT('medico', 'p', '', 'l', 'C')} en estado «${estadoPapel('interes') || 'interés'}». El siguiente paso es conseguir ${TT('pauta', 's', 'primer', 'l', 'l')}. Pulsa para verlos.`,
  sin_contactar: `${TT('medico', 'p', '', 'l', 'C')} a los que todavía no se ha presentado el producto. Pulsa para verlos.`,
  cartera: `${TT('medico', 'p', '', 'l', 'C')} que puedes ver: tu cartera asignada o, si eres de administración o televenta, toda la base.`,
  dups: 'Fichas marcadas como posible duplicado al darlas de alta. Pulsa para revisarlas y unificarlas.',
  filtro: `Indicador creado con «Guardar filtro» en el Directorio. Cuenta ahora mismo ${TT('medico', 'p', 'el', 'l', 'l')} que cumplen ese filtro. Pulsa para ver la lista.`
};

const AYUDA = {
  inicio: ['Tu inicio', 'El resumen de tu día.', [`Pulsa un indicador para ver la lista de ${TT('medico', 'p', '', 'l', 'l')} que cuenta.`,
    'Con «⚙ Personalizar indicadores» eliges cuáles ver y en qué orden, y añades filtros guardados.']],
  ini_agenda: ['Tu agenda de hoy', 'Citas de hoy ordenadas por hora. En verde, las ya visitadas.',
    ['Para añadir citas, ve a Agenda o planifica una ruta.', `Pulsa ${TT('medico', 's', 'un', 'l', 'l')} para abrir su ficha y registrar ${TT('visita', 's', 'el', 'l', 'l')}.`]],
  ini_acciones: ['Próximas acciones', `La próxima acción que quedó apuntada en la ${TT('visita', 's', 'ultimo', 'l', 'l')} de cada ${TT('medico', 's', '', 'l', 'l')}, para los próximos 7 días.`,
    ['En naranja, las que ya han pasado de fecha.', 'Márcalas como hechas o aplázalas desde Seguimiento.']],
  ini_urgentes: ['Urgentes sin visitar', `${TT('medico', 'p', '', 'l', 'C', 'marcado')} como urgentes que aún no tienen ${TT('visita', 's', 'ningun', 'l', 'l')}.`,
    ['El motivo de urgencia se ve en su ficha.', 'Desde Rutas puedes planificar una ruta solo con urgentes.']],
  ini_ultimas: [`${TT('visita', 'p', 'ultimo', 'C', 'l')}`, `${TT('visita', 'p', 'el', 'C', 'l', 'registrado')} más recientes, con su resultado.`, []],
  ini_recom: ['Rutas sugeridas', 'Listas calculadas cada día con tus datos. Al pulsar una, se planifica la ruta del día.',
    ['«Atienden hoy»: atienden este día de la semana y no se visitan desde hace más de 14 días.',
     `«${TT('medico', 'p', '', 'l', 'C', 'interesado')}»: en estado «${estadoPapel('interes') || 'interés'}» y sin ${TT('visita', 's', '', 'l', 'l')} en 20 días.`,
     `Solo entran ${TT('medico', 'p', '', 'l', 'l')} con ubicación: completar direcciones mejora las propuestas.`]],
  ini_pend: ['Pendientes de rutas anteriores', 'Citas que planificaste y quedaron sin visitar.',
    ['Desde Agenda puedes moverlas a hoy, cambiarlas de fecha o descartarlas.']],
  ini_comision: ['Tu actividad del mes', `Unidades atribuidas a tus ${TT('medico', 'p', '', 'l', 'l')} en el periodo.`,
    ['El tramo alcanzado se aplica a todas las unidades del periodo, no solo a las que superan el tramo.',
     'Lo que se ve (unidades o importe) lo decide administración.']],
  agenda: ['Agenda', 'Tus citas por día, semana o mes.', [`«+ Nueva cita» crea una cita con ${TT('medico', 's', 'un', 'l', 'l')}.`,
    'En cada cita puedes cambiar la hora, moverla o descartarla.',
    `Al registrar ${TT('visita', 's', 'el', 'l', 'l')} desde la ficha, la cita pasa a «Visitada».`,
    'Abajo verás los pendientes de rutas anteriores para recolocarlos.']],
  rutas: ['Rutas', 'Crea rutas y conviértelas en el plan del día.', [
    `<b>Lista fija</b>: tú eliges ${TT('medico', 'p', 'el', 'l', 'l')}. <b>Por criterios</b>: se rellena sola con los filtros (municipio, estado, días de atención…).`,
    '<b>Propuestas automáticas</b>: las mismas listas que ves en Inicio.',
    `El plan ordena las paradas por cercanía y calcula horas con la salida y la vuelta de la ruta, y los minutos por ${TT('visita', 's', '', 'l', 'l')} y entre paradas.`,
    'El navegador (Google Maps, Apple Maps o Waze) se elige en el plan o en Configuración.',
    'Al empezar la ruta aparece la barra verde con el tiempo en curso.',
    `Solo entran ${TT('medico', 'p', '', 'l', 'l')} con ubicación. Completar la dirección y los días de atención mejora mucho las rutas.`]],
  directorio: ['Directorio', `Todos ${TT('medico', 'p', 'el', 'l', 'l')} que puedes ver.`, [
    'El buscador de arriba filtra por nombre, centro o municipio.',
    `El municipio y la provincia cuentan ${todosLos('consulta').toLowerCase()} ${TT('medico', 's', 'del', 'l', 'l')}, no solo la principal.`,
    '«⋮» abre los filtros, las columnas y las descargas.',
    '«★ Guardar filtro» convierte los filtros actuales en un indicador de Inicio.',
    '«Cerca de mí» usa la ubicación del dispositivo.',
    `Al crear ${TT('medico', 's', 'un', 'l', 'l')} o centro, la app avisa si ya existe uno parecido.`]],
  seguimiento: ['Seguimiento', `Cómo avanza cada ${TT('medico', 's', '', 'l', 'l')}.`, [
    'Los indicadores de arriba muestran el embudo por estado comercial y la calidad de los datos.',
    '«Mostrar» filtra por visitados, sin visitar, con próxima acción o atrasados.',
    '«Hecha» cierra la próxima acción; «Aplazar» le pone otra fecha.',
    'Las descargas están en «⋮».']],
  ventas: ['Ventas', 'Pedidos y unidades atribuidas.', [
    `La venta a ${TT('paciente', 's', '', 'l', 'l')} se atribuye ${TT('medico', 's', 'al', 'l', 'l', 'indicado')} y al comercial que lo tenía asignado en ese momento.`,
    'La venta a centro se atribuye a la ficha del centro, si la tiene; si no, a nadie.',
    `Si un pedido no tiene ${TT('medico', 's', '', 'l', 'l', 'reconocido')}, se puede encontrar filtrando la lista de pedidos para asignarlo a mano.`,
    'Solo televenta y administración crean o cambian pedidos.']],
  analitica: ['Analítica', 'Unidades o importe agrupados como elijas.', [
    `Elige la dimensión: ${TT('medico', 's', '', 'l', 'l')}, comercial, producto, municipio, mes o canal.`,
    'La tabla por meses sirve para ver tendencias.',
    'Las descargas están en «⋮».']],
  config: ['Configuración', 'Ajustes de tu cuenta y de la plataforma.', [
    'Preferencias de salida y llegada: se usan para calcular las rutas.',
    'Al pulsar «Cómo llegar» o abrir una ruta, eliges en ese momento con qué app navegar (Google Maps, Waze o Apple Maps).',
    `Clasificadores: las opciones que aparecen al registrar ${TT('visita', 'p', '', 'l', 'l')} y en las fichas.`]],
  admin: ['Administración', 'Usuarios, permisos y control.', [
    'Permisos por área: <b>Ver</b>, <b>Editar</b> o <b>Completo</b>. Se aplican en la base de datos, no solo en la pantalla.',
    `La cartera decide qué ${TT('medico', 'p', '', 'l', 'l')} ve cada comercial.`,
    'Las comisiones se configuran por esquema y se asignan por persona.',
    'Accesos y auditoría registran entradas y cambios.']],
  duplicados: ['Duplicados', 'Fichas que pueden ser la misma persona.', [
    '<b>Pendientes</b>: marcadas al darlas de alta. <b>Nombres parecidos</b>: coincidencia del 80% o más.',
    'Al comparar eliges qué ficha queda y qué dato conservar de cada campo.',
    `${TT('consulta', 'p', '', 'l', 'C')}, ${TT('visita', 'p', '', 'l', 'l')}, citas y cartera se juntan en la ficha que queda. No se puede deshacer desde la app.`,
    '«No son duplicados» guarda la pareja como distinta y no vuelve a salir.']]
};



document.addEventListener('click', e => {
  const b = e.target.closest('.ai');
  if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const prev = document.querySelector('.aipop');
  if (prev) { const mismo = prev.__de === b; prev.remove(); if (mismo) return; }
  let tit, cuerpo;
  if (b.dataset.ayuda) {
    const [t, x, l] = AYUDA[b.dataset.ayuda] || ['Ayuda', '', []];
    tit = esc(t); cuerpo = esc(x) + (l.length ? `<ul>${l.map(i => `<li>${i}</li>`).join('')}</ul>` : '');
  } else { tit = esc(b.dataset.ayudaTit || 'Qué es'); cuerpo = esc(b.dataset.ayudaTxt || ''); }
  const pop = document.createElement('div');
  pop.className = 'aipop'; pop.__de = b;
  pop.innerHTML = `<b>${tit}</b>${cuerpo}`;
  document.body.appendChild(pop);
  const r = b.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let x = Math.min(window.innerWidth - w - 10, Math.max(10, r.left + r.width / 2 - w / 2));
  let y = r.bottom + 8; if (y + h > window.innerHeight - 10) y = Math.max(10, r.top - h - 8);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
}, true);


