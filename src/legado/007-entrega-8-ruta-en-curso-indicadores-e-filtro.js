/* ============================================================
   DLC OS 2.0 · Entrega 8: ruta en curso, indicadores e filtros guardados
   ============================================================ */

/* ---------------- indicadores personalizables ---------------- */

const KPI_CAT = [
  { id: 'citas',        t: 'citas de hoy visitadas',   v: k => `${k.citas_hechas}/${k.citas_hoy}` },
  { id: 'urgentes',     t: 'urgentes sin visitar',     v: k => k.urgentes, cls: k => k.urgentes ? 'warn' : 'ok', h: 'urgentes' },
  { id: 'visitas_sem',  t: `${TT('visita', 'p', '', 'l', 'l')} esta semana`,      v: k => k.visitas_semana },
  { id: 'visitas_mes',  t: `${TT('visita', 'p', '', 'l', 'l')} este mes`,         v: k => k.visitas_mes },
  { id: 'interesados',  t: `${TT('medico', 'p', '', 'l', 'l', 'interesado')}`,      v: k => k.interesados, cls: () => 'ok', h: 'interesados' },
  { id: 'sin_contactar', t: 'sin contactar',           v: k => k.sin_contactar, h: 'sin_contactar' },
  { id: 'cartera',      t: `${TT('medico', 'p', '', 'l', 'l')} en tu cartera`,    v: k => k.medicos, h: 'todos' },
  { id: 'dups',         t: 'pendientes de unificar',   v: k => k.pendientes_unificar, cls: () => 'warn', admin: true, h: 'dups' }
];
const KPI_DEF = ['citas', 'urgentes', 'visitas_sem', 'visitas_mes', 'interesados', 'sin_contactar', 'cartera', 'dups'];

const kpiConfig = () => {
  const p = (PERFIL.preferencias || {}).kpis;
  if (Array.isArray(p) && p.length) return p;
  return KPI_CAT.map(k => ({ id: k.id, on: KPI_DEF.includes(k.id), t: '' }));
};





/* ---------------- guardar el filtro actual como indicador ---------------- */


$('guardarFiltro').addEventListener('click', async ev => {
  const f = filtroActual();
  if (!Object.keys(f).length) { toast('Aplica algún filtro antes de guardarlo', true); return; }
  const nombre = await pedirTexto('Nombre del indicador', textoFiltro(f).slice(0, 40), { titulo: 'Guardar filtro', ok: 'Guardar' });
  if (nombre === null) return;
  ev.target.disabled = true;
  const lista = kpiConfig().concat([{ id: 'f:' + Date.now().toString(36), on: true, t: nombre.trim() || textoFiltro(f), filtro: f }]);
  const ok = await guardarKpis(lista);
  ev.target.disabled = false;
  if (ok) { toast('Guardado como indicador en Inicio'); cargarInicio(); }
});


/* ---------------- ruta en curso ---------------- */

const RKEY = () => 'dlc-ruta-' + (PERFIL ? PERFIL.id : '');
const rutaActiva = () => { try { return JSON.parse(localStorage.getItem(RKEY()) || 'null'); } catch (e) { return null; } };
const durTxt = ms => { const m = Math.floor(ms / 60000); return (m >= 60 ? Math.floor(m / 60) + ' h ' : '') + (m % 60) + ' min'; };



setInterval(() => { if (rutaActiva()) pintarRutaBarra(); }, 60000);



