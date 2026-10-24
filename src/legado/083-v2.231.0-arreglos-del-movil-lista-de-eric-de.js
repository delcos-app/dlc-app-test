/* v2.231.0 · Arreglos del móvil (lista de Eric del 10/10/2026):
   - El logotipo de la empresa (arriba a la izquierda) lleva al inicio.
   - Configuración en el móvil: «‹ Volver» como botón (antes «‹ Configuración», que repetía el título).
   - Agenda: el «⋯» del día sale en la cabecera de «Tu día» (en táctil ya no aparece sobre el día de la cinta); «Tu día» con márgenes
     iguales (bandejas, aviso y tarjetas); las citas cerradas no llevan «⋯» y al abrirlas dicen cómo se cerraron y qué se puede cambiar.
   - Inicio: la cuadrícula de «Sin contactar» marca en color lo que falta por contactar (antes, cuadros vacíos).
   - iPhone: si una lectura no contesta en 4,5 s (la conexión se queda colgada al volver del segundo plano), se lanza otra igual y vale la
     primera que llegue; antes se esperaban 20 s. Las que pasan de 4 s quedan en el registro de errores («Lento: …») para medirlas. */

// Logotipo → inicio
document.addEventListener('click', e => {
  const l = e.target.closest && e.target.closest('header .top .logo, nav.main .mlmarca');
  if (!l || !PERFIL) return;
  const b = document.querySelector('nav.main [data-t="inicio"]') || document.querySelector('nav.main [data-t]');
  if (b) { e.preventDefault(); b.click(); }
});

// Configuración: botón de volver
cargarConfig = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const b = $('cfuvolver');
  if (b && !b.classList.contains('manvuelta')) { b.classList.add('manvuelta'); b.innerHTML = '<b aria-hidden="true">‹</b> Volver'; b.setAttribute('aria-label', 'Volver a Configuración'); }
  return r;
})(cargarConfig);



// iPhone: lecturas que se quedan colgadas
const LECT_DUP = new Set(['buscar_cuentas', 'buscar_global', 'panel_inicio', 'inicio_areas', 'inicio_graficas',
  'agenda_rango', 'agenda_metricas', 'mis_notificaciones', 'ficha_cuenta', 'operativa_pendiente', 'catalogos_todos', 'opciones_filtros']);
db.rpc = (orig => function (fn, params, opts) {
  if (!LECT_DUP.has(fn)) return orig.call(db, fn, params, opts);
  const t0 = performance.now();
  return new Promise(res => {
    let fin = false, otra = null, espera = null;
    const acabar = x => { if (fin) return; fin = true; clearTimeout(tm); clearTimeout(espera); res(x); };
    // La segunda va directa (sin la caché ni «una sola en vuelo», que devolvería la misma petición colgada)
    const tm = setTimeout(() => {
      if (fin) return;
      [...RC_VUELO.keys()].forEach(k => { if (k.startsWith(fn + '|')) RC_VUELO.delete(k); });
      otra = Promise.resolve(RPC_ORIG(fn, params, opts));
      otra.then(acabar, e => acabar({ data: null, error: e }));
    }, 4500);
    Promise.resolve(orig.call(db, fn, params, opts)).then(x => {
      if (otra && x && x.error) { espera = setTimeout(() => acabar(x), 8000); return; }
      acabar(x);
    }, e => { if (otra) espera = setTimeout(() => acabar({ data: null, error: e }), 8000); else acabar({ data: null, error: e }); });
  }).then(x => {
    const ms = Math.round(performance.now() - t0);
    if (ms > 4000 && navigator.onLine) registrarError('api', `Lento: ${fn}`, { funcion: fn, ms, pantalla: TAB, segundo_intento: ms > 4500 });
    return x;
  });
})(db.rpc);

