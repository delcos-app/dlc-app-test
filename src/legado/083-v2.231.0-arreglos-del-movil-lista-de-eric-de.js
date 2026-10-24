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


