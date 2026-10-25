/* ============================================================
   DLC OS 2.0 · Entrega 8: ruta en curso, indicadores e filtros guardados
   v2.424.0: «★ Guardar filtro» está en src/app/screens/accounts/list/save-filter.ts y el refresco de la barra de ruta en
   src/app/screens/routes/route-listeners.ts. KPI_CAT y RKEY se quedan: los leen Inicio, gráficos, Configuración y rutas.js.
   ============================================================ */

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
window.delcos.legacyA.listenToSaveFilter();
const RKEY = () => 'dlc-ruta-' + (PERFIL ? PERFIL.id : '');
window.delcos.legacyA.refreshRouteBar();