/* v2.232.0 · Notificaciones que no vuelven (aviso de Eric; SQL 137).
   - Borrar ya no quita la fila: la marca como borrada (borrar_notificaciones). Antes, los avisos del día no encontraban su marca y la volvían a crear.
   - El panel enseña las de los últimos 7 días en dos bloques: «Nuevas» (sin leer) y «Anteriores» (leídas, más apagadas).
   - Cada notificación se puede borrar con su papelera; abajo, «Marcar todas como leídas», «Borrar las leídas» y «Borrar todas». */
if (!ICON_NOM['trash-2']) ICON_NOM['trash-2'] = '<path d="M3 6h18" /> <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /> <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /> <line x1="10" x2="10" y1="11" y2="17" /> <line x1="14" x2="14" y1="11" y2="17" />';
notifPintar = function () {
  const l = NOTIF_LISTA;
  const areas = NOTIF_AREAS.filter(a => l.some(x => notifArea(x.tipo) === a[0]));
  if (NOTIF_FILTRO && !areas.some(a => a[0] === NOTIF_FILTRO)) NOTIF_FILTRO = '';
  const vis = l.filter(x => !NOTIF_FILTRO || notifArea(x.tipo) === NOTIF_FILTRO);
  const nuevas = vis.filter(x => !x.leida_en), viejas = vis.filter(x => x.leida_en);
  const fila = x => {
    const acc = notifAcciones(x), cuando = new Date(x.visible_desde || x.creado_en), g = notifDia(x.visible_desde || x.creado_en);
    return `<div class="notit2 ${x.leida_en ? '' : 'nuevo'}" data-nidx="${l.indexOf(x)}">
      <span class="ic" aria-hidden="true">${notifIco(x.tipo)}</span>
      <div class="tx"><b>${esc(x.titulo)}</b>${x.cuerpo ? `<span class="sm">${esc(x.cuerpo)}</span>` : ''}
        <span class="sm notcuando">${g === 'Hoy' ? cuando.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : g === 'Ayer' ? 'Ayer' : cuando.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}${x.resumen ? ' · del resumen del día' : ''}</span>
        <div class="notacts">${acc.map(([t, , p], j) => `<button type="button" class="btn chico ${p ? '' : 'sec'}" data-nacc="${j}">${esc(t)}</button>`).join('')}
          ${x.leida_en ? '' : '<button type="button" class="btn sec chico" data-npos>Posponer a mañana</button>'}
          <button type="button" class="notbor" data-nbor aria-label="Borrar esta notificación" title="Borrar">${svgIco(ICON_NOM['trash-2'])}</button></div></div></div>`;
  };
  $('dbody').innerHTML = `<div class="fh"><div><h2>Notificaciones</h2><div class="sm">${NOTIF_N ? `${NOTIF_N} sin leer` : 'Estás al día'} · últimos 7 días</div></div>
      <span class="acts" style="margin:0"><button type="button" class="icobtn notcfgb" id="notcfg" title="Elegir qué recibo y cuándo" aria-label="Elegir qué recibo y cuándo">${svgIco(ICON_NOM.settings)}</button>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></span></div>
    ${areas.length > 1 ? `<div class="segs notfil" role="group" aria-label="Filtrar">${[['', 'Todas']].concat(areas.map(a => [a[0], a[1]])).map(([k, t]) =>
      `<button type="button" data-nfil="${k}" class="${NOTIF_FILTRO === k ? 'on' : ''}" aria-pressed="${NOTIF_FILTRO === k}">${esc(t)}</button>`).join('')}</div>` : ''}
    <div class="notlista2">
      ${nuevas.length ? `<h3 class="notdia">Nuevas · ${nuevas.length}</h3>${nuevas.map(fila).join('')}` : ''}
      ${viejas.length ? `<h3 class="notdia">Anteriores</h3>${viejas.map(fila).join('')}` : ''}
      ${vis.length ? '' : `<div class="vacio">${NOTIF_FILTRO ? 'No hay avisos de esta área.' : 'No tienes notificaciones de los últimos 7 días.'}</div>`}</div>
    <p class="sm notpie">Se guardan las de los últimos 7 días. Las que borras no vuelven a salir.</p>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap">
      ${NOTIF_N ? '<button class="btn sec" id="notleer">Marcar todas como leídas</button>' : ''}
      ${l.some(x => x.leida_en) ? '<button class="btn sec" id="notlimpiar">Borrar las leídas</button>' : ''}
      ${l.length ? '<button class="btn sec dang" id="notvaciar">Borrar todas</button>' : ''}</div>`;
  const cerrarYRefrescar = () => { $('dlg').close(); refrescarCampana(); };
  const quitar = xs => { NOTIF_LISTA = NOTIF_LISTA.filter(y => !xs.includes(y)); NOTIF_N = Math.max(0, NOTIF_N - xs.filter(y => !y.leida_en).length); notifPintar(); refrescarCampana(); };
  $('dbody').querySelectorAll('[data-nfil]').forEach(b => b.onclick = () => { NOTIF_FILTRO = b.dataset.nfil; notifPintar(); });
  $('dbody').querySelectorAll('.notit2').forEach(el => {
    const x = l[+el.dataset.nidx], acc = notifAcciones(x);
    el.querySelectorAll('[data-nacc]').forEach(b => b.onclick = async e => {
      e.stopPropagation();
      await db.rpc('leer_notificacion', { p_id: x.id });
      cerrarYRefrescar(); acc[+b.dataset.nacc][1]();
    });
    const pos = el.querySelector('[data-npos]');
    if (pos) pos.onclick = async e => {
      e.stopPropagation();
      const { data } = await db.rpc('posponer_notificacion', { p_id: x.id });
      if (!data || !data.ok) { toast('No se ha podido posponer', true); return; }
      toast('Te lo volvemos a enseñar mañana'); quitar([x]);
    };
    el.querySelector('[data-nbor]').onclick = async e => {
      e.stopPropagation();
      if (!await notifBorrar([x.id])) return;
      el.classList.add('notsale'); setTimeout(() => quitar([x]), 220);
    };
    el.onclick = async () => {
      await db.rpc('leer_notificacion', { p_id: x.id });
      if (acc.length) { cerrarYRefrescar(); (acc.find(a => a[2]) || acc[0])[1](); }
      else if (!x.leida_en) { x.leida_en = new Date().toISOString(); NOTIF_N = Math.max(0, NOTIF_N - 1); notifPintar(); refrescarCampana(); }
    };
  });
  if ($('notleer')) $('notleer').onclick = async () => {
    await db.rpc('leer_notificaciones'); const ahora = new Date().toISOString();
    NOTIF_LISTA.forEach(x => { if (!x.leida_en) x.leida_en = ahora; }); NOTIF_N = 0; notifPintar(); refrescarCampana();
  };
  if ($('notlimpiar')) $('notlimpiar').onclick = async () => { if (await notifBorrar(null, true)) { toast('Notificaciones leídas borradas'); quitar(NOTIF_LISTA.filter(x => x.leida_en)); } };
  if ($('notvaciar')) $('notvaciar').onclick = async () => {
    const op = await elegirOpcion('Borrar todas las notificaciones', 'Se borran todas, también las que no has leído, y no vuelven a salir.', [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'si', t: 'Borrar todas' }]);
    if (op === 'si' && await notifBorrar(null, false)) { toast('Notificaciones borradas'); cerrarYRefrescar(); }
  };
  $('notcfg').onclick = () => { $('dlg').close(); CFG_SEC = 'notif'; window.__CFG_DIRECTO = true; ir('config'); };
};

