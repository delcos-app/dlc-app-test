// @ts-check
// componentes/graficos.js · los gráficos están en src/app/components/charts (v2.416.0); sus nombres se quedan como adaptadores
// (Analítica, Inicio, la ficha, el portal y Oportunidades los usan). Aquí siguen las reglas de los indicadores de Inicio.

/** @param {string[]} meses @param {number[]} a @param {number[] | null | undefined} b @param {string[]} etiquetas */
function svgBarras(meses, a, b, etiquetas) { return window.delcos.components.monthBars(meses, a, b, etiquetas); }
/** @param {{ n: string, v: number }[]} items @param {(v: number) => string} fmt */
function barrasH(items, fmt) { return window.delcos.components.rankingBars(items, fmt); }
/** @param {number[]} vals @param {[string, ...unknown[]][]} meses */
function anLinea(vals, meses) { return window.delcos.components.sixMonthLine(vals, meses); }
/** @param {{ n: string, v: number }[]} items */
function barrasReparto(items) { return window.delcos.components.shareBars(items); }
/** @param {any} u @param {string} k */
function sparkUnidades(u, k) { return window.delcos.components.unitsSparkline(u, k); }
/** @param {{ n: string, v: number }[]} items */
function svgDonut(items) { return window.delcos.components.donut(items); }
function graficoCanal() { return window.delcos.components.channelChart(); }
/** @param {string} t */
function vacioGrafico(t) { return window.delcos.components.emptyChart(t); }

const KPI_DEF = ['citas', 'urgentes', 'visitas_sem', 'visitas_mes', 'interesados', 'sin_contactar', 'cartera', 'dups'];

const kpiConfig = () => {
  const p = (PERFIL.preferencias || {}).kpis;
  if (Array.isArray(p) && p.length) return p;
  return KPI_CAT.map(k => ({ id: k.id, on: KPI_DEF.includes(k.id), t: '' }));
};

const KPI_CATEGORIA = {
  citas: 'Agenda', citas_7d: 'Agenda', urgentes: 'Cartera', interesados: 'Cartera', sin_contactar: 'Cartera', cartera: 'Cartera',
  sin_visita_60: 'Cartera', sin_horario: 'Calidad del dato', dups: 'Calidad del dato', visitas_sem: 'Actividad', visitas_mes: 'Actividad',
  visitas_7d: 'Actividad', muestras_mes: 'Actividad', material_mes: 'Actividad', uds_mes: 'Ventas (unidades)', prescriptores: 'Ventas (unidades)',
  nuevos_presc: 'Ventas (unidades)', activos_90: 'Ventas (unidades)', conversion: 'Cartera', importe_mes: 'Ventas (importes)', borradores: 'Pedidos'
};

const KPI_PERMISO = { importe_mes: ['E', 1], borradores: ['V', 1], dups: ['Q', 1], sin_horario: ['M', 1] };

/* v2.87.0 · Cada indicador pertenece a un módulo: solo lo ve quien tiene acceso a ese módulo */
const KPI_MOD = {
  citas: 'agenda', visitas_sem: 'agenda', visitas_mes: 'agenda', visitas_7d: 'agenda', citas_7d: 'agenda', muestras_mes: 'agenda', material_mes: 'agenda',
  urgentes: 'directorio', interesados: 'directorio', sin_contactar: 'directorio', cartera: 'directorio', dups: 'directorio', sin_visita_60: 'directorio', sin_horario: 'directorio',
  uds_mes: 'ventas', importe_mes: 'ventas', prescriptores: 'ventas', nuevos_presc: 'ventas', activos_90: 'ventas', borradores: 'ventas',
  conversion: 'analitica'
};

// Indicadores con icono, explicación breve y, cuando se puede, comparación
const KPI_ICO = { citas: '📅', urgentes: '⚠️', visitas_sem: '📝', visitas_mes: '🗓️', interesados: '✨', sin_contactar: '📇', cartera: '🩺', dups: '🧩',
  sin_visita_60: '⏳', sin_horario: '🕘', uds_mes: '📦', prescriptores: '👥', nuevos_presc: '🌱', activos_90: '🔁', conversion: '📈',
  importe_mes: '€', borradores: '✏️', muestras_mes: '🎁', material_mes: '📚', citas_7d: '📆', visitas_7d: '🧭' };

function kpiPermitidoBase(c) {
  if (!c) return false;
  if (c.admin && !puede('administrar')) return false;
  if (KPI_MOD[c.id] && !puedeModulo(KPI_MOD[c.id])) return false;
  const r = KPI_PERMISO[c.id];
  return !r || nivelDe2(r[0]) >= r[1];
}

function kpiPermitido(c) {
  if (c && c.id === 'dups') return puedeDuplicados() && kpiPermitidoBase(Object.assign({}, c, { admin: false }));
  return kpiPermitidoBase(c);
}
