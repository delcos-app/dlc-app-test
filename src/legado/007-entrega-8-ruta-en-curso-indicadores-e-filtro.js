/* ============================================================
   DLC OS 2.0 · Entrega 8: ruta en curso, indicadores e filtros guardados
   v2.424.0: «★ Guardar filtro» está en src/app/screens/accounts/list/save-filter.ts y el refresco de la barra de ruta en
   src/app/screens/routes/route-listeners.ts. KPI_CAT y RKEY se quedan: los leen Inicio, gráficos, Configuración y rutas.js.
   ============================================================ */

const KPI_CAT = window.delcos.content.indicators();
window.delcos.legacyA.listenToSaveFilter();
const RKEY = () => 'dlc-ruta-' + (PERFIL ? PERFIL.id : '');
window.delcos.legacyA.refreshRouteBar();