let RM_LIB = null, RM_MAPA = null, RM_ANIM = null;




/* v2.234.0 · Rutas paso a paso (Eric eligió la B de https://claude.ai/artifact/1Ggx6ScuLR1Ad1kfmbQ6t1; SQL 139).
   - Fuera las propuestas automáticas. «Mis rutas» en tarjetas: recorrido dibujado, cuándo se hace, próxima fecha, a cuántos ves,
     kilómetros y hora de fin; «Pasar a mi agenda», «Editar» y «Eliminar» a la vista.
   - Crear o editar en tres pasos: 1) a quién vas a ver (buscador, filtros y mapa: tocar un punto lo añade), 2) orden y horario
     (el mejor orden se calcula solo respetando las horas de atención; se puede cambiar a mano y fijar horas), 3) vista previa del día
     (por las calles, con la función «rutas») y cuándo: un día concreto, cada semana, cada 15 días o una vez al mes (1.ª–4.ª o última
     semana). El nombre se propone solo (día y municipios) y se puede cambiar.
   - Pasar a la agenda: las citas de los días que tocan (8 semanas o 3 meses), sin duplicar (op_id por ruta, ficha y día) y saltando
     los días bloqueados. Las rutas que se repiten se rellenan solas hasta 4 semanas vista (repeticion.hasta guarda hasta dónde). */
const RN_DIAS = ['L', 'M', 'X', 'J', 'V'], RN_DIAN = { L: 'lunes', M: 'martes', X: 'miércoles', J: 'jueves', V: 'viernes' };
let RN_LISTA = null, RN_MAPA_P = null;    // tarjetas de Mis rutas: [{r, ms}]



cargarRutasBase = async function () {
  const v = $('v-rutas');
  if (RN) return rnPintar();
  const { data: rutas } = await db.rpc('rutas_visibles');
  RUTAS = rutas || [];
  const lista = await Promise.all(RUTAS.map(async r => ({ r, ms: await rnMiembros(r) })));
  RN_LISTA = lista;
  v.innerHTML = `
    <div class="saludo"><div><h1>Rutas</h1><div class="fecha">Tus rutas: créalas paso a paso, revísalas y pásalas a tu agenda</div></div>
      <div class="acts" style="margin:0"><button class="btn" id="rnueva">+ Nueva ruta</button></div></div>
    <div class="rngrid" id="rngrid">${lista.map(({ r, ms }, i) => {
      const rep = r.repeticion || null, f = rnFechaRef(rep, r.nombre), h = rnHoras(ms, f, r.salida, r.vuelta, r.fijas), prox = rnProxima(rep);
      const paradas = new Set(ms.filter(m => m.lat != null).map(m => (+m.lat).toFixed(5) + ',' + (+m.lon).toFixed(5))).size;
      return `<article class="rncard" data-rni="${i}"><div class="rncro">${rnCroquis(ms)}<span class="rndia">${esc(rnCuando(rep))}</span></div>
        <div class="rntx"><b>${esc(r.nombre)}</b>
          <span class="sm">${num(ms.length)} ${ms.length === 1 ? TT('medico', 's', '', 'l', 'l') : TT('medico', 'p', '', 'l', 'l')} · ${paradas} ${paradas === 1 ? 'parada' : 'paradas'}${h.km >= 1 ? ' · ' + Math.round(h.km) + ' km' : ''}</span>
          <span class="sm">${ms.length ? `De ${r.salida ? String(r.salida).slice(0, 5) : '09:00'} a ${hm(h.fin)}` : 'Todavía sin nadie'}${prox ? ` · próxima: ${esc(fechaCorta(prox))}` : ''}${r.mia ? '' : ' · de ' + esc(r.duenyo || '')}</span></div>
        <div class="rnacts"><button class="btn chico" type="button" data-rnag="${i}">Pasar a mi agenda</button>
          ${r.mia || puede('administrar') ? `<button class="btn sec chico" type="button" data-rned="${i}">${rnSV(RN_IC.lapiz)} Editar</button>
          <button class="btn sec chico rnico" type="button" data-rnbor="${i}" aria-label="Eliminar ${esc(r.nombre)}" title="Eliminar">${rnSV(RN_IC.papelera)}</button>` : `<button class="btn sec chico" type="button" data-rnver="${i}">Ver</button>`}</div></article>`; }).join('')}
      <button class="rnnueva" type="button" id="rnnueva2"><span><span class="mas">+</span><b>Nueva ruta</b><span class="sm">${lista.length ? 'Elige a quién vas a ver y en qué orden' : `Tu primera ruta: elige a quién vas a ver, el orden y cuándo. La app calcula las horas.`}</span></span></button></div>
    <div id="rcuerpo" hidden></div><div id="rplan"></div>`;
  $('rnueva').onclick = $('rnnueva2').onclick = () => rnAbrir(null);
  v.querySelectorAll('[data-rned]').forEach(b => b.onclick = () => rnAbrir(lista[+b.dataset.rned], 3));
  v.querySelectorAll('[data-rnver]').forEach(b => b.onclick = () => rnAbrir(lista[+b.dataset.rnver], 3));
  v.querySelectorAll('[data-rnag]').forEach(b => b.onclick = () => rnPasarAgenda(lista[+b.dataset.rnag], b));
  v.querySelectorAll('[data-rnbor]').forEach(b => b.onclick = async () => {
    const { r } = lista[+b.dataset.rnbor];
    if (!await preguntar(`Se elimina «${r.nombre}». Las citas que ya están en tu agenda no se borran.`, { titulo: '¿Eliminar la ruta?', ok: 'Eliminar', peligro: true })) return;
    const { error } = await db.rpc('guardar_ruta', { p: { id: r.id, activa: false } });
    if (error) { toast('No se ha podido eliminar', true); return; }
    toast('Ruta eliminada'); invalidarCache(); cargarRutas();
  });
};

setTimeout(() => { if (typeof PERFIL !== 'undefined' && PERFIL && (typeof verArea !== 'function' || verArea('rutas'))) rnRellenar(); }, 8000);




document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('nav.main [data-t="rutas"], #bnav [data-t="rutas"], .bmasgrid [data-bm="rutas"]'); if (b && RN) RN = null; }, true);


function aplicarEtiqueta(...a) { const r = aplicarEtiquetaBase.apply(this, a); try { aplicarNombresMenu(); } catch (e) {} return r; }
ir = (orig => function (...a) { const r = orig.apply(this, a); setTimeout(() => { try { aplicarNombresMenu(); } catch (e) {} }, 0); Promise.resolve(r).then(() => { try { aplicarNombresMenu(); } catch (e) {} }); return r; })(ir);
// Cuando el menú se vuelve a montar (al arrancar, al cambiar de tamaño…), se vuelven a poner los nombres
if (typeof montarMenuLateral === 'function') montarMenuLateral = (orig => function (...a) { const r = orig.apply(this, a); try { aplicarNombresMenu(); } catch (e) {} return r; })(montarMenuLateral);
new MutationObserver(() => { if (!Object.keys(menuNombres()).length || TX_OBS) return; TX_OBS = requestAnimationFrame(() => { TX_OBS = 0; try { aplicarNombresMenu(); } catch (e) {} }); })
  .observe(document.body, { childList: true, subtree: true });

// ---------- la pantalla ----------
function arbolCfgUnicoBase2(...a) {
  const g = arbolCfgUnicoBase.apply(this, a);
  if (!puedeOrganizacion()) return g;
  const emp = g.find(x => x[0] === 'Empresa');
  if (emp && !emp[1].some(x => x.k === 'o.textos')) {
    const i = emp[1].findIndex(x => x.k === 'o.marca');
    emp[1].splice(i + 1, 0, { k: 'o.textos', t: 'Textos personalizados', ic: 'file-text', d: 'Cómo se llama cada módulo en tu empresa', r: () => pintarTextos() });
  }
  return g;
}
CFG_CLAVES['o.textos'] = 'textos nombres vocabulario menú menu estados resultados roles campos renombrar palabras';


